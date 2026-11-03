import React from 'react';
import { Home, MessageCircle, History, BookOpen } from 'lucide-react';

interface HeaderProps {
  viewMode: 'studio' | 'chat' | 'history';
  onSelectStudio: () => void;
  onSelectChat: () => void;
  onSelectHistory: () => void;
  onOpenHandbook: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onSelectStudio,
  onSelectChat,
  onSelectHistory,
  onOpenHandbook,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#242526] border-b border-[#3E4042] px-4 py-2 flex items-center justify-between select-none shadow-md">
      {/* Brand logo & title */}
      <button
        type="button"
        onClick={onSelectStudio}
        className="flex items-center gap-3 hover:opacity-90 transition-opacity text-left cursor-pointer"
      >
        <div className="w-9 h-9 rounded-xl bg-[#1877F2] text-white flex items-center justify-center font-black shadow-md shadow-blue-500/20">
          AE
        </div>
        <div>
          <h1 className="text-sm font-bold text-white tracking-tight leading-tight">
            Ai Image Elmich
          </h1>
          <p className="text-[10px] text-gray-400 leading-none">
            Elmich AI Design Studio
          </p>
        </div>
      </button>

      {/* Navigation tabs (Desktop & Tablet) */}
      <nav className="hidden md:flex items-center gap-1 bg-[#18191A] p-1 rounded-xl border border-[#3E4042]">
        <button
          type="button"
          onClick={onSelectStudio}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            viewMode === 'studio'
              ? 'bg-[#1877F2] text-white shadow-sm'
              : 'text-gray-400 hover:text-white hover:bg-[#242526]'
          }`}
        >
          <Home size={15} />
          <span>Studio</span>
        </button>

        <button
          type="button"
          onClick={onSelectChat}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            viewMode === 'chat'
              ? 'bg-pink-600 text-white shadow-sm'
              : 'text-gray-400 hover:text-white hover:bg-[#242526]'
          }`}
        >
          <MessageCircle size={15} />
          <span>Trợ Lý Chat AI</span>
        </button>

        <button
          type="button"
          onClick={onSelectHistory}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            viewMode === 'history'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-gray-400 hover:text-white hover:bg-[#242526]'
          }`}
        >
          <History size={15} />
          <span>Lịch Sử</span>
        </button>
      </nav>

      {/* Action buttons (Right side) */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenHandbook}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#18191A] hover:bg-[#3A3B3C] border border-[#3E4042] text-xs font-bold text-gray-300 hover:text-white transition-all cursor-pointer shadow-sm"
          title="Xem Handbook & Hướng dẫn kỹ thuật"
        >
          <BookOpen size={15} className="text-[#1877F2]" />
          <span className="hidden sm:inline">Sổ Tay (Handbook)</span>
        </button>
      </div>
    </header>
  );
};
