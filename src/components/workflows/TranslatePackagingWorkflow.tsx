import React, { useState } from 'react';
import { ArrowLeft, Languages, Download, Loader2, Sparkles } from 'lucide-react';
import { editProductImage } from '../../../services/geminiService';
import { resizeImage } from '../../utils/imageUtils';

interface TranslatePackagingWorkflowProps {
  onBackToMenu?: () => void;
  setAlertMessage?: (msg: string | null) => void;
}

export const TranslatePackagingWorkflow: React.FC<TranslatePackagingWorkflowProps> = ({
  onBackToMenu,
  setAlertMessage
}) => {
  const [translateImageBase64, setTranslateImageBase64] = useState<string | null>(null);
  const [translatedImageURL, setTranslatedImageURL] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  const handleTranslatePackaging = async () => {
    if (!translateImageBase64) return;
    setIsTranslating(true);
    if (setAlertMessage) setAlertMessage(null);
    try {
      const prompt = "Recreate this exact packaging design perfectly. Keep the exact same dieline (cut lines), background graphics, and colors. However, translate all the English text on the packaging into Vietnamese.";
      const newImageUrl = await editProductImage(translateImageBase64, prompt, '1K');
      setTranslatedImageURL(newImageUrl);
    } catch (err: any) {
      console.error("Translation error:", err);
      if (setAlertMessage) {
        setAlertMessage("Lỗi dịch bao bì: " + (err.message || "Không thể xử lý ảnh"));
      }
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="space-y-6">
      {onBackToMenu && (
        <button onClick={onBackToMenu} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-bold mb-2">
          <ArrowLeft size={16} /> Quay lại Menu
        </button>
      )}
      
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#1877F2]/10 border border-[#1877F2]/20 flex items-center justify-center text-[#1877F2]">
          <Languages size={22} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Dịch thuật & Chuyển đổi Bao bì Tự động</h2>
          <p className="text-xs text-gray-400">Giữ nguyên 100% kết cấu dieline, layout và màu sắc; AI dịch toàn bộ nội dung tiếng Anh sang tiếng Việt chuẩn và xuất ảnh 1K sắc nét.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left Column: Upload English packaging */}
        <div className="space-y-4 bg-[#242526] border border-[#3E4042] rounded-2xl p-5">
          <label className="block text-sm font-bold text-white">1. Tải lên bao bì Tiếng Anh</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                const base64 = await resizeImage(file, 1536);
                setTranslateImageBase64(base64);
                setTranslatedImageURL(null);
              }
            }} 
            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#1877F2] file:text-white hover:file:bg-blue-600 cursor-pointer"
          />
          
          {translateImageBase64 ? (
            <div className="mt-4 rounded-xl overflow-hidden border border-[#3E4042] bg-[#18191A] p-2">
               <img 
                 src={translateImageBase64} 
                 alt="Original English Packaging"
                 className="w-full max-h-[420px] object-contain rounded-lg" 
                 referrerPolicy="no-referrer"
               />
            </div>
          ) : (
            <div className="w-full h-[320px] bg-[#18191A] rounded-xl flex flex-col items-center justify-center border border-dashed border-[#3E4042] text-gray-400 gap-3 p-6 text-center">
              <Languages size={36} className="text-gray-500" />
              <div className="text-sm font-medium">Chọn hoặc kéo thả ảnh thiết kế bao bì gốc tiếng Anh vào đây</div>
              <div className="text-xs text-gray-500">Hỗ trợ JPG, PNG, WEBP (Bao bì hộp, nhãn mác, túi...)</div>
            </div>
          )}

          <button 
            onClick={handleTranslatePackaging} 
            disabled={!translateImageBase64 || isTranslating}
            className="w-full py-3.5 mt-4 bg-[#1877F2] hover:bg-blue-600 text-white font-bold rounded-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            {isTranslating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>AI đang phân tích & tạo lại bao bì Tiếng Việt...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Bắt đầu Dịch & Tạo lại Ảnh</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Vietnamese output */}
        <div className="space-y-4 bg-[#242526] border border-[#3E4042] rounded-2xl p-5">
          <label className="block text-sm font-bold text-white">2. Kết quả Bao bì Tiếng Việt</label>
          
          {isTranslating ? (
             <div className="w-full h-[420px] bg-[#18191A] rounded-xl flex items-center justify-center border border-[#3E4042]">
                <div className="text-center text-gray-400 p-6">
                   <Loader2 size={32} className="animate-spin text-[#1877F2] mx-auto mb-3" />
                   <div className="text-sm font-semibold text-white mb-1">Đang xử lý tạo lại thiết kế...</div>
                   <div className="text-xs text-gray-400">Giữ nguyên dieline, chuyển đổi typography sang tiếng Việt tự nhiên</div>
                </div>
             </div>
          ) : translatedImageURL ? (
             <div className="space-y-4">
               <div className="rounded-xl overflow-hidden border border-[#1877F2] bg-[#18191A] p-2 shadow-[0_0_20px_rgba(24,119,242,0.15)]">
                 <img 
                   src={translatedImageURL} 
                   alt="Translated Vietnamese Packaging"
                   className="w-full max-h-[420px] object-contain rounded-lg" 
                   referrerPolicy="no-referrer"
                 />
               </div>
               <a 
                 href={translatedImageURL} 
                 download="bao_bi_tieng_viet_elmich_1k.jpg" 
                 className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
               >
                 <Download size={18} />
                 <span>Tải ảnh bao bì tiếng Việt (1K)</span>
               </a>
             </div>
          ) : (
             <div className="w-full h-[420px] bg-[#18191A] rounded-xl flex flex-col items-center justify-center border border-[#3E4042] text-gray-500 gap-2 p-6 text-center">
                <Download size={32} className="text-gray-600" />
                <div className="text-sm">Chưa có kết quả</div>
                <div className="text-xs text-gray-600">Hình ảnh bao bì sau khi dịch sẽ hiển thị tại đây để bạn xem trước và tải về</div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
