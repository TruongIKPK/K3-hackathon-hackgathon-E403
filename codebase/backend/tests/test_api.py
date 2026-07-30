from datetime import datetime

from fastapi.testclient import TestClient
from langchain_core.messages import AIMessage
from langchain_core.runnables import RunnableLambda

import app.agent as agent_module
from app.main import app


client = TestClient(app)


def valid_payload() -> dict:
    return {
        "messages": [
            {
                "id": "init-1",
                "role": "assistant",
                "content": "Xin chào! Tôi là VLearn AI Assistant.",
            },
            {
                "id": "user-1",
                "role": "user",
                "content": "Giải thích nội dung trong Vùng 1",
            },
        ],
        "selectedRegions": [
            {
                "id": "region-1",
                "label": "Vùng 1",
                "parsedText": "Agent có thể quan sát, lập kế hoạch và sử dụng công cụ.",
                "previewUrl": "data:image/png;base64,aGVsbG8=",
            }
        ],
    }


def test_health_endpoint() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_rejects_missing_messages_with_error_contract() -> None:
    response = client.post("/api/chatbot", json={"selectedRegions": []})
    assert response.status_code == 422
    assert set(response.json()) == {"error"}


def test_returns_guardrail_clarification_without_ocr() -> None:
    payload = valid_payload()
    payload["selectedRegions"][0]["parsedText"] = ""
    response = client.post("/api/chatbot", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["role"] == "assistant"
    assert "OCR" in body["content"]
    datetime.fromisoformat(body["timestamp"].replace("Z", "+00:00"))


def test_success_response_matches_api_contract(monkeypatch) -> None:
    fake_model = RunnableLambda(
        lambda _prompt: AIMessage(
            content="### Giải thích\nAgent có thể lập kế hoạch và dùng công cụ. [Vùng 1]"
        )
    )
    monkeypatch.setattr(agent_module, "get_chat_model", lambda: fake_model)

    response = client.post("/api/chatbot", json=valid_payload())
    assert response.status_code == 200
    body = response.json()
    assert body["role"] == "assistant"
    assert body["content"].endswith("[Vùng 1]")
    assert set(body) == {"role", "content", "timestamp"}
    datetime.fromisoformat(body["timestamp"].replace("Z", "+00:00"))
