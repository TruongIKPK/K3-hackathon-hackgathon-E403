"use client";
/* eslint-disable @next/next/no-img-element -- The crop preview is an in-memory data URL. */

import { ChangeEvent, PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";

type Point = { x: number; y: number };

function Icon({ name }: { name: "upload" | "lasso" | "trash" | "play" | "left" | "right" }) {
  const paths = {
    upload: <><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M5 20h14" /></>,
    lasso: <><path d="M7.5 20.5c-1.8 0-3-1-3-2.4 0-1.5 1.4-2.6 3.3-2.6 1.7 0 3.2.8 3.2 2.2 0 1.6-1.6 2.8-3.5 2.8Z" /><path d="M11 17.7c5.1-.4 8.5-3.1 8.5-6.7 0-4-3.5-7-8-7s-8 2.8-8 6.3c0 2.4 1.7 4.3 4.1 5.1" /></>,
    trash: <><path d="M4 7h16" /><path d="M9 3h6l1 4H8l1-4Z" /><path d="m7 7 1 14h8l1-14" /></>,
    play: <path d="m9 7 8 5-8 5V7Z" />,
    left: <path d="m15 18-6-6 6-6" />,
    right: <path d="m9 18 6-6-6-6" />,
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
  const [points, setPoints] = useState<Point[]>([]);
  const [isClosed, setIsClosed] = useState(false);
  const [preview, setPreview] = useState<{ url: string; width: number; height: number } | null>(null);
  const [parsedText, setParsedText] = useState("");
  const [parseError, setParseError] = useState("");
  const [isParsing, setIsParsing] = useState(false);

  const totalPages = pdf?.numPages ?? 0;

  function clearSelection() {
    drawingRef.current = false;
    setPoints([]);
    setIsClosed(false);
    setPreview(null);
    setParsedText("");
    setParseError("");
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
    clearSelection();
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      const bytes = new Uint8Array(await file.arrayBuffer());
      const loadedPdf = await pdfjs.getDocument({ data: bytes }).promise;
      await pdf?.destroy();
      setPdf(loadedPdf);
      setFileName(file.name);
      setPageNumber(1);
    } catch {
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

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const context = overlay.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, overlay.width, overlay.height);
    if (points.length < 2) return;

    context.save();
    context.beginPath();
    context.moveTo(points[0].x * overlay.width, points[0].y * overlay.height);
    for (let index = 1; index < points.length; index += 1) {
      context.lineTo(points[index].x * overlay.width, points[index].y * overlay.height);
    }
    if (isClosed) context.closePath();
    context.strokeStyle = "#f59e0b";
    context.lineWidth = Math.max(4, overlay.width / 260);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.shadowColor = "rgba(133, 77, 14, .2)";
    context.shadowBlur = 2;
    context.stroke();
    if (isClosed) {
      context.fillStyle = "rgba(245, 158, 11, .08)";
      context.fill();
    }
    context.restore();
  }, [points, isClosed]);


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
    setIsClosed(false);
    setPreview(null);
    setParsedText("");
    setParseError("");
    setPoints([pointFromEvent(event)]);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const nextPoint = pointFromEvent(event);
    setPoints((current) => {
      const last = current[current.length - 1];
      if (last && Math.hypot(nextPoint.x - last.x, nextPoint.y - last.y) < 0.003) return current;
      return [...current, nextPoint];
    });
  }

  function finishDrawing(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setPoints((current) => {
      if (current.length >= 3) setIsClosed(true);
      return current;
    });
  }

  async function parseSelectionImage(dataUrl: string) {
    setIsParsing(true);
    setParseError("");
    setParsedText("");
    try {
      const imageBlob = await (await fetch(dataUrl)).blob();
      const formData = new FormData();
      formData.append("file", imageBlob, "selection.png");
      const response = await fetch("/api/parse-selection", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as { markdown?: string; error?: string };
      if (!response.ok) throw new Error(payload.error || "Không thể parse ảnh đã khoanh vùng.");
      setParsedText(payload.markdown?.trim() || "Không tìm thấy nội dung text trong ảnh đã chọn.");
    } catch (parseFailure) {
      setParseError(parseFailure instanceof Error ? parseFailure.message : "Không thể parse ảnh đã khoanh vùng.");
    } finally {
      setIsParsing(false);
    }
  }

  function processSelection() {
    const source = canvasRef.current;
    if (!source || !isClosed || points.length < 3) return;
    setParseError("");
    setParsedText("");

    const pixelPoints = points.map((point) => ({
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
    if (!context) return;

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

    const url = output.toDataURL("image/png");
    setPreview({
      url,
      width: output.width,
      height: output.height,
    });
    void parseSelectionImage(url);
  }

  const chooseFile = () => fileInputRef.current?.click();
  const goToPage = (nextPage: number) => {
    clearSelection();
    setPageNumber(Math.max(1, Math.min(totalPages, nextPage)));
  };
  const hasSelection = isClosed && points.length >= 3;

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
              <button className="tool-button active" type="button"><Icon name="lasso" />Khoanh vùng</button>
              <button className="tool-button" type="button" disabled={!hasSelection} onClick={clearSelection} data-testid="clear-selection"><Icon name="trash" />Xóa vùng</button>
            </div>
            <div className="file-status" title={fileName || "Chưa có tài liệu"}><span className={pdf ? "status-dot ready" : "status-dot"} />{fileName || "Chưa có tài liệu"}</div>
            <button className="process-button" type="button" disabled={!hasSelection || isParsing} onClick={processSelection} data-testid="process-button"><Icon name="play" />{isParsing ? "Parsing..." : "Process"}</button>
          </div>

          <div className="slide-frame">
            <div className="slide-meta"><span>Trang {pdf ? `${pageNumber} / ${totalPages}` : "— / —"}</span><span>{fileName || "PDF local"}</span></div>
            <div className="slide-stage" ref={stageRef} data-testid="slide-stage">
              {!pdf && !isLoading && (
                <div className="empty-state">
                  <div className="empty-icon"><Icon name="upload" /></div>
                  <h2>Chọn một file PDF để bắt đầu</h2>
                  <p>Slide sẽ hiển thị tại đây. Sau đó, dùng chuột hoặc bút để vẽ một vùng tự do.</p>
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
                    data-points={points.length}
                    data-closed={isClosed}
                    aria-label="Vùng vẽ khoanh tự do"
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
          <div className="preview-heading"><div><p className="eyebrow">KẾT QUẢ</p><h2>Vùng đã chọn</h2></div><span className={preview ? "preview-badge ready" : "preview-badge"}>{preview ? "Đã xử lý" : "Preview"}</span></div>
          {preview ? (
            <div className="preview-result" data-testid="preview-result">
              <div className="preview-image-wrap">
                <img src={preview.url} alt="Ảnh cắt từ vùng khoanh tự do" data-testid="preview-image" />
              </div>
              <div className="preview-caption"><span>PNG · mặt nạ freehand</span><span>{preview.width} × {preview.height}px</span></div>
              <div className="parsed-output">
                <div className="parsed-output-heading">
                  <h3>Text sau khi parse</h3>
                  {isParsing && <span><span className="spinner small" />Đang parse</span>}
                </div>
                {parseError ? (
                  <p className="parse-error" role="alert">{parseError}</p>
                ) : (
                  <textarea
                    readOnly
                    value={parsedText}
                    placeholder={isParsing ? "Đang gửi ảnh đã khoanh vùng tới LightOn..." : "Text parse sẽ hiển thị tại đây."}
                    aria-label="Text sau khi parse từ ảnh đã khoanh vùng"
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="preview-empty">
              <div className="preview-placeholder"><Icon name="lasso" /></div>
              <h3>{hasSelection ? "Vùng khoanh đã sẵn sàng" : "Chưa có vùng được xử lý"}</h3>
              <p>{hasSelection ? "Đường khoanh đã khép kín. Nhấn Process để tạo ảnh xem trước." : <>Vẽ một đường khép kín quanh nội dung, rồi nhấn <strong>Process</strong>.</>}</p>
            </div>
          )}
          <div className="hint-card"><span>01</span><p>Đường vẽ tự do sẽ được dùng làm mặt nạ để cắt đúng phần nội dung bên trong.</p></div>
        </aside>
      </section>
    </main>
  );
}
