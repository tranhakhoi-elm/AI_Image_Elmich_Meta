import React, { useState } from 'react';
import { KeyRound, X, Check } from 'lucide-react';
import {
  AiProvider,
  getAiProvider,
  setAiProvider,
  getMetaApiKey,
  setMetaApiKey,
} from '../../../services/metaService';

/**
 * Nút nổi + modal chọn nhà cung cấp tạo ảnh (Meta Muse Image 1.0 / Gemini)
 * và nhập Meta Model API key. Key chỉ lưu ở localStorage của trình duyệt và
 * được gửi kèm qua proxy /api/meta/images phía server — không nhúng vào
 * bundle JS như GEMINI_API_KEY hiện tại.
 */
export const ProviderSettingsButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [provider, setProviderState] = useState<AiProvider>(() => getAiProvider());
  const [keyInput, setKeyInput] = useState<string>(() => getMetaApiKey());
  const [saved, setSaved] = useState(false);

  const handleProviderChange = (next: AiProvider) => {
    setAiProvider(next);
    setProviderState(next);
  };

  const handleSaveKey = () => {
    setMetaApiKey(keyInput.trim());
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-3 right-[60px] z-40 h-10 px-3 rounded-full bg-[#242526] border border-[#3E4042] text-[#1877F2] hover:bg-[#3A3B3C] flex items-center gap-2 shadow-lg transition-colors"
        title="Chọn nhà cung cấp AI tạo ảnh (Meta / Gemini) và nhập Meta API key"
      >
        <KeyRound size={16} />
        <span className="text-[12px] font-semibold text-white">
          {provider === 'META' ? 'Meta AI' : 'Gemini'}
        </span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[90] bg-black/60 flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
          <div
            className="w-full max-w-md bg-[#242526] border border-[#3E4042] rounded-2xl shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-white font-bold text-[17px]">Nhà cung cấp tạo ảnh</h3>
                <p className="text-[#B0B3B8] text-[13px] mt-1">
                  Áp dụng cho tạo ảnh Studio, chỉnh sửa ảnh và tạo ảnh trong Chat. Các tính năng phân tích bằng chữ vẫn dùng Gemini.
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#3A3B3C] text-gray-400 hover:text-white shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-5">
              <button
                onClick={() => handleProviderChange('META')}
                className={`p-3 rounded-xl border text-left transition-colors ${provider === 'META' ? 'border-[#1877F2] bg-[#1877F2]/10' : 'border-[#3E4042] hover:bg-[#3A3B3C]'}`}
              >
                <div className="text-white font-semibold text-[14px]">Meta — Muse Image 1.0</div>
                <div className="text-[#B0B3B8] text-[12px] mt-0.5">$0.01/ảnh, sửa ảnh theo ảnh mẫu</div>
              </button>
              <button
                onClick={() => handleProviderChange('GEMINI')}
                className={`p-3 rounded-xl border text-left transition-colors ${provider === 'GEMINI' ? 'border-[#1877F2] bg-[#1877F2]/10' : 'border-[#3E4042] hover:bg-[#3A3B3C]'}`}
              >
                <div className="text-white font-semibold text-[14px]">Gemini (Nano Banana)</div>
                <div className="text-[#B0B3B8] text-[12px] mt-0.5">Luồng hiện tại của app</div>
              </button>
            </div>

            <label className="block text-white font-semibold text-[14px] mb-2">
              Meta Model API key
            </label>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Dán Model API key (tạo tại dev.meta.ai)..."
              className="w-full bg-[#18191A] border border-[#3E4042] rounded-xl px-3 py-2.5 text-[14px] text-white placeholder:text-[#72767D] focus:outline-none focus:border-[#1877F2]"
              autoComplete="off"
            />
            <p className="text-[#B0B3B8] text-[12px] mt-2 leading-relaxed">
              Key dạng pay-as-you-go có bật billing mới tạo được ảnh (key theo gói subscription sẽ bị Meta từ chối).
              Key lưu trong trình duyệt này và chỉ gửi qua proxy của server app, không nhúng vào file JS.
              Để trống ô này nếu server đã đặt biến môi trường META_MODEL_API_KEY.
            </p>

            <div className="flex gap-2 mt-5">
              <button
                onClick={handleSaveKey}
                className="flex-1 bg-[#1877F2] hover:bg-[#1663CC] text-white font-semibold text-[14px] rounded-xl py-2.5 flex items-center justify-center gap-2 transition-colors"
              >
                {saved ? <Check size={16} /> : null}
                {saved ? 'Đã lưu' : 'Lưu key'}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-5 bg-[#3A3B3C] hover:bg-[#4A4B4C] text-white font-semibold text-[14px] rounded-xl py-2.5 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
