import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { AppState } from '../../../types';

interface LoadingModalProps {
  appState: AppState;
  loadingMessage: string;
}

export const LoadingModal: React.FC<LoadingModalProps> = ({ appState, loadingMessage }) => {
  const isLoading = appState === AppState.GENERATING || appState === AppState.ANALYZING;

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md pointer-events-auto"
        >
          <div className="bg-[#242526] border border-[#3E4042] rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#1877F2]/10 border border-[#1877F2]/30 flex items-center justify-center mb-6 relative">
              <Loader2 size={32} className="text-[#1877F2] animate-spin" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Hệ thống đang xử lý</h3>
            <p className="text-[#1877F2] font-semibold text-sm mb-4 animate-pulse">{loadingMessage}</p>
            <p className="text-gray-400 text-xs leading-relaxed">
              Vui lòng chờ trong giây lát. Quá trình phân tích đồ họa AI và tạo ảnh có thể mất từ 5 đến 20 giây tùy theo tác vụ...
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
