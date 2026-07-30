import React, { useState } from 'react';
import { Lock, Key, Check, X, ShieldCheck, Sparkles } from 'lucide-react';

interface ByokModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveKey: (customKey: string) => void;
  currentQuotaMax: number;
  onExtendQuota: () => void;
  isDarkMode: boolean;
}

export const ByokModal: React.FC<ByokModalProps> = ({
  isOpen,
  onClose,
  onSaveKey,
  currentQuotaMax,
  onExtendQuota,
  isDarkMode,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onSaveKey(apiKey.trim());
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        onClose();
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className={`w-full max-w-lg rounded-2xl p-6 shadow-2xl border transition-colors ${
          isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-100 dark:bg-amber-950 text-amber-600 rounded-xl">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Bring Your Own Key (BYOK)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mở rộng quota không giới hạn cho VLearn Tutor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs sm:text-sm">
          <div className="p-3.5 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 rounded-xl text-blue-900 dark:text-blue-200 space-y-1">
            <p className="font-semibold flex items-center">
              <ShieldCheck className="w-4 h-4 mr-1.5 text-blue-600" />
              Tại sao sử dụng BYOK?
            </p>
            <p className="text-xs leading-relaxed opacity-90">
              Mặc định hệ thống cấp miễn phí {currentQuotaMax} câu hỏi/ngày. Khi dùng Gemini API Key của chính bạn, bạn có thể hỏi VLearn Tutor liên tục không giới hạn tốc độ.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Nhập Google Gemini API Key của bạn:
              </label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  onExtendQuota();
                  onClose();
                }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500" />
                + Tăng quota tạm thời (+15 câu)
              </button>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={!apiKey.trim()}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-40 transition-colors shadow-sm flex items-center space-x-1"
                >
                  {isSaved ? <Check className="w-3.5 h-3.5" /> : null}
                  <span>{isSaved ? 'Đã lưu Key!' : 'Lưu & Kích hoạt'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
