import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function request(path = "/", init = {}) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${Math.random()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html", ...(init.headers ?? {}) },
      ...init,
    }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server renders the Freehand Slide Lab shell", async () => {
  const response = await request();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>Freehand Slide Lab<\/title>/i);
  assert.match(html, /Khoanh vùng nội dung trên slide/i);
  assert.match(html, /Tải PDF từ máy/i);
  assert.doesNotMatch(html, /Your site is taking shape|SkeletonPreview/i);
});

test("source contains the multi-region OCR and chatbot integration", async () => {
  const [page, chatWidget, chatbotRoute] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/chat-widget.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/chatbot/route.ts", import.meta.url), "utf8"),
  ]);

  assert.match(page, /import\("pdfjs-dist"\)/);
  assert.match(page, /onPointerDown=\{handlePointerDown\}/);
  assert.match(page, /context\.clip\(\)/);
  assert.match(page, /parseRegionOCR/);
  assert.match(page, /regions=\{regions\}/);
  assert.match(page, /pageNumber: number/);
  assert.match(page, /isPinned: boolean/);
  assert.match(page, /togglePinRegion/);
  assert.match(page, /onTraceRegion=\{traceRegion\}/);
  assert.match(page, /region\.pageNumber === pageNumber/);
  assert.match(page, /getTextContent/);
  assert.match(page, /resolveSlideContexts/);
  assert.match(page, /sourceRegionIds/);
  assert.match(chatWidget, /ReactMarkdown/);
  assert.match(chatWidget, /selectedRegions/);
  assert.match(chatWidget, /comparePinnedRegions/);
  assert.match(chatWidget, /contextOverride/);
  assert.match(chatWidget, /addCitationLinks/);
  assert.match(chatWidget, /#source-/);
  assert.match(chatWidget, /#slide-/);
  assert.match(chatWidget, /slideContexts/);
  assert.match(chatWidget, /context-window-note/);
  assert.match(chatbotRoute, /BACKEND_CHATBOT_SERVICE_URL/);
  assert.match(chatbotRoute, /sourceRegionIds/);
  assert.doesNotMatch(chatbotRoute, /Mẫu phản hồi|Đã nhận câu hỏi/);
});

test("chatbot proxy forwards the documented contract to Python", async () => {
  const response = await request("/api/chatbot", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      messages: [
        { id: "init-1", role: "assistant", content: "Xin chào" },
        { id: "user-1", role: "user", content: "Giải thích Vùng 1" },
      ],
      selectedRegions: [
        {
          id: "region-1",
          label: "Vùng 1",
          pageNumber: 3,
          parsedText: "",
          previewUrl: "data:image/png;base64,aGVsbG8=",
        },
      ],
      slideContexts: [
        {
          pageNumber: 2,
          text: "Slide trước giới thiệu kiến trúc agent.",
          sourceRegionIds: ["region-1"],
          isSelectedPage: false,
        },
        {
          pageNumber: 3,
          text: "Slide chứa vùng trình bày vòng lặp agent.",
          sourceRegionIds: ["region-1"],
          isSelectedPage: true,
        },
        {
          pageNumber: 4,
          text: "Slide sau đưa ra ví dụ.",
          sourceRegionIds: ["region-1"],
          isSelectedPage: false,
        },
      ],
    }),
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.role, "assistant");
  assert.match(body.content, /OCR/);
  assert.match(body.timestamp, /^\d{4}-\d{2}-\d{2}T/);
});
