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
    page_number: int | None = Field(default=None, alias="pageNumber", ge=1, le=10_000)
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


class SlideContext(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    page_number: int = Field(alias="pageNumber", ge=1, le=10_000)
    text: str = Field(default="", max_length=20_000)
    source_region_ids: list[str] = Field(
        default_factory=list,
        alias="sourceRegionIds",
        max_length=12,
    )
    is_selected_page: bool = Field(default=False, alias="isSelectedPage")

    @field_validator("text")
    @classmethod
    def normalize_slide_text(cls, value: str) -> str:
        return value.strip()

    @field_validator("source_region_ids")
    @classmethod
    def normalize_source_region_ids(cls, values: list[str]) -> list[str]:
        normalized: list[str] = []
        for value in values:
            clean_value = value.strip()
            if not clean_value:
                raise ValueError("sourceRegionIds không được chứa ID rỗng.")
            if clean_value not in normalized:
                normalized.append(clean_value)
        return normalized


class ChatRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    messages: list[ChatMessage] = Field(min_length=1, max_length=40)
    selected_regions: list[SelectedRegion] = Field(
        default_factory=list,
        alias="selectedRegions",
        max_length=12,
    )
    slide_contexts: list[SlideContext] = Field(
        default_factory=list,
        alias="slideContexts",
        max_length=18,
    )

    @model_validator(mode="after")
    def validate_conversation(self) -> "ChatRequest":
        if self.messages[-1].role != "user":
            raise ValueError("Tin nhắn cuối cùng phải có role='user'.")

        message_chars = sum(len(message.content) for message in self.messages)
        region_chars = sum(len(region.parsed_text or "") for region in self.selected_regions)
        slide_chars = sum(len(slide.text) for slide in self.slide_contexts)
        if message_chars + region_chars + slide_chars > 160_000:
            raise ValueError("Tổng nội dung text vượt quá giới hạn 160.000 ký tự.")

        region_ids = {region.id for region in self.selected_regions}
        for slide in self.slide_contexts:
            if any(source_id not in region_ids for source_id in slide.source_region_ids):
                raise ValueError("slideContexts chứa sourceRegionIds không thuộc selectedRegions.")
        return self


class ChatResponse(BaseModel):
    role: Literal["assistant"] = "assistant"
    content: str
    timestamp: datetime


class ErrorResponse(BaseModel):
    error: str
