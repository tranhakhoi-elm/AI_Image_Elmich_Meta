import React from 'react';
import { Check, Trash2, Image as ImageIcon } from 'lucide-react';
import { GeneratedImage } from '../../../types';

interface GalleryRailProps {
  gallery: GeneratedImage[];
  activeImage: GeneratedImage | null;
  setActiveImage: (image: GeneratedImage | null) => void;
  onClearGallery: () => void;
}

export const GalleryRail: React.FC<GalleryRailProps> = ({
  gallery,
  activeImage,
  setActiveImage,
  onClearGallery
}) => {
  return (
    <div className="w-full shrink-0 border-t border-[#3E4042] bg-[#18191A] xl:bg-[#242526] z-10 flex flex-col h-[190px] sm:h-[220px] xl:h-[250px] mb-16 md:mb-0">
      <div className="px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <ImageIcon size={16} className="text-[#1877F2]" />
          <span className="font-semibold text-white text-sm sm:text-base">Ảnh đã tạo</span>
          <span className="text-xs text-gray-400">({gallery.length})</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 hidden lg:inline">
            Ảnh lưu tạm trong phiên làm việc. Hãy tải ảnh về máy.
          </span>
          {gallery.length > 0 && (
            <button 
              title="Xóa toàn bộ ảnh đã tạo" 
              className="text-red-400 hover:text-red-300 font-semibold text-xs hover:underline flex items-center gap-1 transition-colors p-1" 
              onClick={onClearGallery}
            >
              <Trash2 size={13} />
              <span>Xóa tất cả</span>
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-1 flex gap-3 sm:gap-4 overflow-x-auto px-3 sm:px-4 pb-3 sm:pb-4 custom-scrollbar items-center">
        {gallery.map(img => (
          <div 
            key={img.id} 
            className="relative h-full aspect-square shrink-0 bg-[#3A3B3C] rounded-xl overflow-hidden group cursor-pointer border border-[#3E4042] hover:border-[#1877F2] transition-all"
            onClick={() => setActiveImage(img)}
          >
            <img 
              src={img.url} 
              alt="Generated product"
              className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 object-center ${
                activeImage?.id === img.id ? 'opacity-60' : ''
              }`} 
              referrerPolicy="no-referrer"
            />
            {activeImage?.id === img.id && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#1877F2]/30">
                <div className="w-8 h-8 rounded-full bg-[#1877F2] text-white flex items-center justify-center shadow-lg">
                  <Check size={18} />
                </div>
              </div>
            )}
            <div className="absolute bottom-1 left-1 right-1 bg-black/60 backdrop-blur-sm rounded px-1.5 py-0.5 text-[10px] text-gray-200 truncate">
              {img.settings.productName || img.settings.visualStyle}
            </div>
          </div>
        ))}

        {gallery.length === 0 && (
          <div className="w-full flex flex-col items-center justify-center text-gray-500 text-[14px] gap-1">
            <ImageIcon size={24} className="text-gray-600" />
            <span>Chưa có ảnh nào được tạo trong phiên này.</span>
          </div>
        )}
      </div>
    </div>
  );
};
