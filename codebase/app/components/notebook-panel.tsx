"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

export type DocItem = {
  id: string;
  type: "text" | "image";
  text?: string;
  previewUrl?: string;
  label?: string;
};

export function renderMarkdownWithTables(text: string) {
  if (!text) return null;

  // Regex to split text by Markdown Table blocks (| header | header |\n|---|---|...)
  const tableRegex = /((?:\|[^\n]+\|\r?\n){2,}(?:\|[^\n]+\|\r?\n?)*)/g;
  const parts = text.split(tableRegex);

  return parts.map((part, index) => {
    const trimmed = part.trim();
    if (trimmed.startsWith("|") && trimmed.includes("|-")) {
      const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().startsWith("|"));
      if (lines.length >= 2) {
        const headerCells = lines[0]
          .split("|")
          .map((c) => c.trim())
          .filter((_, i, arr) => i > 0 && i < arr.length - 1);

        const dataRows = lines.slice(2).map((line) =>
          line
            .split("|")
            .map((c) => c.trim())
            .filter((_, i, arr) => i > 0 && i < arr.length - 1),
        );

        return (
          <div key={`table-${index}`} className="gdoc-markdown-table-wrapper">
            <table className="gdoc-markdown-table">
              <thead>
                <tr>
                  {headerCells.map((cell, hIdx) => (
                    <th key={hIdx}>
                      <ReactMarkdown>{cell}</ReactMarkdown>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataRows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx}>
                        <ReactMarkdown>{cell}</ReactMarkdown>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
    }
    return <ReactMarkdown key={`text-${index}`}>{part}</ReactMarkdown>;
  });
}

export function NotebookPanel({
  items,
  onUpdateItemText,
  onDeleteItem,
  onAddTextParagraph,
  onClearAll,
  onNormalizeItem,
}: {
  items: DocItem[];
  onUpdateItemText: (id: string, newText: string) => void;
  onDeleteItem: (id: string) => void;
  onAddTextParagraph: (text?: string) => void;
  onClearAll: () => void;
  onNormalizeItem: (id: string) => Promise<void>;
}) {
  const [isNormalizing, setIsNormalizing] = useState(false);
  const [activeTab, setActiveTab] = useState<"doc" | "preview">("doc");
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  const activeTextItem = items.find((i) => i.id === activeItemId && i.type === "text");
  const canNormalizeActive = Boolean(activeTextItem && activeTextItem.text?.trim());

  async function handleNormalizeItem(targetId: string) {
    if (isNormalizing) return;
    setIsNormalizing(true);
    try {
      await onNormalizeItem(targetId);
    } finally {
      setIsNormalizing(false);
    }
  }

  function exportMarkdown() {
    if (items.length === 0) return;
    const lines: string[] = ["# SỔ TAY BÀI GIẢNG SLIDE\n"];
    items.forEach((item) => {
      if (item.type === "image" && item.previewUrl) {
        lines.push(`![${item.label || "Hình ảnh"}](${item.previewUrl})\n`);
      } else if (item.text) {
        lines.push(`${item.text}\n`);
      }
    });

    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `so-tay-vlearn-${Date.now()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={`notebook-container${isExpanded ? " is-fullscreen" : ""}`} data-testid="notebook-panel">
      {/* Google Doc Toolbar */}
      <div className="gdoc-toolbar">
        <div className="gdoc-mode-tabs">
          <button
            type="button"
            className={`gdoc-mode-btn${activeTab === "doc" ? " active" : ""}`}
            onClick={() => setActiveTab("doc")}
          >
            Soạn thảo ({items.length})
          </button>
          <button
            type="button"
            className={`gdoc-mode-btn${activeTab === "preview" ? " active" : ""}`}
            onClick={() => setActiveTab("preview")}
          >
            Xem trước
          </button>
        </div>

        <div className="gdoc-action-group">
          <button
            className="gdoc-tool-btn expand-btn"
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Thu nhỏ lại sidebar" : "Phóng to toàn màn hình để dễ đọc & sửa bài"}
          >
            {isExpanded ? "↙ Thu nhỏ" : "⛶ Mở rộng"}
          </button>
          <button
            className="gdoc-tool-btn primary"
            type="button"
            disabled={!canNormalizeActive || isNormalizing}
            onClick={() => activeItemId && handleNormalizeItem(activeItemId)}
            title={
              canNormalizeActive
                ? "AI chuẩn hóa định dạng (Bảng/Bold/Markdown) riêng cho đoạn văn đang chọn"
                : "Hãy nhấp chuột chọn 1 đoạn văn bản bên dưới để dùng AI chuẩn hóa đoạn đó"
            }
            data-testid="normalize-notebook-btn"
          >
            {isNormalizing ? (
              <>
                <span className="spinner small" /> Đang chuẩn hóa...
              </>
            ) : (
              <>AI Chuẩn hóa</>
            )}
          </button>
          <button
            className="gdoc-tool-btn"
            type="button"
            disabled={items.length === 0}
            onClick={exportMarkdown}
            title="Tải sổ tay về máy (.md)"
          >
            Xuất Doc
          </button>
          <button
            className="gdoc-tool-btn danger"
            type="button"
            disabled={items.length === 0}
            onClick={onClearAll}
            title="Xóa toàn bộ trang tài liệu"
          >
            Xóa trang
          </button>
        </div>
      </div>

      {/* Pure Google Doc Document Sheet */}
      <div className="gdoc-page-wrapper">
        <div className="gdoc-paper-sheet pure-doc">
          {items.length === 0 ? (
            <div className="gdoc-empty-doc">
              <div className="gdoc-empty-illustration">📄</div>
              <h3>Trang tài liệu đang trống</h3>
              <p>
                Rê chuột lên bất kỳ vùng khoanh nào trên slide để chọn <strong>Dán chữ</strong> hoặc <strong>Dán hình</strong> trực tiếp vào đây mà không bị dính mã base64!
              </p>
              <button
                type="button"
                className="gdoc-add-first-paragraph-btn"
                onClick={() => onAddTextParagraph("")}
              >
                + Soạn thảo đoạn văn mới
              </button>
            </div>
          ) : activeTab === "doc" ? (
            <div className="gdoc-doc-stream">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className={`gdoc-stream-item type-${item.type}${activeItemId === item.id ? " is-active" : ""}`}
                >
                  {item.type === "image" ? (
                    <div className="gdoc-real-image-card">
                      <div className="gdoc-image-bar">
                        <span className="gdoc-img-tag-badge">{item.label || `Hình ${index + 1}`}</span>
                        <button
                          type="button"
                          className="gdoc-img-remove-btn"
                          onClick={() => onDeleteItem(item.id)}
                          title="Xóa hình này"
                        >
                          ✕ Xóa hình
                        </button>
                      </div>
                      <div className="gdoc-image-view">
                        <img src={item.previewUrl} alt={item.label || "Ảnh đính kèm"} />
                      </div>
                    </div>
                  ) : (
                    <div className="gdoc-text-paragraph-card">
                      <textarea
                        className="gdoc-paragraph-textarea"
                        value={item.text || ""}
                        onFocus={() => setActiveItemId(item.id)}
                        onClick={() => setActiveItemId(item.id)}
                        onChange={(e) => onUpdateItemText(item.id, e.target.value)}
                        placeholder="Gõ nội dung bài chép (Nhấp chọn để AI chuẩn hóa)..."
                        rows={Math.max(2, (item.text || "").split("\n").length + 1)}
                      />
                    </div>
                  )}
                </div>
              ))}

              <div className="gdoc-stream-footer">
                <button
                  type="button"
                  className="gdoc-add-paragraph-btn"
                  onClick={() => onAddTextParagraph("")}
                >
                  + Thêm đoạn văn mới
                </button>
              </div>
            </div>
          ) : (
            <div className="gdoc-markdown-preview-sheet">
              {items.map((item) => (
                <div key={item.id} className="gdoc-preview-item">
                  {item.type === "image" ? (
                    <div className="gdoc-preview-image-wrap">
                      <img src={item.previewUrl} alt={item.label || "Ảnh đính kèm"} />
                    </div>
                  ) : (
                    renderMarkdownWithTables(item.text || "")
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
