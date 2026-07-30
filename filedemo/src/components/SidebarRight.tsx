import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  RotateCcw,
  Plus,
  Lock,
  Send,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  X,
  AlertCircle,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import { ChatMessage } from '../types';

interface SidebarRightProps {
  currentPage: number;
  selectedTextFromSlide: string;
  onClearSelectedText: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string, contextSelectedText?: string) => void;
  onResetChat: () => void;
  isAskingAi: boolean;
  quotaUsed: number;
  quotaMax: number;
  onOpenByokModal: () => void;
  isDarkMode: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const SidebarRight: React.FC<SidebarRightProps> = ({
  currentPage,
  selectedTextFromSlide,
  onClearSelectedText,
  messages,
  onSendMessage,
  onResetChat,
  isAskingAi,
  quotaUsed,
  quotaMax,
  onOpenByokModal,
  isDarkMode,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [inputQuestion, setInputQuestion] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAskingAi]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputQuestion.trim() && !selectedTextFromSlide) return;

    onSendMessage(inputQuestion.trim(), selectedTextFromSlide);
    setInputQuestion('');
    onClearSelectedText();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleQuickPrompt = (promptText: string) => {
    onSendMessage(promptText, selectedTextFromSlide);
    onClearSelectedText();
  };

  const percentUsed = Math.min(100, Math.round((quotaUsed / quotaMax) * 100));

  if (isCollapsed) {
    return (
      <aside
        className={`w-14 border-l flex flex-col items-center py-4 shrink-0 transition-all select-none ${
          isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-blue-600 transition-colors mb-4 relative"
          title="Mở trò chuyện VLearn Tutor"
        >
          <PanelRightOpen className="w-5 h-5 text-blue-600" />
          {messages.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full animate-ping" />
          )}
        </button>

        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors"
          title="Trợ lý Tutor"
        >
          <MessageSquare className="w-5 h-5 text-blue-500" />
        </button>
      </aside>
    );
  }

  return (
    <aside
      className={`w-full md:w-[380px] border-l flex flex-col shrink-0 transition-all ${
        isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}
      data-purpose="tutor-panel"
    >
      {/* Tutor Header */}
      <div className={`p-4 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-950 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight">VLearn Tutor</h3>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center font-medium">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-ping"></span>
                Trợ lý học theo ngữ cảnh
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={onResetChat}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              title="Làm mới trò chuyện"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onResetChat}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              title="Cuộc trò chuyện mới"
            >
              <Plus className="w-4 h-4" />
            </button>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                title="Thu gọn khung trò chuyện"
              >
                <PanelRightClose className="w-4 h-4" />
              </button>
            )}
            <span className="text-[10px] text-slate-500 font-semibold border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800">
              Trang slide: {currentPage}
            </span>
          </div>
        </div>

        {/* Quota & BYOK Bar */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex-1 mr-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                Quota Tutor trong ngày
              </span>
              <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">
                {quotaUsed} / {quotaMax} câu
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  percentUsed > 80 ? 'bg-amber-500' : 'bg-blue-500'
                }`}
                style={{ width: `${percentUsed}%` }}
              />
            </div>
          </div>

          <button
            onClick={onOpenByokModal}
            className="flex items-center space-x-1 border border-amber-300 dark:border-amber-700/60 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-lg text-[10px] font-bold hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors shrink-0 shadow-xs"
            title="Bring Your Own Key (Thiết lập Gemini Key riêng)"
          >
            <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span>BYOK</span>
          </button>
        </div>
      </div>

      {/* Chat Messages Scroll View */}
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col space-y-4">
        {/* Context indicator */}
        <div className="text-[10px] font-medium text-slate-400 flex items-center select-none">
          <span className="shrink-0 mr-2">Ngữ cảnh: Slide trang {currentPage}</span>
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
        </div>

        {/* Message Items */}
        {messages.map((msg) => {
          const isTutor = msg.sender === 'tutor';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isTutor ? 'items-start' : 'items-end'} group`}
            >
              {/* Highlighted text badge if attached */}
              {msg.selectedText && (
                <div className="mb-1 text-[11px] bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 px-2.5 py-1 rounded-lg max-w-[85%] flex items-center space-x-1.5">
                  <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                  <span className="truncate italic">"{msg.selectedText}"</span>
                </div>
              )}

              <div
                className={`max-w-[88%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed relative ${
                  isTutor
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700 rounded-tl-none'
                    : 'bg-blue-600 text-white rounded-tr-none shadow-xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                <div className="flex items-center justify-between mt-2 pt-1 border-t border-black/5 dark:border-white/5 text-[10px] opacity-60">
                  <span>{msg.timestamp}</span>
                  {isTutor && (
                    <button
                      onClick={() => handleCopy(msg.text, msg.id)}
                      className="p-1 hover:opacity-100 transition-opacity"
                      title="Sao chép câu trả lời"
                    >
                      {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* AI Thinking / Generating state */}
        {isAskingAi && (
          <div className="flex items-center space-x-2 text-slate-400 text-xs py-2 px-1">
            <Bot className="w-4 h-4 text-blue-500 animate-bounce" />
            <span className="italic">VLearn Tutor đang tư duy và tạo câu trả lời...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex space-x-1.5 overflow-x-auto custom-scrollbar select-none">
        <button
          onClick={() => handleQuickPrompt("Tóm tắt ý chính của slide này trong 3 dòng.")}
          className="shrink-0 text-[11px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full transition-all"
        >
          ✨ Tóm tắt slide
        </button>
        <button
          onClick={() => handleQuickPrompt("Giải thích thuật ngữ trong slide này cho người mới học.")}
          className="shrink-0 text-[11px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full transition-all"
        >
          💡 Giải thích đơn giản
        </button>
        <button
          onClick={() => handleQuickPrompt("Cho mình 1 câu hỏi trắc nghiệm tự ôn tập slide này.")}
          className="shrink-0 text-[11px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full transition-all"
        >
          ❓ Câu hỏi ôn tập
        </button>
      </div>

      {/* Chat Input Area */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800" data-purpose="chat-input-area">
        {/* Selected text preview banner */}
        {selectedTextFromSlide && (
          <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between text-xs text-blue-900 dark:text-blue-200">
            <div className="flex items-center space-x-2 overflow-hidden">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate italic">
                Bôi đen: "{selectedTextFromSlide}"
              </span>
            </div>
            <button
              onClick={onClearSelectedText}
              className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-md text-blue-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="relative">
          <textarea
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập câu hỏi hoặc bôi đen tài liệu..."
            rows={2}
            className={`w-full border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none pr-11 custom-scrollbar transition-colors ${
              isDarkMode
                ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500'
                : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
            }`}
          />
          <button
            onClick={handleSend}
            disabled={isAskingAi || (!inputQuestion.trim() && !selectedTextFromSlide)}
            className="absolute bottom-2.5 right-2.5 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 transition-colors shadow-xs cursor-pointer"
            title="Gửi câu hỏi"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Windows Watermark from screenshot */}
        <div className="mt-3 flex items-center justify-end text-[10px] text-slate-300 dark:text-slate-600 select-none font-mono">
          <span>Activate Windows - Go to Settings to activate Windows.</span>
        </div>
      </div>
    </aside>
  );
};
