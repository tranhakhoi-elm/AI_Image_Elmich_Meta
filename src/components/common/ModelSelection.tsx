import React from 'react';
import { ImageSize, ImageModelTier } from '../../../types';

interface ModelSelectionProps {
  imageSize: ImageSize;
  onChange: (size: ImageSize) => void;
  // Optional để tương thích ngược — nếu 1 nơi gọi chưa truyền, ẩn luôn phần
  // chọn model thay vì crash hoặc hiện toggle không hoạt động.
  imageModel?: ImageModelTier;
  onModelChange?: (model: ImageModelTier) => void;
}

/**
 * Bộ chọn chất lượng ảnh (1K/2K/4K) + tầng model tạo ảnh (Flash/Pro) dùng
 * chung cho các workflow tạo ảnh trong Studio. Tách ra từ App.tsx (hàm
 * `renderModelSelection`).
 */
export const ModelSelection: React.FC<ModelSelectionProps> = ({ imageSize, onChange, imageModel, onModelChange }) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <label className="block text-[10px] sm:text-[9px] font-bold text-white uppercase tracking-wider mb-1">Chất lượng hình ảnh</label>
      <div className="grid grid-cols-3 gap-2">
        {(['1K', '2K', '4K'] as ImageSize[]).map(size => (
          <button
            key={size}
            type="button"
            onClick={() => onChange(size)}
            className={`min-h-[42px] py-2.5 px-1 rounded-xl border text-[10px] sm:text-[9px] font-bold transition-all flex items-center justify-center cursor-pointer select-none active:scale-[0.98] ${
              imageSize === size
                ? 'bg-[#1877F2] text-white border-[#1877F2] shadow-md shadow-blue-500/20'
                : 'bg-[#242526] text-gray-200 border-[#3E4042] hover:bg-[#3A3B3C] hover:text-white'
            }`}
          >
            {size === '1K' ? '1K Standard' : size === '2K' ? '2K Pro' : '4K Ultra HD'}
          </button>
        ))}
      </div>
    </div>
    {imageModel && onModelChange && (
      <div className="space-y-2">
        <label className="block text-[10px] sm:text-[9px] font-bold text-white uppercase tracking-wider mb-1">Model tạo ảnh</label>
        <div className="grid grid-cols-2 gap-2">
          {(['FLASH', 'PRO'] as ImageModelTier[]).map(model => (
            <button
              key={model}
              type="button"
              onClick={() => onModelChange(model)}
              className={`min-h-[42px] py-2.5 px-2 rounded-xl border text-[10px] sm:text-[9px] font-bold transition-all flex items-center justify-center cursor-pointer select-none active:scale-[0.98] ${
                imageModel === model
                  ? 'bg-[#1877F2] text-white border-[#1877F2] shadow-md shadow-blue-500/20'
                  : 'bg-[#242526] text-gray-200 border-[#3E4042] hover:bg-[#3A3B3C] hover:text-white'
              }`}
            >
              {model === 'FLASH' ? '⚡ Flash (nhanh, rẻ)' : '✨ Pro (chất lượng cao)'}
            </button>
          ))}
        </div>
      </div>
    )}
  </div>
);
