import React from 'react';
import { motion } from 'motion/react';
import { MessageCircle, History } from 'lucide-react';

export interface AppTile {
  id: string;
  icon: React.ReactNode;
  title: string;
  color: string; // class Tailwind nền màu đặc (vd: 'bg-blue-500')
}

interface AppHomeScreenProps {
  tools: AppTile[];
  onSelectTool: (id: string) => void;
  onSelectChat: () => void;
  onSelectHistory: () => void;
}

/**
 * Màn hình chọn công cụ ngay sau khi mở khóa — trình bày như springboard iPhone:
 * mỗi công cụ / Lịch sử là 1 icon vuông bo góc đặc trưng của Elmich Studio.
 */
export const AppHomeScreen: React.FC<AppHomeScreenProps> = ({
  tools,
  onSelectTool,
  onSelectChat,
  onSelectHistory,
}) => {
  const squareTiles: (AppTile & { onClick: () => void })[] = [
    ...tools.map(t => ({ ...t, onClick: () => onSelectTool(t.id) })),
    { id: '__history', icon: <History size={30} />, title: 'Lịch sử', color: 'bg-gray-500', onClick: onSelectHistory },
  ];

  return (
    <div className="flex-1 w-full flex items-start justify-center overflow-y-auto custom-scrollbar px-3 sm:px-6 py-6 sm:py-10 xl:py-12 pb-24 md:pb-12">
      <div className="flex flex-col gap-5 sm:gap-6 max-w-3xl w-full">
        {/* Header title */}
        <div className="text-center space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Ai Image Elmich Studio
          </h2>
          <p className="text-xs sm:text-sm text-gray-400">
            Hệ thống thiết kế đồ họa & kiểm định bao bì gia dụng thông minh
          </p>
        </div>

        {/* Springboard grid of tools */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4 w-full">
          {squareTiles.map(tile => (
            <motion.button
              key={tile.id}
              onClick={tile.onClick}
              whileTap={{ scale: 0.92 }}
              className="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-2xl hover:bg-[#242526] transition-colors cursor-pointer"
            >
              <div className={`w-full aspect-square rounded-2xl ${tile.color} text-white flex items-center justify-center shadow-lg hover:brightness-110 transition-all min-h-[52px]`}>
                {tile.icon}
              </div>
              <span className="text-[10px] sm:text-[11px] font-medium text-white text-center leading-tight line-clamp-2 h-7 flex items-center justify-center">
                {tile.title}
              </span>
            </motion.button>
          ))}

          {/* Trợ lý Chat AI */}
          <motion.button
            onClick={onSelectChat}
            whileTap={{ scale: 0.97 }}
            className="col-span-full flex items-center justify-center gap-2.5 sm:gap-3 h-14 sm:h-18 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-xl hover:brightness-110 transition-all mt-2 cursor-pointer"
          >
            <MessageCircle size={24} className="sm:w-[28px] sm:h-[28px]" />
            <span className="font-bold text-sm sm:text-base">Trợ lý Chat Tư Vấn Đồ Họa AI</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
};
