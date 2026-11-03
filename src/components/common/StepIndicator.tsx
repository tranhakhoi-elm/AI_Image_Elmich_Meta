import React from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
  current: number;
  total: number;
  labels: string[];
}

/**
 * Thanh hiển thị bước (1-2-3...) dùng chung cho các workflow nhiều bước.
 * Tách từ App.tsx (trước đó bị lặp lại y hệt ở nhiều nơi khi tách từng
 * workflow — gom về đây để tránh N bản sao khi tách nốt các workflow còn lại).
 */
export const StepIndicator: React.FC<StepIndicatorProps> = ({ current, total, labels }) => (
  <div className="w-full mb-6 sm:mb-8">
    <div className="flex items-center justify-between relative px-2">
      <div className="absolute top-4 left-4 right-4 h-0.5 bg-[#3E4042] -translate-y-1/2 z-0" />
      <motion.div
        className="absolute top-4 left-4 h-0.5 bg-gradient-to-r from-blue-500 to-[#1877F2] -translate-y-1/2 z-0"
        initial={{ width: 0 }}
        animate={{ width: total > 1 ? `calc(${((current - 1) / (total - 1)) * 100}% - 16px)` : '100%' }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      />
      {labels.map((label, idx) => {
        const stepNum = idx + 1;
        const isActive = stepNum === current;
        const isCompleted = stepNum < current;
        return (
          <div key={idx} className="relative z-10 flex flex-col items-center">
            <motion.div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                isActive
                  ? 'bg-[#18191A] border-[#1877F2] text-[#1877F2] shadow-[0_0_12px_rgba(24,119,242,0.5)] font-bold'
                  : isCompleted
                  ? 'bg-[#1877F2] border-[#1877F2] text-white'
                  : 'bg-[#242526] border-[#3E4042] text-gray-400'
              }`}
              animate={isActive ? { scale: 1.08 } : { scale: 1 }}
            >
              {isCompleted ? <Check size={15} strokeWidth={3} /> : <span className="text-xs font-bold">{stepNum}</span>}
            </motion.div>
            
            {/* Desktop / Tablet labels under each dot */}
            <div className={`hidden sm:block mt-2 text-center text-[10px] font-bold uppercase tracking-wider max-w-[85px] truncate transition-colors duration-200 ${
              isActive ? 'text-[#1877F2]' : isCompleted ? 'text-gray-200' : 'text-gray-500'
            }`}>
              {label}
            </div>
          </div>
        );
      })}
    </div>

    {/* Mobile active step banner (eliminates overlapping text collisions on phones) */}
    <div className="sm:hidden mt-2.5 flex items-center justify-center gap-1.5 text-xs text-center">
      <span className="text-gray-400 font-medium">Bước {current}/{total}:</span>
      <span className="text-[#1877F2] font-bold uppercase tracking-wide">{labels[current - 1]}</span>
    </div>
  </div>
);
