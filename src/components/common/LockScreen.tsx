import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';

interface LockScreenProps {
  onUnlock: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock }) => {
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === '15012026' || passwordInput === '1111') {
      onUnlock();
    } else {
      setPasswordError("Mật khẩu không chính xác. Vui lòng thử lại.");
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-[#18191A] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#242526] border border-[#3E4042] rounded-2xl sm:rounded-3xl p-5 sm:p-8 max-w-md w-full shadow-2xl relative overflow-hidden text-center my-auto">
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-[#1877F2]/10 border border-[#1877F2]/20 flex items-center justify-center mx-auto mb-4 sm:mb-6 text-[#1877F2]">
          <Lock size={26} className="sm:w-8 sm:h-8" />
        </div>
        
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Elmich AI Design Studio</h2>
        <p className="text-xs sm:text-sm text-gray-400 mb-6 sm:mb-8 leading-relaxed">Nền tảng trí tuệ nhân tạo chuyên biệt cho thiết kế sản phẩm, bao bì & kiểm duyệt Elmich</p>
        
        <form onSubmit={handlePasswordSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase mb-2">Nhập mã truy cập</label>
            <input 
              type="password"
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                setPasswordError('');
              }}
              placeholder="••••••••"
              className="w-full bg-[#18191A] border border-[#3E4042] rounded-xl px-4 py-3 sm:py-3.5 text-white placeholder-gray-500 text-center tracking-widest text-base sm:text-lg font-mono focus:outline-none focus:border-[#1877F2] transition-colors"
              autoFocus
            />
          </div>

          {passwordError && (
            <p className="text-red-400 text-xs font-semibold text-center">{passwordError}</p>
          )}

          <button
            type="submit"
            className="w-full min-h-[48px] py-3.5 sm:py-4 bg-[#1877F2] hover:bg-blue-600 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/20 active:scale-[0.99] cursor-pointer"
          >
            <span>Mở khóa Studio</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-[#3E4042]/50 flex items-center justify-center gap-2 text-xs text-gray-500">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Bảo mật nội bộ Elmich Vietnam</span>
        </div>
      </div>
    </div>
  );
};
