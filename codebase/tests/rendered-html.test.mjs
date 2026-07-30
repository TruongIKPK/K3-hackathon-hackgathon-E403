import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server renders the Freehand Slide Lab shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>Freehand Slide Lab<\/title>/i);
  assert.match(html, /Khoanh vùng nội dung trên slide/i);
  assert.match(html, /Tải PDF từ máy/i);
  assert.match(html, /Vùng đã chọn/i);
  assert.doesNotMatch(html, /Your site is taking shape|SkeletonPreview/i);
});

test("source contains the PDF, freehand, and mask-crop MVP path", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /import\("pdfjs-dist"\)/);
  assert.match(source, /onPointerDown=\{handlePointerDown\}/);
  assert.match(source, /context\.clip\(\)/);
  assert.match(source, /toDataURL\("image\/png"\)/);
  assert.match(source, /data-testid="preview-image"/);
});
