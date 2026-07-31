"""Run the live agent against every case declared in eval_base.json."""

from __future__ import annotations

import asyncio
import json
import re
from pathlib import Path
from typing import Any

import pytest

from app.agent import chatbot_graph
from app.models import ChatRequest
from app.settings import get_settings


pytestmark = pytest.mark.live_agent
EVAL_FILE = Path(__file__).with_name("eval_base.json")


def load_eval_cases() -> list[dict[str, Any]]:
    with EVAL_FILE.open(encoding="utf-8") as file:
        dataset = json.load(file)

    cases = dataset.get("cases")
    if not isinstance(cases, list) or not cases:
        raise ValueError("eval_base.json phải chứa danh sách 'cases' không rỗng.")
    return cases


EVAL_CASES = load_eval_cases()


def make_request(case: dict[str, Any]) -> ChatRequest:
    document_text = case["document_text"]
    return ChatRequest.model_validate(
        {
            "messages": [
                {
                    "id": f"user-{case['id']}",
                    "role": "user",
                    "content": case["question"],
                }
            ],
            "selectedRegions": [
                {
                    "id": "region-1",
                    "label": "Vùng 1",
                    "pageNumber": 1,
                    "parsedText": document_text,
                }
            ],
            "slideContexts": [
                {
                    "pageNumber": 1,
                    "text": document_text,
                    "sourceRegionIds": ["region-1"],
                    "isSelectedPage": True,
                }
            ],
        }
    )


def ask_agent(case: dict[str, Any]) -> str:
    if not get_settings().openai_api_key:
        pytest.skip("Cần OPENAI_API_KEY để chạy live agent evaluation.")

    result = asyncio.run(
        chatbot_graph.ainvoke(
            {
                "request": make_request(case),
                "region_context": "",
                "slide_context": "",
                "guardrail_response": "",
                "answer": "",
            }
        )
    )
    return result["answer"].strip()


def assert_case(case: dict[str, Any], answer: str) -> None:
    expectation = case["expect"]
    normalized_answer = answer.casefold()
    required_any = expectation.get("required_any", [])
    forbidden_regex = expectation.get("forbidden_regex", [])

    if required_any:
        assert any(
            phrase.casefold() in normalized_answer for phrase in required_any
        ), (
            f"[{case['id']}] Không tìm thấy hành vi mong đợi.\n"
            f"Chấp nhận một trong: {required_any}\n"
            f"Agent trả lời:\n{answer}"
        )

    for pattern in forbidden_regex:
        assert re.search(pattern, answer, flags=re.IGNORECASE) is None, (
            f"[{case['id']}] Câu trả lời chứa nội dung bị cấm bởi "
            f"regex {pattern!r}.\nAgent trả lời:\n{answer}"
        )


@pytest.mark.parametrize(
    "case",
    EVAL_CASES,
    ids=[case["id"] for case in EVAL_CASES],
)
def test_agent_behavior_eval(case: dict[str, Any]) -> None:
    answer = ask_agent(case)
    assert answer, f"[{case['id']}] Agent trả về nội dung rỗng."
    assert_case(case, answer)
