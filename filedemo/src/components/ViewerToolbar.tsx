import React from 'react';
import {
  BookOpen,
  PenTool,
  Highlighter,
  MoreHorizontal,
  Minus,
  Plus,
  RotateCw,
  Download,
  Printer,
  Maximize,
  Trash2,
  StickyNote,
} from 'lucide-react';
import { ViewerMode } from '../types';

interface ViewerToolbarProps {
  mode: ViewerMode;
  onSetMode: (mode: ViewerMode) => void;
  currentPage: number;
  notesCount: number;
  onOpenNotes: () => void;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onRotatePage: () => void;
  onToggleFullscreen: () => void;
  onClearAnnotations: () => void;
  isDarkMode: boolean;
}

export const ViewerToolbar: React.FC<ViewerToolbarProps> = ({
  mode,
  onSetMode,
  currentPage,
  notesCount,
  onOpenNotes,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onRotatePage,
  onToggleFullscreen,
  onClearAnnotations,
  isDarkMode,
}) => {
  return (
    <div
      className={`h-12 border-b flex items-center justify-center px-4 space-x-4 sm:space-x-6 shrink-0 select-none transition-colors overflow-x-auto custom-scrollbar ${
        isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
      }`}
      data-purpose="viewer-toolbar"
    >
      {/* Mode Selector Buttons */}
      <div className={`flex items-center space-x-1 border rounded-lg p-1 ${
        isDarkMode ? 'border-slate-800 bg-slate-800/60' : 'border-slate-200 bg-slate-50/50'
      }`}>
        <button
          onClick={() => onSetMode('read')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
            mode === 'read'
              ? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300 shadow-xs'
              : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
          }`}
          title="Chế độ Đọc & Bôi đen văn bản để hỏi AI"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Đọc</span>
        </button>

        <button
          onClick={() => onSetMode('pen')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
            mode === 'pen'
              ? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300 shadow-xs'
              : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
          }`}
          title="Chế độ Bút vẽ ghi chú"
        >
          <PenTool className="w-3.5 h-3.5" />
          <span>Bút</span>
        </button>

        <button
          onClick={() => onSetMode('highlight')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
            mode === 'highlight'
              ? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300 shadow-xs'
              : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
          }`}
          title="Chế độ Tô màu Highlight"
        >
          <Highlighter className="w-3.5 h-3.5" />
          <span>Highlight</span>
        </button>

        <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />

      {/* Page Notes & Zoom Controls */}
      <div className="flex items-center space-x-3 text-xs font-semibold text-blue-600 dark:text-blue-400">
        <button
          onClick={onOpenNotes}
          className="bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 px-2.5 py-1 rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer"
          title="Xem ghi chú trang này"
        >
          <StickyNote className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Trang {currentPage} • {notesCount} note</span>
        </button>

        <div className={`flex items-center border rounded-lg overflow-hidden ${
          isDarkMode ? 'border-slate-800 bg-slate-800' : 'border-slate-200 bg-white'
        }`}>
          <button
            onClick={onZoomOut}
            className="px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-700 border-r border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold"
            title="Thu nhỏ"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onResetZoom}
            className="px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
            title="Đặt lại zoom 100%"
          >
            {zoomLevel}%
          </button>
          <button
            onClick={onZoomIn}
            className="px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-700 border-l border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold"
            title="Phóng to"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />

      {/* Action Icons */}
      <div className="flex items-center space-x-1 text-slate-500 dark:text-slate-400">
        <button
          onClick={onRotatePage}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="Xoay trang"
        >
          <RotateCw className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            alert('Tải xuống slide thành công!');
          }}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="Tải về tập tin PDF"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={() => window.print()}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="In tài liệu"
        >
          <Printer className="w-4 h-4" />
        </button>
        <button
          onClick={onToggleFullscreen}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="Toàn màn hình"
        >
          <Maximize className="w-4 h-4" />
        </button>
        <button
          onClick={onClearAnnotations}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-rose-500/80 transition-colors"
          title="Xóa nét vẽ trên trang"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
