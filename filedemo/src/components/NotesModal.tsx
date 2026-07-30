import React, { useState } from 'react';
import { StickyNote, Plus, Trash2, X, Calendar } from 'lucide-react';
import { PageNote } from '../types';

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: number;
  notes: PageNote[];
  onAddNote: (pageNumber: number, content: string) => void;
  onDeleteNote: (noteId: string) => void;
  isDarkMode: boolean;
}

export const NotesModal: React.FC<NotesModalProps> = ({
  isOpen,
  onClose,
  currentPage,
  notes,
  onAddNote,
  onDeleteNote,
  isDarkMode,
}) => {
  const [newNoteText, setNewNoteText] = useState('');

  if (!isOpen) return null;

  const pageNotes = notes.filter((n) => n.pageNumber === currentPage);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNoteText.trim()) {
      onAddNote(currentPage, newNoteText.trim());
      setNewNoteText('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className={`w-full max-w-lg rounded-2xl p-6 shadow-2xl border transition-colors ${
          isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-950 text-blue-600 rounded-xl">
              <StickyNote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Ghi chú cá nhân - Trang {currentPage}</h3>
              <p className="text-xs text-slate-500">Lưu nhanh ý chính để ôn tập sau</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing Notes List */}
        <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2 mb-4">
          {pageNotes.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              Chưa có ghi chú nào cho Trang {currentPage}. Thêm ghi chú mới bên dưới!
            </div>
          ) : (
            pageNotes.map((note) => (
              <div
                key={note.id}
                className="p-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded-xl flex items-start justify-between text-xs text-amber-900 dark:text-amber-200"
              >
                <div className="space-y-1 flex-1 mr-2">
                  <p className="font-medium whitespace-pre-wrap">{note.content}</p>
                  <p className="text-[10px] text-amber-700/70 dark:text-amber-400 flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {note.createdAt}
                  </p>
                </div>
                <button
                  onClick={() => onDeleteNote(note.id)}
                  className="p-1 text-amber-700 dark:text-amber-400 hover:text-rose-600 transition-colors"
                  title="Xóa ghi chú"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add Note Form */}
        <form onSubmit={handleAdd} className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <textarea
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder={`Thêm ghi chú bài giảng cho Trang ${currentPage}...`}
              rows={2}
              className="w-full border rounded-xl p-3 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none dark:bg-slate-800 dark:border-slate-700"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Hoàn tất
            </button>
            <button
              type="submit"
              disabled={!newNoteText.trim()}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 shadow-sm flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Ghi chú</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
