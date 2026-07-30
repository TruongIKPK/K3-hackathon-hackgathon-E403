import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type ChatMessage = {
  id?: string;
  role: "user" | "assistant";
  content: string;
};

type SelectedRegion = {
  id: string;
  label: string;
  pageNumber?: number;
  parsedText?: string;
  previewUrl?: string;
};

type SlideContext = {
  pageNumber: number;
  text: string;
  sourceRegionIds: string[];
  isSelectedPage: boolean;
};

type ChatbotPayload = {
  messages: ChatMessage[];
  selectedRegions?: SelectedRegion[];
  slideContexts?: SlideContext[];
};

const DEFAULT_BACKEND_URL = "http://127.0.0.1:8000/api/chatbot";
const MAX_PAYLOAD_BYTES = 10 * 1024 * 1024;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validatePayload(value: unknown): value is ChatbotPayload {
  if (!isRecord(value) || !Array.isArray(value.messages) || value.messages.length === 0) {
    return false;
  }

  const messagesValid = value.messages.every(
    (message) =>
      isRecord(message) &&
      (message.role === "user" || message.role === "assistant") &&
      typeof message.content === "string" &&
      message.content.trim().length > 0,
  );
  if (!messagesValid) return false;

  if (value.selectedRegions !== undefined) {
    if (!Array.isArray(value.selectedRegions) || value.selectedRegions.length > 12) return false;
    const regionsValid = value.selectedRegions.every(
      (region) =>
        isRecord(region) &&
        typeof region.id === "string" &&
        region.id.trim().length > 0 &&
        typeof region.label === "string" &&
        region.label.trim().length > 0 &&
        (region.pageNumber === undefined ||
          (typeof region.pageNumber === "number" && Number.isInteger(region.pageNumber) && region.pageNumber > 0)) &&
        (region.parsedText === undefined || typeof region.parsedText === "string") &&
        (region.previewUrl === undefined || typeof region.previewUrl === "string"),
    );
    if (!regionsValid) return false;
  }

  if (value.slideContexts === undefined) return true;
  if (!Array.isArray(value.slideContexts) || value.slideContexts.length > 18) return false;
  const selectedRegionIds = new Set(
    Array.isArray(value.selectedRegions)
      ? value.selectedRegions
          .filter(isRecord)
          .map((region) => region.id)
          .filter((id): id is string => typeof id === "string")
      : [],
  );

  return value.slideContexts.every(
    (slide) =>
      isRecord(slide) &&
      typeof slide.pageNumber === "number" &&
      Number.isInteger(slide.pageNumber) &&
      slide.pageNumber > 0 &&
      typeof slide.text === "string" &&
      typeof slide.isSelectedPage === "boolean" &&
      Array.isArray(slide.sourceRegionIds) &&
      slide.sourceRegionIds.every(
        (regionId) => typeof regionId === "string" && selectedRegionIds.has(regionId),
      ),
  );
}

function jsonResponse(body: object, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: NextRequest) {
  const declaredLength = Number(request.headers.get("content-length") || "0");
  if (declaredLength > MAX_PAYLOAD_BYTES) {
    return jsonResponse({ error: "Payload vượt quá giới hạn 10 MB." }, 413);
  }

  const body = (await request.json().catch(() => null)) as unknown;
  if (!validatePayload(body)) {
    return jsonResponse(
      { error: "Payload không hợp lệ. Cần messages và selectedRegions đúng định dạng." },
      400,
    );
  }

  if (body.messages.at(-1)?.role !== "user") {
    return jsonResponse({ error: "Tin nhắn cuối cùng phải có role='user'." }, 400);
  }

  const serializedBody = JSON.stringify(body);
  if (new TextEncoder().encode(serializedBody).byteLength > MAX_PAYLOAD_BYTES) {
    return jsonResponse({ error: "Payload vượt quá giới hạn 10 MB." }, 413);
  }

  const backendUrl = process.env.BACKEND_CHATBOT_SERVICE_URL || DEFAULT_BACKEND_URL;
  const configuredTimeout = Number(process.env.CHATBOT_PROXY_TIMEOUT_MS || "50000");
  const timeoutMs = Number.isFinite(configuredTimeout)
    ? Math.min(Math.max(configuredTimeout, 5_000), 120_000)
    : 50_000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const upstream = await fetch(backendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: serializedBody,
      signal: controller.signal,
    });

    const raw = await upstream.text();
    let data: unknown = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = null;
    }

    if (!upstream.ok) {
      const message =
        isRecord(data) && typeof data.error === "string"
          ? data.error
          : "Chatbot AI Service trả về lỗi.";
      return jsonResponse({ error: message }, upstream.status);
    }

    if (
      !isRecord(data) ||
      data.role !== "assistant" ||
      typeof data.content !== "string" ||
      !data.content.trim()
    ) {
      return jsonResponse({ error: "Phản hồi từ Chatbot AI Service không hợp lệ." }, 502);
    }

    return jsonResponse({
      role: "assistant",
      content: data.content,
      timestamp:
        typeof data.timestamp === "string" ? data.timestamp : new Date().toISOString(),
    });
  } catch (error) {
    const isTimeout =
      (error instanceof DOMException && error.name === "AbortError") ||
      (error instanceof Error && error.name === "AbortError");

    return jsonResponse(
      {
        error: isTimeout
          ? "Chatbot AI Service phản hồi quá thời gian."
          : "Không thể kết nối tới Chatbot AI Service.",
      },
      isTimeout ? 504 : 502,
    );
  } finally {
    clearTimeout(timeout);
  }
}
