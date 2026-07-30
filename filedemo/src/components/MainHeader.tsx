import React, { useState } from 'react';
import { BookOpen, Moon, Sun, User, Languages, Check, Search } from 'lucide-react';

interface MainHeaderProps {
  currentDocName: string;
  courseCode: string;
  materialRef: string;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  language: 'VI' | 'EN';
  onToggleLanguage: () => void;
  studentName: string;
  onUpdateStudentName: (name: string) => void;
}

export const MainHeader: React.FC<MainHeaderProps> = ({
  currentDocName,
  courseCode,
  materialRef,
  isDarkMode,
  onToggleDarkMode,
  language,
  onToggleLanguage,
  studentName,
  onUpdateStudentName,
}) => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [nameInput, setNameInput] = useState(studentName);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      onUpdateStudentName(nameInput.trim());
      setShowProfileModal(false);
    }
  };

  return (
    <header className={`h-14 border-b flex items-center justify-between px-4 z-20 shrink-0 transition-colors ${
      isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
    }`} data-purpose="main-header">
      {/* Left section: Logo & Document Breadcrumb */}
      <div className="flex items-center space-x-4 overflow-hidden">
        <div className="flex items-center space-x-2 shrink-0 cursor-pointer">
          <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <span className="text-xl font-bold text-red-600 tracking-tight">VLearn</span>
        </div>

        <div className={`hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm border max-w-md md:max-w-xl truncate ${
          isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-700'
        }`}>
          <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="font-semibold truncate">{currentDocName}</span>
          <span className="text-slate-400 text-xs shrink-0 hidden md:inline">
            {courseCode} · {materialRef}
          </span>
        </div>
      </div>

      {/* Right section: Lang, Theme, User Profile */}
      <div className="flex items-center space-x-3 shrink-0">
        <button
          onClick={onToggleLanguage}
          className={`flex items-center space-x-1 rounded-full px-3 py-1 text-xs font-semibold border transition-all ${
            isDarkMode 
              ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' 
              : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
          }`}
          title="Đổi ngôn ngữ giao diện"
        >
          <Languages className="w-3.5 h-3.5 text-blue-500" />
          <span>{language}</span>
        </button>

        <button
          onClick={onToggleDarkMode}
          className={`p-2 rounded-full transition-colors ${
            isDarkMode ? 'hover:bg-slate-800 text-amber-400' : 'hover:bg-slate-100 text-slate-600'
          }`}
          title={isDarkMode ? "Chuyển sang chế độ Sáng" : "Chuyển sang chế độ Tối"}
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <button
          onClick={() => setShowProfileModal(true)}
          className="flex items-center space-x-2 border border-blue-500 text-blue-600 px-3.5 py-1.5 rounded-full text-xs font-medium hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
        >
          <User className="w-4 h-4 text-blue-600" />
          <span className="font-semibold max-w-[130px] truncate">{studentName}</span>
        </button>
      </div>

      {/* Student Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border ${
            isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="text-lg font-bold mb-1">Thông tin học viên VLearn</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Tên hiển thị giúp VLearn Tutor cá nhân hóa lộ trình phản hồi cho bạn.
            </p>
            <form onSubmit={handleSaveName} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                  Họ và tên / Biệt danh:
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full border rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700"
                  placeholder="Nhập tên của bạn..."
                  autoFocus
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 text-xs font-medium rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center space-x-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Lưu thông tin</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
