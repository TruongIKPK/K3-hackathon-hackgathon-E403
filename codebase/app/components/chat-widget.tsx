"use client";

import { FormEvent, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { SelectionRegion, SlideContext } from "../page";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function addCitationLinks(content: string, regions: SelectionRegion[]) {
  const regionLinkedContent = regions.reduce((linkedContent, region) => {
    const citation = new RegExp(`\\[${escapeRegExp(region.label)}\\](?!\\()`, "g");
    return linkedContent.replace(citation, `[${region.label}](#source-${region.id})`);
  }, content);
  return regionLinkedContent.replace(/\[Slide\s+(\d+)\](?!\()/gi, (_match, page: string) =>
    `[Slide ${page}](#slide-${page})`,
  );
}

export function ChatWidget({
  regions,
  onTraceRegion,
  onTracePage,
  resolveSlideContexts,
}: {
  regions: SelectionRegion[];
  onTraceRegion: (regionId: string) => void;
  onTracePage: (pageNumber: number) => void;
  resolveSlideContexts: (regions: SelectionRegion[]) => Promise<SlideContext[]>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRegionIds, setSelectedRegionIds] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init-1",
      role: "assistant",
      content:
        "Xin chào! Tôi là **VLearn AI Assistant**. Khi bạn hỏi theo vùng, tôi sẽ dùng vùng khoanh cùng ngữ cảnh slide chứa vùng và hai slide lân cận.",
    },
  ]);

  // Toggle region context inclusion
  function toggleRegionId(id: string) {
    setSelectedRegionIds((prev) =>
      prev.includes(id) ? prev.filter((rId) => rId !== id) : [...prev, id]
    );
  }

  // Active regions to include in context
  const explicitlySelectedRegions = regions.filter((region) => selectedRegionIds.includes(region.id));
  const activeContextRegions =
    selectedRegionIds.length > 0 && explicitlySelectedRegions.length > 0
      ? explicitlySelectedRegions
      : regions;
  const pinnedRegions = regions.filter((region) => region.isPinned);

  async function sendMessage(customText?: string, contextOverride?: SelectionRegion[]) {
    const text = (customText || input).trim();
    if (!text || isLoading) return;

    const contextRegions = contextOverride ?? activeContextRegions;
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customText) setInput("");
    setIsLoading(true);

    try {
      const slideContexts = await resolveSlideContexts(contextRegions);
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          selectedRegions: contextRegions.map((r) => ({
            id: r.id,
            label: r.label,
            pageNumber: r.pageNumber,
            parsedText: r.parsedText,
            previewUrl: r.previewUrl,
          })),
          slideContexts,
        }),
      });

      const payload = (await response.json()) as { content?: string; error?: string };
      if (!response.ok) throw new Error(payload.error || "Lỗi phản hồi từ AI.");

      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: payload.content || "Tôi đã nhận được câu hỏi.",
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Không thể kết nối tới AI Assistant.";
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          role: "assistant",
          content: `⚠️ **Lỗi**: ${errorMsg}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void sendMessage();
  }

  function handleQuickPrompt(promptText: string) {
    void sendMessage(promptText);
  }

  function comparePinnedRegions() {
    if (pinnedRegions.length < 2 || isLoading) return;
    const labels = pinnedRegions.map((region) => `${region.label} (trang ${region.pageNumber})`).join(", ");
    setIsOpen(true);
    setSelectedRegionIds(pinnedRegions.map((region) => region.id));
    void sendMessage(
      `So sánh ${labels}. Hãy nêu điểm giống, khác và trích dẫn từng nhận định theo đúng nhãn vùng.`,
      pinnedRegions,
    );
  }

  return (
    <div className="chat-widget-container">
      {/* Floating Trigger Button when Collapsed */}
      {!isOpen && (
        <div className="chat-trigger-stack">
          {pinnedRegions.length >= 2 && (
            <button
              className="compare-trigger-button"
              type="button"
              onClick={comparePinnedRegions}
              data-testid="compare-pinned-button"
            >
              ⇄ So sánh {pinnedRegions.length} vùng đã ghim
            </button>
          )}
          <button
            className="chat-trigger-button"
            type="button"
            onClick={() => setIsOpen(true)}
            data-testid="open-chat-button"
            aria-label="Mở AI Chatbot VLearn"
          >
            <span className="chat-trigger-icon">💬</span>
            <span className="chat-trigger-label">Hỏi theo vùng</span>
            {regions.length > 0 && <span className="chat-trigger-badge">{regions.length}</span>}
          </button>
        </div>
      )}

      {/* Expanded Collapsible Chat Window */}
      {isOpen && (
        <div className="chat-drawer" data-testid="chat-drawer">
          {/* Header */}
          <div className="chat-drawer-header">
            <div className="chat-header-title">
              <span className="chat-avatar-badge">🤖</span>
              <div>
                <h4>VLearn AI Assistant</h4>
                <p>{regions.length > 0 ? `${regions.length} vùng · ${pinnedRegions.length} đã ghim` : "Sẵn sàng hỗ trợ"}</p>
              </div>
            </div>
            <div className="chat-header-actions">
              <button
                type="button"
                className="chat-header-btn"
                onClick={() =>
                  setMessages([
                    {
                      id: `init-${Date.now()}`,
                      role: "assistant",
                      content: "Đã xóa lịch sử trò chuyện. Bạn cần trợ giúp thông tin gì từ slide?",
                    },
                  ])
                }
                title="Xóa cuộc trò chuyện"
              >
                🗑️
              </button>
              <button
                type="button"
                className="chat-header-btn minimize-btn"
                onClick={() => setIsOpen(false)}
                title="Thu gọn khung chat"
                data-testid="close-chat-button"
              >
                —
              </button>
            </div>
          </div>

          {/* Region Context Chips */}
          {regions.length > 0 && (
            <div className="chat-context-bar">
              <span className="context-label">Ngữ cảnh:</span>
              <div className="context-chips">
                <button
                  type="button"
                  className={selectedRegionIds.length === 0 ? "chip active" : "chip"}
                  onClick={() => setSelectedRegionIds([])}
                >
                  Tất cả ({regions.length})
                </button>
                {regions.map((r) => {
                  const isSelected = selectedRegionIds.includes(r.id);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      className={isSelected ? "chip selected" : "chip"}
                      onClick={() => toggleRegionId(r.id)}
                      style={{
                        borderColor: r.color.stroke,
                        backgroundColor: isSelected ? r.color.fill : "transparent",
                      }}
                    >
                      <span className="chip-dot" style={{ backgroundColor: r.color.stroke }} />
                      {r.isPinned ? "📌 " : ""}{r.label} · T{r.pageNumber}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {regions.length > 0 && (
            <div className="context-window-note" data-testid="context-window-note">
              Ngữ cảnh tự động: slide chứa vùng ± 1 slide lân cận; vùng khoanh luôn được ưu tiên.
            </div>
          )}

          {/* Message History List */}
          <div className="chat-messages-list">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-bubble-wrap ${msg.role}`}>
                <div className="chat-bubble">
                  <div className="chat-bubble-content">
                    <ReactMarkdown
                      components={{
                        a: ({ href, children }) => {
                          const sourceRegionId = href?.startsWith("#source-") ? href.slice("#source-".length) : null;
                          if (sourceRegionId && regions.some((region) => region.id === sourceRegionId)) {
                            return (
                              <button
                                type="button"
                                className="source-citation"
                                onClick={() => {
                                  onTraceRegion(sourceRegionId);
                                  setIsOpen(false);
                                }}
                                title="Mở đúng vùng nguồn trên slide"
                              >
                                {children}
                              </button>
                            );
                          }
                          const slidePage = href?.startsWith("#slide-")
                            ? Number(href.slice("#slide-".length))
                            : Number.NaN;
                          if (Number.isInteger(slidePage) && slidePage > 0) {
                            return (
                              <button
                                type="button"
                                className="source-citation slide-citation"
                                onClick={() => {
                                  onTracePage(slidePage);
                                  setIsOpen(false);
                                }}
                                title="Mở slide ngữ cảnh"
                              >
                                {children}
                              </button>
                            );
                          }
                          return <a href={href}>{children}</a>;
                        },
                      }}
                    >
                      {msg.role === "assistant" ? addCitationLinks(msg.content, regions) : msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="chat-bubble-wrap assistant">
                <div className="chat-bubble loading">
                  <span className="spinner small" /> AI đang suy nghĩ và phân tích...
                </div>
              </div>
            )}
          </div>

          {/* Quick Suggestions */}
          <div className="chat-quick-prompts">
            <button type="button" onClick={() => handleQuickPrompt("Giải thích các vùng đã khoanh")}>
              💡 Giải thích
            </button>
            <button type="button" onClick={() => handleQuickPrompt("Tóm tắt bài học từ các vùng khoanh")}>
              📚 Tóm tắt
            </button>
            <button type="button" onClick={() => handleQuickPrompt("Tạo câu hỏi trắc nghiệm ôn tập")}>
              📝 Câu hỏi ôn tập
            </button>
            <button type="button" disabled={pinnedRegions.length < 2 || isLoading} onClick={comparePinnedRegions}>
              ⇄ So sánh vùng ghim
            </button>
          </div>

          {/* Input Form */}
          <form className="chat-input-form" onSubmit={handleSubmit}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              aria-label="Nhập câu hỏi cho VLearn AI Assistant"
              placeholder="Hỏi AI về slide hoặc các vùng khoanh..."
              disabled={isLoading}
            />
            <button type="submit" disabled={!input.trim() || isLoading}>
              Gửi
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
