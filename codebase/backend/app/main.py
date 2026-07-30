from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .agent import AgentConfigurationError, chatbot_graph
from .models import ChatRequest, ChatResponse, ErrorResponse
from .settings import get_settings


logger = logging.getLogger("vlearn-chatbot")
settings = get_settings()

app = FastAPI(
    title="VLearn LangChain Chatbot Service",
    version="0.1.0",
    description="LangChain/LangGraph backend implementing POST /api/chatbot.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
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

    return ChatResponse(
        role="assistant",
        content=result["answer"],
        timestamp=datetime.now(timezone.utc),
    )
