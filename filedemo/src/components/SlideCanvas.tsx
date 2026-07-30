import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MessageSquarePlus, Sparkles, Send, X, Pencil, HelpCircle } from 'lucide-react';
import { Slide, ViewerMode } from '../types';

interface SlideCanvasProps {
  currentSlide: Slide;
  totalPages: number;
  docTitle: string;
  zoomLevel: number;
  rotation: number;
  mode: ViewerMode;
  onPrevPage: () => void;
  onNextPage: () => void;
  onJumpToPage: (page: number) => void;
  onAskTutorWithText: (selectedText: string, regionQuestion?: string) => void;
  isDarkMode: boolean;
}

interface RegionBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  centerX: number;
  centerY: number;
}

export const SlideCanvas: React.FC<SlideCanvasProps> = ({
  currentSlide,
  totalPages,
  docTitle,
  zoomLevel,
  rotation,
  mode,
  onPrevPage,
  onNextPage,
  onJumpToPage,
  onAskTutorWithText,
  isDarkMode,
}) => {
  const [selectedText, setSelectedText] = useState('');
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const slideRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<{ x: number; y: number }[]>([]);
  const [activeRegion, setActiveRegion] = useState<RegionBox | null>(null);
  const [regionPrompt, setRegionPrompt] = useState('');

  // Handle text selection on the slide
  const handleMouseUpText = () => {
    if (mode !== 'read') return;
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      const text = selection.toString().trim();
      setSelectedText(text);

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setTooltipPos({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });
    } else {
      setSelectedText('');
      setTooltipPos(null);
    }
  };

  const handleAskTutor = () => {
    if (selectedText) {
      onAskTutorWithText(selectedText);
      window.getSelection()?.removeAllRanges();
      setSelectedText('');
      setTooltipPos(null);
    }
  };

  // Canvas drawing setup for Pen & Highlight
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (mode === 'pen') {
      ctx.strokeStyle = isDarkMode ? '#60a5fa' : '#2563eb';
      ctx.lineWidth = 3;
      ctx.globalAlpha = 1.0;
    } else if (mode === 'highlight') {
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 18;
      ctx.globalAlpha = 0.45;
    }
  }, [mode, isDarkMode]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode === 'read') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setDrawingPoints([{ x, y }]);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || mode === 'read') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    ctx.lineTo(x, y);
    ctx.stroke();

    setDrawingPoints((prev) => [...prev, { x, y }]);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (drawingPoints.length > 3) {
      const xs = drawingPoints.map((p) => p.x);
      const ys = drawingPoints.map((p) => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      const width = maxX - minX;
      const height = maxY - minY;

      if (width > 12 || height > 12) {
        // Draw a neat bounding indicator on canvas
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.save();
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.strokeRect(minX - 4, minY - 4, width + 8, height + 8);
            ctx.restore();
          }
        }

        setActiveRegion({
          minX,
          minY,
          maxX,
          maxY,
          centerX: (minX + maxX) / 2,
          centerY: (minY + maxY) / 2,
        });
      }
    }
  };

  const handleSubmitRegionQuestion = (questionOverride?: string) => {
    const finalQuestion = questionOverride || regionPrompt.trim() || 'Giải thích chi tiết giúp mình nội dung ở vùng đã khoanh này';
    const regionContext = `[Vùng khoanh chọn ở Slide ${currentSlide.pageNumber}: ${currentSlide.title}]`;
    
    onAskTutorWithText(regionContext, finalQuestion);
    
    setActiveRegion(null);
    setRegionPrompt('');
  };

  const handleRegionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmitRegionQuestion();
    }
  };

  return (
    <main
      className={`flex-1 flex flex-col relative overflow-hidden transition-colors ${
        isDarkMode ? 'bg-slate-950' : 'bg-slate-100'
      }`}
      data-purpose="document-viewer-container"
    >
      {/* Slide Display Scrollable Area */}
      <div
        className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col items-center space-y-12 custom-scrollbar relative"
        onMouseUp={handleMouseUpText}
      >
        {/* Floating Text Selection Ask Tutor Tooltip */}
        {tooltipPos && selectedText && (
          <div
            style={{
              position: 'fixed',
              left: `${tooltipPos.x}px`,
              top: `${tooltipPos.y}px`,
              transform: 'translate(-50%, -100%)',
            }}
            className="z-50 bg-slate-900 text-white dark:bg-blue-600 px-3 py-1.5 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-semibold cursor-pointer border border-slate-700 animate-in fade-in zoom-in-95 duration-150"
            onClick={handleAskTutor}
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Hỏi VLearn Tutor về đoạn này</span>
            <MessageSquarePlus className="w-3.5 h-3.5 text-blue-300" />
          </div>
        )}

        {/* Slide 1 - Current Primary Slide */}
        <div
          className="relative group transition-transform duration-200"
          style={{
            transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
            transformOrigin: 'top center',
          }}
          data-purpose="slide-wrapper"
        >
          <div className="text-[11px] font-medium text-slate-400 absolute -top-7 left-0 flex justify-between w-full px-1 select-none">
            <span>Trang {currentSlide.pageNumber} / {totalPages}</span>
            <span className="truncate max-w-[300px]">{docTitle}</span>
          </div>

          <div
            ref={slideRef}
            className={`w-[780px] min-h-[440px] shadow-2xl rounded-xl overflow-hidden border relative flex flex-col p-8 transition-colors ${
              currentSlide.bgType === 'sage'
                ? 'slide-bg border-emerald-700/30 text-white'
                : isDarkMode
                ? 'bg-slate-900 border-slate-800 text-slate-100'
                : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            {/* Slide Header Category */}
            {currentSlide.category && (
              <span className={`text-xs uppercase tracking-widest font-bold opacity-80 mb-3 block ${
                currentSlide.bgType === 'sage' ? 'text-white' : 'text-blue-600 dark:text-blue-400'
              }`}>
                {currentSlide.category}
              </span>
            )}

            {/* Slide Title */}
            <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-3 tracking-tight">
              {currentSlide.title}
            </h1>

            {/* Slide Subtitle */}
            {currentSlide.subtitle && (
              <p className={`italic text-sm sm:text-base font-medium mb-6 ${
                currentSlide.bgType === 'sage' ? 'opacity-90 text-emerald-50' : 'text-slate-500 dark:text-slate-400'
              }`}>
                {currentSlide.subtitle}
              </p>
            )}

            {/* Slide Custom Content - Instructor Profile (Slide 2) */}
            {currentSlide.instructorInfo && (
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-8 mt-4">
                <div className="w-32 h-32 bg-slate-200 dark:bg-slate-800 rounded-xl overflow-hidden shrink-0 border border-slate-300 dark:border-slate-700 shadow-md">
                  <img
                    src={currentSlide.instructorInfo.avatarUrl}
                    alt="Instructor Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-xl font-bold">{currentSlide.instructorInfo.name}</h3>
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {currentSlide.instructorInfo.role}
                  </p>
                  <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-300 pt-1">
                    {currentSlide.instructorInfo.bioPoints.map((pt, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-2 text-blue-500">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Slide Standard Lines */}
            {currentSlide.contentLines && !currentSlide.instructorInfo && (
              <div className="flex-1 space-y-3 my-2 text-sm sm:text-base leading-relaxed">
                {currentSlide.contentLines.map((line, idx) => (
                  <p key={idx} className="font-medium">
                    {line}
                  </p>
                ))}
              </div>
            )}

            {/* Slide Key Takeaway Box */}
            {currentSlide.keyTakeaway && (
              <div className={`mt-4 p-3.5 rounded-xl border text-xs sm:text-sm font-semibold ${
                currentSlide.bgType === 'sage'
                  ? 'bg-white/15 border-white/20 text-white'
                  : 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200'
              }`}>
                💡 Ghi nhớ trọng tâm: {currentSlide.keyTakeaway}
              </div>
            )}

            {/* Slide Footer */}
            <div className={`mt-auto pt-6 text-[11px] opacity-70 border-t ${
              currentSlide.bgType === 'sage' ? 'border-white/20 text-white' : 'border-slate-100 dark:border-slate-800 text-slate-400'
            }`}>
              Instructor: Mai Anh Nguyen (Blue) · VinUniversity · Day 5 - 2026
            </div>

            {/* Canvas overlay for drawing mode */}
            {mode !== 'read' && (
              <canvas
                ref={canvasRef}
                width={780}
                height={440}
                className="absolute inset-0 z-20 cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
            )}

            {/* Floating Region Ask Support Box Popup */}
            {activeRegion && (
              <div
                style={{
                  position: 'absolute',
                  left: `${Math.min(500, Math.max(20, activeRegion.centerX - 140))}px`,
                  top: `${Math.min(260, Math.max(10, activeRegion.minY - 140))}px`,
                }}
                className={`z-40 w-80 p-3.5 rounded-2xl shadow-2xl border transition-all animate-in fade-in zoom-in-95 duration-200 ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-blue-200 text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-blue-100 dark:bg-blue-950 text-blue-600 rounded-lg">
                      <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs">Bạn cần hỗ trợ gì ở vùng này?</h4>
                      <p className="text-[10px] text-slate-400">Gửi câu hỏi để VLearn Tutor giải thích</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveRegion(null)}
                    className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={regionPrompt}
                      onChange={(e) => setRegionPrompt(e.target.value)}
                      onKeyDown={handleRegionKeyDown}
                      placeholder="Nhập câu hỏi... (Nhấn Enter để gửi)"
                      autoFocus
                      className="w-full pl-3 pr-9 py-2 text-xs rounded-xl border focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700"
                    />
                    <button
                      onClick={() => handleSubmitRegionQuestion()}
                      className="absolute right-1.5 top-1.5 p-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-xs"
                      title="Gửi câu hỏi"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    <button
                      onClick={() => handleSubmitRegionQuestion('Giải thích chi tiết vùng này giúp mình.')}
                      className="text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-300 hover:text-blue-600 px-2 py-1 rounded-md transition-colors"
                    >
                      🔍 Giải thích vùng này
                    </button>
                    <button
                      onClick={() => handleSubmitRegionQuestion('Tóm tắt ý chính của đoạn đã khoanh.')}
                      className="text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-300 hover:text-blue-600 px-2 py-1 rounded-md transition-colors"
                    >
                      📝 Tóm tắt ý chính
                    </button>
                    <button
                      onClick={() => handleSubmitRegionQuestion('Cho mình ví dụ thực tế liên quan.')}
                      className="text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-300 hover:text-blue-600 px-2 py-1 rounded-md transition-colors"
                    >
                      💡 Cho ví dụ
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Slide 2 Preview (Peek below) */}
        {currentSlide.pageNumber < totalPages && (
          <div className="relative opacity-50 pointer-events-none select-none my-4">
            <div className="text-[10px] text-slate-400 mb-1">Trang {currentSlide.pageNumber + 1} / {totalPages}</div>
            <div className={`w-[780px] min-h-[200px] shadow-md rounded-xl p-6 border ${
              isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
            }`}>
              <h2 className="text-xl font-bold mb-2">Trang tiếp theo...</h2>
              <p className="text-xs text-slate-500">Bấm nút Next hoặc dùng phím mũi tên để xem toàn bộ nội dung slide.</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Arrows (Absolute Positioned) */}
      <button
        onClick={onPrevPage}
        disabled={currentSlide.pageNumber <= 1}
        className={`absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 shadow-lg border rounded-full flex items-center justify-center transition-all z-20 cursor-pointer ${
          currentSlide.pageNumber <= 1
            ? 'opacity-30 cursor-not-allowed bg-slate-200 dark:bg-slate-800 text-slate-400 border-transparent'
            : isDarkMode
            ? 'bg-slate-900 border-slate-700 text-slate-200 hover:text-blue-400 hover:bg-slate-800'
            : 'bg-white border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50'
        }`}
        title="Trang trước (Phím trái)"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={onNextPage}
        disabled={currentSlide.pageNumber >= totalPages}
        className={`absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 shadow-lg border rounded-full flex items-center justify-center transition-all z-20 cursor-pointer ${
          currentSlide.pageNumber >= totalPages
            ? 'opacity-30 cursor-not-allowed bg-slate-200 dark:bg-slate-800 text-slate-400 border-transparent'
            : isDarkMode
            ? 'bg-slate-900 border-slate-700 text-slate-200 hover:text-blue-400 hover:bg-slate-800'
            : 'bg-white border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50'
        }`}
        title="Trang tiếp (Phím phải)"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Bottom Pagination Bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-5 py-2 rounded-full shadow-xl border border-slate-200 dark:border-slate-800 flex items-center space-x-4 z-20 select-none">
        <button
          onClick={onPrevPage}
          disabled={currentSlide.pageNumber <= 1}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4 text-slate-700 dark:text-slate-200" />
        </button>

        <div className="flex items-center space-x-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
          <span>Trang</span>
          <input
            type="number"
            min="1"
            max={totalPages}
            value={currentSlide.pageNumber}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (val >= 1 && val <= totalPages) onJumpToPage(val);
            }}
            className="w-10 text-center font-bold bg-slate-100 dark:bg-slate-800 rounded px-1 py-0.5 border border-slate-300 dark:border-slate-700 focus:outline-none"
          />
          <span className="text-slate-400">/ {totalPages}</span>
        </div>

        <button
          onClick={onNextPage}
          disabled={currentSlide.pageNumber >= totalPages}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full disabled:opacity-30"
        >
          <ChevronRight className="w-4 h-4 text-slate-700 dark:text-slate-200" />
        </button>
      </div>
    </main>
  );
};

