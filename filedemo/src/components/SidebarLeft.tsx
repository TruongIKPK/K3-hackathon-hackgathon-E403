import React, { useState } from 'react';
import { Menu, ChevronDown, ChevronRight, FileText, CheckCircle2, PlayCircle, Plus, Search, Upload, PanelLeftClose, PanelLeftOpen, BookOpen } from 'lucide-react';
import { DaySection, DocumentItem } from '../types';

interface SidebarLeftProps {
  daySections: DaySection[];
  activeDocId: string;
  onSelectDocument: (doc: DocumentItem) => void;
  onUploadDocument: (fileName: string, pageCount: number) => void;
  isDarkMode: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const SidebarLeft: React.FC<SidebarLeftProps> = ({
  daySections,
  activeDocId,
  onSelectDocument,
  onUploadDocument,
  isDarkMode,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({
    day5: true,
    day1: false,
    day2: false,
    day6: false,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocPages, setNewDocPages] = useState('20');

  const toggleDay = (dayId: string) => {
    setExpandedDays((prev) => ({
      ...prev,
      [dayId]: !prev[dayId],
    }));
  };

  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDocName.trim()) {
      onUploadDocument(
        newDocName.trim().endsWith('.pdf') ? newDocName.trim() : `${newDocName.trim()}.pdf`,
        parseInt(newDocPages, 10) || 15
      );
      setNewDocName('');
      setShowUploadModal(false);
    }
  };

  if (isCollapsed) {
    return (
      <aside
        className={`w-14 border-r flex flex-col items-center py-4 shrink-0 transition-all select-none ${
          isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors mb-4"
          title="Mở rộng danh sách bài học"
        >
          <PanelLeftOpen className="w-5 h-5 text-blue-600" />
        </button>

        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors"
          title="Học liệu môn học"
        >
          <BookOpen className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
      </aside>
    );
  }

  return (
    <aside
      className={`w-64 border-r flex flex-col shrink-0 overflow-y-auto custom-scrollbar select-none transition-all ${
        isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
      }`}
      data-purpose="sidebar-navigation"
    >
      {/* Header section */}
      <div className={`p-4 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-2">
            <Menu className="w-4 h-4 text-slate-500" />
            <h2 className="font-bold text-sm">Học liệu môn học</h2>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setShowUploadModal(true)}
              className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg text-xs flex items-center space-x-1 font-medium transition-colors"
              title="Thêm tài liệu mới"
            >
              <Plus className="w-4 h-4" />
            </button>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs transition-colors"
                title="Thu gọn danh sách"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <p className="text-[11px] text-slate-400">Chương, slide và tài liệu đã upload</p>

        {/* Search bar */}
        <div className="mt-3 relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm slide, bài giảng..."
            className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              isDarkMode
                ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500'
                : 'bg-slate-50 border-slate-200 text-slate-700 placeholder-slate-400'
            }`}
          />
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 text-sm py-2">
        <div className="space-y-1">
          {daySections.map((day) => {
            const isExpanded = expandedDays[day.id] || false;
            const filteredDocs = day.documents.filter((doc) =>
              doc.name.toLowerCase().includes(searchQuery.toLowerCase())
            );

            if (searchQuery && filteredDocs.length === 0) return null;

            return (
              <div key={day.id} className={day.isStudying ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''}>
                {/* Day Header */}
                <div
                  onClick={() => toggleDay(day.id)}
                  className={`px-4 py-2.5 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${
                    day.isStudying ? 'border-l-3 border-blue-500' : 'border-l-3 border-transparent'
                  }`}
                >
                  <div className="flex-1 overflow-hidden">
                    <p className="font-semibold text-xs flex items-center">
                      <PlayCircle className={`w-3.5 h-3.5 mr-2 shrink-0 ${day.isStudying ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span>{day.title}</span>
                    </p>
                    <span className="text-[10px] text-slate-400 ml-5 uppercase tracking-tight block">
                      {day.documents.length} TÀI LIỆU • ACTIVE
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    {day.isStudying && (
                      <span className="bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider">
                        STUDYING
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Sub-items / Documents List */}
                {isExpanded && (
                  <div className="pl-5 pr-3 space-y-1 py-1">
                    {filteredDocs.map((doc) => {
                      const isSelected = doc.id === activeDocId;
                      return (
                        <div
                          key={doc.id}
                          onClick={() => onSelectDocument(doc)}
                          className={`p-2 rounded-lg cursor-pointer flex items-center justify-between transition-all ${
                            isSelected
                              ? 'bg-blue-100/70 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200 font-semibold shadow-xs'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 overflow-hidden">
                            <FileText
                              className={`w-4 h-4 shrink-0 ${
                                isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-blue-500/80'
                              }`}
                            />
                            <div className="overflow-hidden">
                              <p className="text-xs truncate" title={doc.name}>
                                {doc.name}
                              </p>
                              <p
                                className={`text-[10px] ${
                                  isSelected ? 'text-blue-600/80 dark:text-blue-300' : 'text-slate-400'
                                }`}
                              >
                                {doc.pageCount} trang
                              </p>
                            </div>
                          </div>

                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 ml-1" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border ${
              isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center space-x-2 mb-2">
              <Upload className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold">Thêm học liệu bài giảng mới</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Nhập tên slide hoặc tải lên tài liệu PDF để VLearn Tutor đọc ngữ cảnh.
            </p>

            <form onSubmit={handleCreateDocument} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                  Tên file tài liệu / slide:
                </label>
                <input
                  type="text"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  placeholder="E.g., day05-ai-user-experience.pdf"
                  className="w-full border rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                  Số trang dự kiến:
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={newDocPages}
                  onChange={(e) => setNewDocPages(e.target.value)}
                  className="w-full border rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs font-medium rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                >
                  Thêm học liệu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};
