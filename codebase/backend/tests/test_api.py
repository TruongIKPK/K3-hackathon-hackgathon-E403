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
                "pageNumber": 3,
                "parsedText": "Agent có thể quan sát, lập kế hoạch và sử dụng công cụ.",
                "previewUrl": "data:image/png;base64,aGVsbG8=",
            }
        ],
        "slideContexts": [
            {
                "pageNumber": 2,
                "text": "Slide trước giới thiệu kiến trúc agent.",
                "sourceRegionIds": ["region-1"],
                "isSelectedPage": False,
            },
            {
                "pageNumber": 3,
                "text": "Slide chứa vùng mô tả vòng lặp quan sát, lập kế hoạch và hành động.",
                "sourceRegionIds": ["region-1"],
                "isSelectedPage": True,
            },
            {
                "pageNumber": 4,
                "text": "Slide sau đưa ra ví dụ sử dụng công cụ.",
                "sourceRegionIds": ["region-1"],
                "isSelectedPage": False,
            },
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


def test_returns_guardrail_clarification_without_ocr_and_without_preview() -> None:
    payload = valid_payload()
    payload["selectedRegions"][0]["parsedText"] = ""
    payload["selectedRegions"][0]["previewUrl"] = ""
    response = client.post("/api/chatbot", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["role"] == "assistant"
    assert "OCR" in body["content"]
    datetime.fromisoformat(body["timestamp"].replace("Z", "+00:00"))


def test_triggers_vision_routing_with_low_detail(monkeypatch) -> None:
    captured: dict[str, object] = {}

    def fake_answer(messages) -> AIMessage:
        captured["messages"] = messages
        return AIMessage(content="Đã phân tích sơ đồ thành công [Vùng 1].")

    fake_model = RunnableLambda(fake_answer)
    monkeypatch.setattr(agent_module, "get_chat_model", lambda: fake_model)

    payload = valid_payload()
    payload["messages"][-1]["content"] = "Hãy phân tích hình ảnh và sơ đồ trong Vùng 1"
    response = client.post("/api/chatbot", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["role"] == "assistant"
    assert "Đã phân tích" in body["content"]

    # Verify multimodal message content block attached detail: "low"
    messages = captured.get("messages", [])
    user_msg = messages[-1]
    assert isinstance(user_msg.content, list)
    image_block = user_msg.content[1]
    assert image_block["type"] == "image_url"
    assert image_block["image_url"]["detail"] == "low"


def test_success_response_matches_api_contract(monkeypatch) -> None:
    captured: dict[str, str] = {}

    def fake_answer(prompt) -> AIMessage:
        captured["prompt"] = str(prompt)
        return AIMessage(
            content=(
                "### Giải thích\nAgent có thể lập kế hoạch và dùng công cụ. "
                "[Vùng 1] Ngữ cảnh được mở rộng ở slide chứa vùng. [Slide 3]"
            )
        )

    fake_model = RunnableLambda(fake_answer)
    monkeypatch.setattr(agent_module, "get_chat_model", lambda: fake_model)

    response = client.post("/api/chatbot", json=valid_payload())
    assert response.status_code == 200
    body = response.json()
    assert body["role"] == "assistant"
    assert body["content"].endswith("[Slide 3]")
    assert "Slide 2" in captured["prompt"]
    assert "Slide 3" in captured["prompt"]
    assert "Slide 4" in captured["prompt"]
    assert "slide trước Vùng 1" in captured["prompt"]
    assert set(body) == {"role", "content", "timestamp"}
    datetime.fromisoformat(body["timestamp"].replace("Z", "+00:00"))


def test_rejects_slide_context_with_unknown_region() -> None:
    payload = valid_payload()
    payload["slideContexts"][0]["sourceRegionIds"] = ["missing-region"]
    response = client.post("/api/chatbot", json=payload)
    assert response.status_code == 422
    assert set(response.json()) == {"error"}
