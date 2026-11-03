import React, { useEffect, useState } from 'react';
import { Sparkles, X } from 'lucide-react';

/**
 * Nút nổi + modal thông tin nhà cung cấp AI. App chạy META-ONLY: toàn bộ AI
 * qua Meta Model API (ảnh: Muse Image 1.0, chữ/suy luận: Muse Spark 1.3).
 * API key KHÔNG nhập trong app — proxy phía server lấy từ biến môi trường
 * META_MODEL_API_KEY (khai báo trên Vercel). Modal này chỉ để thông tin.
 */
export const ProviderSettingsButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Dọn key/provider cũ từng lưu ở trình duyệt bởi các bản trước (nay không
  // còn được đọc nữa: key chỉ ở phía server, provider luôn là META).
  useEffect(() => {
    try {
      localStorage.removeItem('elmich_meta_api_key');
      localStorage.removeItem('elmich_ai_provider');
    } catch {
      /* bỏ qua khi localStorage không khả dụng */
    }
  }, []);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-3 right-[60px] z-40 h-10 px-3 rounded-full bg-[#242526] border border-[#3E4042] text-[#1877F2] hover:bg-[#3A3B3C] flex items-center gap-2 shadow-lg transition-colors"
        title="App đang chạy bằng Meta Model API"
      >
        <Sparkles size={16} />
        <span className="text-[12px] font-semibold text-white">Meta AI</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[90] bg-black/60 flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
          <div
            className="w-full max-w-md bg-[#242526] border border-[#3E4042] rounded-2xl shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-white font-bold text-[17px]">Nhà cung cấp AI</h3>
                <p className="text-[#B0B3B8] text-[13px] mt-1 leading-relaxed">
                  Toàn bộ app chạy bằng <span className="text-white font-semibold">Meta Model API</span>:
                  tạo/sửa ảnh bằng <span className="text-white font-semibold">Muse Image 1.0</span>,
                  phân tích, gợi ý, suy luận prompt và chat bằng{' '}
                  <span className="text-white font-semibold">Muse Spark 1.3</span>.
                  Chất lượng ảnh xuất ra luôn cố định ở mức 2K.
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#3A3B3C] text-gray-400 hover:text-white shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            <div className="bg-[#18191A] border border-[#3E4042] rounded-xl px-4 py-3">
              <div className="text-white font-semibold text-[13px] mb-1">API key</div>
              <p className="text-[#B0B3B8] text-[12px] leading-relaxed">
                Key được cấu hình phía server qua biến môi trường{' '}
                <span className="text-white font-mono">META_MODEL_API_KEY</span>{' '}
                (Vercel → Settings → Environment Variables) — không cần nhập key
                trong app. Lưu ý: Muse Image chỉ nhận key dạng trả-theo-lượt
                (pay-as-you-go) đã bật Billing tại dev.meta.ai.
              </p>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-full mt-5 bg-[#1877F2] hover:bg-[#1663CC] text-white font-semibold text-[14px] rounded-xl py-2.5 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </>
  );
};
