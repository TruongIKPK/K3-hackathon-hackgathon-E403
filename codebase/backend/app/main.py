from __future__ import annotations

import json
import logging
import time
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .agent import AgentConfigurationError, chatbot_graph
from .models import ChatRequest, ChatResponse, ErrorResponse
from .settings import get_settings


logger = logging.getLogger("vlearn-chatbot")
settings = get_settings()

LOGS_DIR = Path(__file__).resolve().parent.parent / "logs"
LOGS_DIR.mkdir(parents=True, exist_ok=True)
ANALYTICS_FILE = LOGS_DIR / "analytics.jsonl"


def log_analytics_event(event_data: dict) -> None:
    logger.info(
        "[DATA MINING LOG] Type: %s | Regions: %d | Images: %d | Vision: %s | Duration: %.2fms | Tokens: Prompt=%d, Comp=%d, Total=%d",
        event_data.get("request_type"),
        event_data.get("region_count", 0),
        event_data.get("image_count", 0),
        event_data.get("should_use_vision", False),
        event_data.get("duration_ms", 0.0),
        event_data.get("prompt_tokens", 0),
        event_data.get("completion_tokens", 0),
        event_data.get("total_tokens", 0),
    )
    try:
        with open(ANALYTICS_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(event_data, ensure_ascii=False) + "\n")
    except Exception as exc:
        logger.warning("Failed to record analytics event: %s", exc)


app = FastAPI(
    title="VLearn LangChain Chatbot Service",
    version="0.1.0",
    description="LangChain/LangGraph backend implementing POST /api/chatbot.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    _request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    first_error = exc.errors()[0] if exc.errors() else {}
    message = first_error.get("msg", "Payload không hợp lệ.")
    return JSONResponse(
        status_code=422,
        content={"error": f"Payload không hợp lệ: {message}"},
    )


@app.get("/health")
async def health() -> dict[str, object]:
    return {
        "status": "ok",
        "service": "vlearn-langchain-chatbot",
        "modelConfigured": bool(settings.openai_api_key and settings.openai_model),
    }


@app.post(
    "/api/chatbot",
    response_model=ChatResponse,
    responses={
        422: {"model": ErrorResponse},
        502: {"model": ErrorResponse},
        503: {"model": ErrorResponse},
    },
)
async def chatbot(payload: ChatRequest):
    start_time = time.perf_counter()
    user_question = payload.messages[-1].content if payload.messages else ""
    regions = payload.selected_regions or []
    region_count = len(regions)
    images_with_url = [r for r in regions if r.preview_url and r.preview_url.startswith("data:image")]
    image_count = len(images_with_url)

    try:
        result = await chatbot_graph.ainvoke(
            {
                "request": payload,
                "region_context": "",
                "guardrail_response": "",
                "answer": "",
            }
        )
    except AgentConfigurationError as exc:
        return JSONResponse(status_code=503, content={"error": str(exc)})
    except Exception:
        logger.exception("Chatbot graph execution failed")
        return JSONResponse(
            status_code=502,
            content={"error": "Không thể kết nối tới Chatbot AI Service."},
        )

    duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
    should_use_vision = bool(result.get("should_use_vision", False))
    answer_text = result.get("answer", "")
    token_usage = result.get("token_usage") or {}
    prompt_tokens = token_usage.get("prompt_tokens", 0)
    completion_tokens = token_usage.get("completion_tokens", 0)
    total_tokens = token_usage.get("total_tokens", 0)

    if image_count > 0 or should_use_vision:
        request_type = "text_with_images"
    elif region_count > 0:
        request_type = "text_with_regions"
    else:
        request_type = "text_only"

    analytics_event = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "request_type": request_type,
        "question": user_question,
        "region_count": region_count,
        "image_count": image_count,
        "should_use_vision": should_use_vision,
        "response_length": len(answer_text),
        "duration_ms": duration_ms,
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
        "total_tokens": total_tokens,
    }

    log_analytics_event(analytics_event)

    return ChatResponse(
        role="assistant",
        content=answer_text,
        timestamp=datetime.now(timezone.utc),
    )
