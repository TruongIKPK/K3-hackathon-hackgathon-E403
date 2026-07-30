from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str | None = Field(default=None, max_length=120)
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=12_000)

    @field_validator("content")
    @classmethod
    def normalize_content(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Nội dung tin nhắn không được để trống.")
        return normalized


class SelectedRegion(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    id: str = Field(min_length=1, max_length=160)
    label: str = Field(min_length=1, max_length=120)
    parsed_text: str | None = Field(default=None, alias="parsedText", max_length=20_000)
    preview_url: str | None = Field(default=None, alias="previewUrl", max_length=8_000_000)

    @field_validator("id", "label")
    @classmethod
    def normalize_required_text(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Trường bắt buộc không được để trống.")
        return normalized

    @field_validator("parsed_text")
    @classmethod
    def normalize_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None

    @field_validator("preview_url")
    @classmethod
    def validate_preview_url(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if not value.startswith("data:image/"):
            raise ValueError("previewUrl phải là image Data URL.")
        return value


class ChatRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    messages: list[ChatMessage] = Field(min_length=1, max_length=40)
    selected_regions: list[SelectedRegion] = Field(
        default_factory=list,
        alias="selectedRegions",
        max_length=12,
    )

    @model_validator(mode="after")
    def validate_conversation(self) -> "ChatRequest":
        if self.messages[-1].role != "user":
            raise ValueError("Tin nhắn cuối cùng phải có role='user'.")

        message_chars = sum(len(message.content) for message in self.messages)
        region_chars = sum(len(region.parsed_text or "") for region in self.selected_regions)
        if message_chars + region_chars > 80_000:
            raise ValueError("Tổng nội dung text vượt quá giới hạn 80.000 ký tự.")
        return self


class ChatResponse(BaseModel):
    role: Literal["assistant"] = "assistant"
    content: str
    timestamp: datetime


class ErrorResponse(BaseModel):
    error: str
