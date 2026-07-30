"use client";
/* eslint-disable @next/next/no-img-element -- Crop previews are in-memory data URLs. */

import { ChangeEvent, PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { ChatWidget } from "./components/chat-widget";

type Point = { x: number; y: number };

export type SelectionRegion = {
  id: string;
  label: string;
  color: { stroke: string; fill: string; badge: string };
  points: Point[];
  isClosed: boolean;
  previewUrl?: string;
  previewWidth?: number;
  previewHeight?: number;
  parsedText?: string;
  parseError?: string;
  isParsing?: boolean;
};

const REGION_COLORS = [
  { stroke: "#f59e0b", fill: "rgba(245, 158, 11, 0.15)", badge: "#d97706" }, // Amber
  { stroke: "#3b82f6", fill: "rgba(59, 130, 246, 0.15)", badge: "#2563eb" }, // Blue
  { stroke: "#10b981", fill: "rgba(16, 185, 129, 0.15)", badge: "#059669" }, // Emerald
  { stroke: "#ec4899", fill: "rgba(236, 72, 153, 0.15)", badge: "#db2777" }, // Pink
  { stroke: "#8b5cf6", fill: "rgba(139, 92, 246, 0.15)", badge: "#7c3aed" }, // Purple
  { stroke: "#06b6d4", fill: "rgba(6, 182, 212, 0.15)", badge: "#0891b2" },  // Cyan
];

function Icon({ name }: { name: "upload" | "lasso" | "trash" | "play" | "left" | "right" | "refresh" }) {
  const paths = {
    upload: <><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M5 20h14" /></>,
    lasso: <><path d="M7.5 20.5c-1.8 0-3-1-3-2.4 0-1.5 1.4-2.6 3.3-2.6 1.7 0 3.2.8 3.2 2.2 0 1.6-1.6 2.8-3.5 2.8Z" /><path d="M11 17.7c5.1-.4 8.5-3.1 8.5-6.7 0-4-3.5-7-8-7s-8 2.8-8 6.3c0 2.4 1.7 4.3 4.1 5.1" /></>,
    trash: <><path d="M4 7h16" /><path d="M9 3h6l1 4H8l1-4Z" /><path d="m7 7 1 14h8l1-14" /></>,
    play: <path d="m9 7 8 5-8 5V7Z" />,
    left: <path d="m15 18-6-6 6-6" />,
    right: <path d="m9 18 6-6-6-6" />,
    refresh: <><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></>,
  };
  return <svg aria-hidden="true" className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef(false);

  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [fileName, setFileName] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Multi-region states
  const [regions, setRegions] = useState<SelectionRegion[]>([]);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);

  const totalPages = pdf?.numPages ?? 0;
  const isAnyParsing = regions.some((r) => r.isParsing);

  function clearAllSelections() {
    drawingRef.current = false;
    setCurrentPoints([]);
    setRegions([]);
  }

  function deleteRegion(id: string) {
    setRegions((prev) => prev.filter((r) => r.id !== id));
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Vui lòng chọn đúng định dạng PDF.");
      event.target.value = "";
      return;
    }

    setIsLoading(true);
    setError("");
    clearAllSelections();
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      const bytes = new Uint8Array(await file.arrayBuffer());
      const loadedPdf = await pdfjs.getDocument({
        data: bytes,
        cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
        cMapPacked: true,
        standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
      }).promise;
      await pdf?.destroy();
      setPdf(loadedPdf);
      setFileName(file.name);
      setPageNumber(1);
    } catch (err) {
      console.error("Error opening PDF file:", err);
      setError("Không thể mở file PDF này. Hãy thử một file khác.");
      setPdf(null);
      setFileName("");
    } finally {
      setIsLoading(false);
      event.target.value = "";
    }
  }

  useEffect(() => {
    if (!pdf || !canvasRef.current || !overlayRef.current || !stageRef.current) return;
    let cancelled = false;
    let renderTask: { cancel: () => void; promise: Promise<unknown> } | null = null;

    async function renderPage() {
      setIsLoading(true);
      setError("");
      try {
        const page = await pdf!.getPage(pageNumber);
        if (cancelled) return;
        const baseViewport = page.getViewport({ scale: 1 });
        const stageWidth = stageRef.current!.clientWidth;
        const availableWidth = Math.max(280, stageWidth - 48);
        const availableHeight = Math.min(window.innerHeight * 0.64, 670);
        const scale = Math.min(availableWidth / baseViewport.width, availableHeight / baseViewport.height, 1.8);
        const viewport = page.getViewport({ scale });
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const canvas = canvasRef.current!;
        const overlay = overlayRef.current!;
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) throw new Error("Canvas unavailable");

        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        overlay.width = canvas.width;
        overlay.height = canvas.height;
        overlay.style.width = canvas.style.width;
        overlay.style.height = canvas.style.height;
        renderTask = page.render({
          canvas,
          canvasContext: context,
          viewport,
          transform: dpr === 1 ? undefined : [dpr, 0, 0, dpr, 0, 0],
        });
        await renderTask.promise;
      } catch (renderError) {
        if (!cancelled && (renderError as { name?: string }).name !== "RenderingCancelledException") {
          setError("Không thể render trang PDF này.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void renderPage();
    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [pdf, pageNumber]);

  // Render all regions and current active stroke on overlay canvas
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const context = overlay.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, overlay.width, overlay.height);

    // 1. Render all saved regions
    regions.forEach((region, index) => {
      if (region.points.length < 2) return;
      context.save();
      context.beginPath();
      context.moveTo(region.points[0].x * overlay.width, region.points[0].y * overlay.height);
      for (let i = 1; i < region.points.length; i += 1) {
        context.lineTo(region.points[i].x * overlay.width, region.points[i].y * overlay.height);
      }
      context.closePath();
      context.strokeStyle = region.color.stroke;
      context.lineWidth = Math.max(3, overlay.width / 260);
      context.lineCap = "round";
      context.lineJoin = "round";
      context.shadowColor = "rgba(0, 0, 0, 0.15)";
      context.shadowBlur = 3;
      context.stroke();
      context.fillStyle = region.color.fill;
      context.fill();

      // Render Region Badge Tag (#1, #2...) near starting point
      const startX = region.points[0].x * overlay.width;
      const startY = region.points[0].y * overlay.height;
      const badgeRadius = 11;
      context.beginPath();
      context.arc(startX, startY, badgeRadius, 0, Math.PI * 2);
      context.fillStyle = region.color.badge;
      context.shadowColor = "rgba(0,0,0,0.3)";
      context.shadowBlur = 4;
      context.fill();
      context.strokeStyle = "#ffffff";
      context.lineWidth = 2;
      context.stroke();

      context.fillStyle = "#ffffff";
      context.font = "bold 11px Inter, sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(`${index + 1}`, startX, startY + 0.5);
      context.restore();
    });

    // 2. Render current active stroke being drawn
    if (currentPoints.length >= 2) {
      context.save();
      context.beginPath();
      context.moveTo(currentPoints[0].x * overlay.width, currentPoints[0].y * overlay.height);
      for (let i = 1; i < currentPoints.length; i += 1) {
        context.lineTo(currentPoints[i].x * overlay.width, currentPoints[i].y * overlay.height);
      }
      context.strokeStyle = "#f59e0b";
      context.lineWidth = Math.max(3.5, overlay.width / 260);
      context.lineCap = "round";
      context.lineJoin = "round";
      context.stroke();
      context.restore();
    }
  }, [regions, currentPoints]);

  function pointFromEvent(event: ReactPointerEvent<HTMLCanvasElement>): Point {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
    };
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (isLoading) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    setCurrentPoints([pointFromEvent(event)]);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const nextPoint = pointFromEvent(event);
    setCurrentPoints((current) => {
      const last = current[current.length - 1];
      if (last && Math.hypot(nextPoint.x - last.x, nextPoint.y - last.y) < 0.003) return current;
      return [...current, nextPoint];
    });
  }

  function cropRegion(regionPoints: Point[]) {
    const source = canvasRef.current;
    if (!source || regionPoints.length < 3) return null;

    const pixelPoints = regionPoints.map((point) => ({
      x: point.x * source.width,
      y: point.y * source.height,
    }));
    const xs = pixelPoints.map((point) => point.x);
    const ys = pixelPoints.map((point) => point.y);
    const padding = Math.max(12, Math.round(source.width / 80));
    const minX = Math.max(0, Math.floor(Math.min(...xs)));
    const minY = Math.max(0, Math.floor(Math.min(...ys)));
    const maxX = Math.min(source.width, Math.ceil(Math.max(...xs)));
    const maxY = Math.min(source.height, Math.ceil(Math.max(...ys)));
    const output = document.createElement("canvas");
    output.width = Math.max(1, maxX - minX + padding * 2);
    output.height = Math.max(1, maxY - minY + padding * 2);
    const context = output.getContext("2d");
    if (!context) return null;

    context.save();
    context.translate(padding - minX, padding - minY);
    context.beginPath();
    context.moveTo(pixelPoints[0].x, pixelPoints[0].y);
    for (let index = 1; index < pixelPoints.length; index += 1) {
      context.lineTo(pixelPoints[index].x, pixelPoints[index].y);
    }
    context.closePath();
    context.clip();
    context.drawImage(source, 0, 0);
    context.restore();

    return {
      url: output.toDataURL("image/png"),
      width: output.width,
      height: output.height,
    };
  }

  async function parseRegionOCR(regionId: string, previewUrl: string) {
    setRegions((prev) =>
      prev.map((r) => (r.id === regionId ? { ...r, isParsing: true, parseError: "", parsedText: "" } : r))
    );
    try {
      const imageBlob = await (await fetch(previewUrl)).blob();
      const formData = new FormData();
      formData.append("file", imageBlob, `${regionId}.png`);
      const response = await fetch("/api/parse-selection", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as { markdown?: string; error?: string };
      if (!response.ok) throw new Error(payload.error || "Không thể parse ảnh đã khoanh vùng.");
      const markdown = payload.markdown?.trim() || "Không tìm thấy nội dung text trong ảnh đã chọn.";
      setRegions((prev) =>
        prev.map((r) => (r.id === regionId ? { ...r, parsedText: markdown, isParsing: false } : r))
      );
    } catch (parseFailure) {
      const errorMsg = parseFailure instanceof Error ? parseFailure.message : "Không thể parse ảnh đã khoanh vùng.";
      setRegions((prev) =>
        prev.map((r) => (r.id === regionId ? { ...r, parseError: errorMsg, isParsing: false } : r))
      );
    }
  }

  function finishDrawing(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);

    if (currentPoints.length >= 3) {
      const cropped = cropRegion(currentPoints);
      const index = regions.length;
      const color = REGION_COLORS[index % REGION_COLORS.length];
      const newRegion: SelectionRegion = {
        id: `region-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        label: `Vùng ${index + 1}`,
        color,
        points: currentPoints,
        isClosed: true,
        previewUrl: cropped?.url,
        previewWidth: cropped?.width,
        previewHeight: cropped?.height,
      };

      setRegions((prev) => [...prev, newRegion]);
      if (cropped?.url) {
        void parseRegionOCR(newRegion.id, cropped.url);
      }
    }
    setCurrentPoints([]);
  }

  function processAllRegions() {
    regions.forEach((region) => {
      if (region.previewUrl && !region.isParsing) {
        void parseRegionOCR(region.id, region.previewUrl);
      }
    });
  }

  const chooseFile = () => fileInputRef.current?.click();
  const goToPage = (nextPage: number) => {
    clearAllSelections();
    setPageNumber(Math.max(1, Math.min(totalPages, nextPage)));
  };
  const hasRegions = regions.length > 0;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark">SL</div>
        <div><p className="eyebrow">FREEHAND SLIDE LAB</p><h1>Khoanh vùng nội dung trên slide</h1></div>
        <button className="upload-button" type="button" onClick={chooseFile} data-testid="upload-button"><Icon name="upload" />Tải PDF từ máy</button>
        <input ref={fileInputRef} className="visually-hidden" type="file" accept="application/pdf,.pdf" onChange={handleFileChange} data-testid="upload-input" />
      </header>

      <section className="workspace">
        <div className="document-column">
          <div className="toolbar" aria-label="Công cụ khoanh vùng">
            <div className="tool-group">
              <button className="tool-button active" type="button"><Icon name="lasso" />Khoanh vùng ({regions.length})</button>
              <button className="tool-button" type="button" disabled={!hasRegions && currentPoints.length === 0} onClick={clearAllSelections} data-testid="clear-selection"><Icon name="trash" />Xóa tất cả vùng</button>
            </div>
            <div className="file-status" title={fileName || "Chưa có tài liệu"}><span className={pdf ? "status-dot ready" : "status-dot"} />{fileName || "Chưa có tài liệu"}</div>
            <button className="process-button" type="button" disabled={!hasRegions || isAnyParsing} onClick={processAllRegions} data-testid="process-button"><Icon name="play" />{isAnyParsing ? "Parsing OCR..." : "Process OCR"}</button>
          </div>

          <div className="slide-frame">
            <div className="slide-meta"><span>Trang {pdf ? `${pageNumber} / ${totalPages}` : "— / —"}</span><span>{fileName || "PDF local"}</span></div>
            <div className="slide-stage" ref={stageRef} data-testid="slide-stage">
              {!pdf && !isLoading && (
                <div className="empty-state">
                  <div className="empty-icon"><Icon name="upload" /></div>
                  <h2>Chọn một file PDF để bắt đầu</h2>
                  <p>Slide sẽ hiển thị tại đây. Bạn có thể khoanh nhiều vùng khác nhau bằng chuột hoặc bút.</p>
                  <button type="button" onClick={chooseFile}>Chọn PDF</button>
                </div>
              )}
              {pdf && (
                <div className="canvas-stack">
                  <canvas ref={canvasRef} className="pdf-canvas" data-testid="pdf-canvas" />
                  <canvas
                    ref={overlayRef}
                    className="selection-canvas"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={finishDrawing}
                    onPointerCancel={finishDrawing}
                    data-testid="selection-canvas"
                    data-points={currentPoints.length || (regions[regions.length - 1]?.points.length ?? 0)}
                    data-closed={hasRegions || currentPoints.length >= 3}
                    aria-label="Vùng vẽ khoanh tự do đa phân vùng"
                  />
                </div>
              )}
              {isLoading && <div className="loading-overlay"><span className="spinner" />Đang xử lý PDF…</div>}
              {error && <div className="error-message" role="alert">{error}</div>}
            </div>
          </div>

          <nav className="pager" aria-label="Điều hướng trang PDF">
            <button type="button" disabled={!pdf || pageNumber <= 1 || isLoading} onClick={() => goToPage(pageNumber - 1)} aria-label="Trang trước" data-testid="prev-page"><Icon name="left" /></button>
            <span>Trang <strong>{pdf ? pageNumber : "—"}</strong> / {pdf ? totalPages : "—"}</span>
            <button type="button" disabled={!pdf || pageNumber >= totalPages || isLoading} onClick={() => goToPage(pageNumber + 1)} aria-label="Trang tiếp" data-testid="next-page"><Icon name="right" /></button>
          </nav>
        </div>

        <aside className="preview-panel">
          <div className="preview-heading">
            <div><p className="eyebrow">KẾT QUẢ PHÂN TÍCH</p><h2>Danh sách phân vùng ({regions.length})</h2></div>
            <span className={hasRegions ? "preview-badge ready" : "preview-badge"}>{hasRegions ? `${regions.length} Vùng` : "Preview"}</span>
          </div>

          {hasRegions ? (
            <div className="region-list" data-testid="preview-result">
              {regions.map((region) => (
                <div key={region.id} className="region-card">
                  <div className="region-card-header">
                    <div className="region-title">
                      <span className="region-color-dot" style={{ backgroundColor: region.color.stroke }} />
                      <span>{region.label}</span>
                    </div>
                    <div className="region-card-actions">
                      <button
                        className="region-action-btn parse-btn"
                        type="button"
                        disabled={region.isParsing}
                        onClick={() => region.previewUrl && parseRegionOCR(region.id, region.previewUrl)}
                        title="Chạy lại OCR"
                      >
                        <Icon name="refresh" /> {region.isParsing ? "Parsing..." : "OCR"}
                      </button>
                      <button
                        className="region-action-btn"
                        type="button"
                        onClick={() => deleteRegion(region.id)}
                        title="Xóa vùng này"
                      >
                        <Icon name="trash" /> Xóa
                      </button>
                    </div>
                  </div>

                  {region.previewUrl && (
                    <div className="preview-image-wrap">
                      <img src={region.previewUrl} alt={`Ảnh cắt ${region.label}`} data-testid="preview-image" />
                    </div>
                  )}

                  <div className="preview-caption">
                    <span>PNG · {region.label}</span>
                    <span>{region.previewWidth} × {region.previewHeight}px</span>
                  </div>

                  <div className="parsed-output">
                    <div className="parsed-output-heading">
                      <h3>Phân tích OCR ({region.label})</h3>
                      {region.isParsing && <span><span className="spinner small" />Đang parse</span>}
                    </div>
                    {region.parseError ? (
                      <p className="parse-error" role="alert">{region.parseError}</p>
                    ) : (
                      <textarea
                        readOnly
                        value={region.parsedText || ""}
                        placeholder={region.isParsing ? "Đang gửi ảnh vùng chọn tới LightOn OCR..." : "Text OCR sẽ hiển thị tại đây."}
                        aria-label={`Text sau khi parse từ ${region.label}`}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="preview-empty">
              <div className="preview-placeholder"><Icon name="lasso" /></div>
              <h3>Chưa có vùng nào được khoanh</h3>
              <p>Vẽ một hoặc nhiều đường khoanh tự do quanh các vùng nội dung khác nhau trên slide.</p>
            </div>
          )}

          <div className="hint-card" style={{ marginTop: 20 }}>
            <span>01</span>
            <p>Mỗi phân vùng được cắt riêng và gửi tới OCR độc lập, không bị gộp chung nội dung.</p>
          </div>
        </aside>
      </section>

      <ChatWidget regions={regions} />
    </main>
  );
}
