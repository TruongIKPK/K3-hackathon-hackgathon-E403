"use client";

import { FormEvent, useState } from "react";
import type { SelectionRegion } from "../page";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export function ChatWidget({ regions }: { regions: SelectionRegion[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRegionIds, setSelectedRegionIds] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init-1",
      role: "assistant",
      content:
        "Xin chào! Tôi là **VLearn AI Assistant**. Hãy khoanh các vùng trên slide và đặt câu hỏi, tôi sẽ giúp bạn giải thích, tóm tắt hoặc tạo câu hỏi ôn tập!",
    },
  ]);

  // Toggle region context inclusion
  function toggleRegionId(id: string) {
    setSelectedRegionIds((prev) =>
      prev.includes(id) ? prev.filter((rId) => rId !== id) : [...prev, id]
    );
  }

  // Active regions to include in context
  const activeContextRegions =
    selectedRegionIds.length > 0
      ? regions.filter((r) => selectedRegionIds.includes(r.id))
      : regions;

  async function sendMessage(customText?: string) {
    const text = (customText || input).trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customText) setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          selectedRegions: activeContextRegions.map((r) => ({
            id: r.id,
            label: r.label,
            parsedText: r.parsedText,
            previewUrl: r.previewUrl,
          })),
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

  return (
    <div className="chat-widget-container">
      {/* Floating Trigger Button when Collapsed */}
      {!isOpen && (
        <button
          className="chat-trigger-button"
          type="button"
          onClick={() => setIsOpen(true)}
          data-testid="open-chat-button"
          aria-label="Mở AI Chatbot VLearn"
        >
          <span className="chat-trigger-icon">💬</span>
          <span className="chat-trigger-label">Hỏi AI VLearn</span>
          {regions.length > 0 && <span className="chat-trigger-badge">{regions.length}</span>}
        </button>
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
                <p>{regions.length > 0 ? `${regions.length} vùng khoanh chọn` : "Sẵn sàng hỗ trợ"}</p>
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
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Message History List */}
          <div className="chat-messages-list">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-bubble-wrap ${msg.role}`}>
                <div className="chat-bubble">
                  <div className="chat-bubble-content">{msg.content}</div>
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
          </div>

          {/* Input Form */}
          <form className="chat-input-form" onSubmit={handleSubmit}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
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
