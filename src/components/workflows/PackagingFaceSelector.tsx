import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Box, 
  Move, 
  Maximize2, 
  Scissors, 
  CheckCircle2, 
  RotateCcw, 
  Sparkles, 
  Layers, 
  Check, 
  AlertCircle
} from 'lucide-react';
import { 
  FaceRegionRect, 
  PackagingFaceRegions, 
  PackagingFaces, 
  ProductDimensions 
} from '../../../types';

export type FaceKey = 'front' | 'back' | 'left' | 'right' | 'top';

interface FaceDef {
  key: FaceKey;
  label: string;
  shortLabel: string;
  color: string;
  borderColor: string;
  bgColor: string;
  badgeBg: string;
  getRatio: (dims: { L: number; W: number; H: number }) => number;
  getDimText: (dims: { L: number; W: number; H: number }) => string;
}

const FACE_DEFS: FaceDef[] = [
  {
    key: 'front',
    label: 'Mặt trước (Front)',
    shortLabel: 'Trước',
    color: '#3B82F6',
    borderColor: 'border-blue-500',
    bgColor: 'bg-blue-500/15',
    badgeBg: 'bg-blue-500 text-white',
    getRatio: ({ L, H }) => L / (H || 1),
    getDimText: ({ L, H }) => `${L} × ${H} mm (Dài × Cao)`
  },
  {
    key: 'back',
    label: 'Mặt sau (Back)',
    shortLabel: 'Sau',
    color: '#A855F7',
    borderColor: 'border-purple-500',
    bgColor: 'bg-purple-500/15',
    badgeBg: 'bg-purple-500 text-white',
    getRatio: ({ L, H }) => L / (H || 1),
    getDimText: ({ L, H }) => `${L} × ${H} mm (Dài × Cao)`
  },
  {
    key: 'left',
    label: 'Hông trái (Left)',
    shortLabel: 'Hông trái',
    color: '#10B981',
    borderColor: 'border-emerald-500',
    bgColor: 'bg-emerald-500/15',
    badgeBg: 'bg-emerald-500 text-white',
    getRatio: ({ W, H }) => W / (H || 1),
    getDimText: ({ W, H }) => `${W} × ${H} mm (Rộng × Cao)`
  },
  {
    key: 'right',
    label: 'Hông phải (Right)',
    shortLabel: 'Hông phải',
    color: '#F59E0B',
    borderColor: 'border-amber-500',
    bgColor: 'bg-amber-500/15',
    badgeBg: 'bg-amber-500 text-white',
    getRatio: ({ W, H }) => W / (H || 1),
    getDimText: ({ W, H }) => `${W} × ${H} mm (Rộng × Cao)`
  },
  {
    key: 'top',
    label: 'Nắp trên (Top Lid)',
    shortLabel: 'Nắp trên',
    color: '#EF4444',
    borderColor: 'border-rose-500',
    bgColor: 'bg-rose-500/15',
    badgeBg: 'bg-rose-500 text-white',
    getRatio: ({ L, W }) => L / (W || 1),
    getDimText: ({ L, W }) => `${L} × ${W} mm (Dài × Rộng)`
  }
];

interface PackagingFaceSelectorProps {
  dielineUrl: string;
  dimensions: ProductDimensions;
  onDimensionsChange: (dims: ProductDimensions) => void;
  regions: PackagingFaceRegions;
  onRegionsChange: (regions: PackagingFaceRegions) => void;
  faces: PackagingFaces;
  onFacesChange: (faces: PackagingFaces) => void;
}

export const PackagingFaceSelector: React.FC<PackagingFaceSelectorProps> = ({
  dielineUrl,
  dimensions,
  onDimensionsChange,
  regions,
  onRegionsChange,
  faces,
  onFacesChange
}) => {
  const [activeFace, setActiveFace] = useState<FaceKey>('front');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageNaturalSize, setImageNaturalSize] = useState<{ width: number; height: number }>({ width: 1000, height: 1000 });
  const [isCroppingAll, setIsCroppingAll] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Parse numerical dimensions
  const L = parseFloat(dimensions.length) || 200;
  const W = parseFloat(dimensions.width) || 150;
  const H = parseFloat(dimensions.height) || 250;

  // Initialize or auto-arrange regions based on standard Vietnamese folding carton dieline layout
  const getDefaultRegions = useCallback((natW: number, natH: number): PackagingFaceRegions => {
    const imgAspect = natW / (natH || 1); // e.g. 2.0 (wide dieline)
    
    // Total physical unfolded perimeter = W + L + W + L
    // Standard unfolded width contains 4 panels: Left (W), Front (L), Right (W), Back (L)
    const totalPhysicalW = 2 * (L + W);
    const totalPhysicalH = H + W; // body + top lid

    // Base unit height percentage
    const baseH = Math.min(50, Math.max(25, (H / totalPhysicalH) * 60));
    
    // Width percentages for each face accounting for image aspect ratio
    const calcW = (faceRatio: number) => {
      // faceRatio = faceWidth / faceHeight
      // widthPct = baseH * faceRatio / imgAspect
      return Math.min(30, Math.max(12, (baseH * faceRatio) / imgAspect));
    };

    const frontW = calcW(L / H);
    const backW = calcW(L / H);
    const leftW = calcW(W / H);
    const rightW = calcW(W / H);
    const topW = calcW(L / W);
    const topH = (baseH * (W / H));

    const centerY = 45;

    return {
      left: {
        x: 8,
        y: centerY,
        width: leftW,
        height: baseH
      },
      front: {
        x: 8 + leftW + 2,
        y: centerY,
        width: frontW,
        height: baseH
      },
      right: {
        x: 8 + leftW + 2 + frontW + 2,
        y: centerY,
        width: rightW,
        height: baseH
      },
      back: {
        x: Math.min(75, 8 + leftW + 2 + frontW + 2 + rightW + 2),
        y: centerY,
        width: backW,
        height: baseH
      },
      top: {
        x: 8 + leftW + 2,
        y: Math.max(5, centerY - topH - 4),
        width: topW,
        height: Math.min(30, topH)
      }
    };
  }, [L, W, H]);

  // Initial load
  useEffect(() => {
    if (imageLoaded && (!regions.front || !regions.back)) {
      const def = getDefaultRegions(imageNaturalSize.width, imageNaturalSize.height);
      onRegionsChange(def);
    }
  }, [imageLoaded, regions.front, regions.back, getDefaultRegions, imageNaturalSize, onRegionsChange]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageNaturalSize({ width: img.naturalWidth || 1000, height: img.naturalHeight || 1000 });
    setImageLoaded(true);
  };

  // Crop a specific region using HTML5 canvas
  const cropRegion = useCallback((region: FaceRegionRect): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const natW = img.naturalWidth;
          const natH = img.naturalHeight;

          const sx = Math.max(0, (region.x / 100) * natW);
          const sy = Math.max(0, (region.y / 100) * natH);
          const sw = Math.min(natW - sx, (region.width / 100) * natW);
          const sh = Math.min(natH - sy, (region.height / 100) * natH);

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(sw));
          canvas.height = Math.max(1, Math.round(sh));
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Cannot create canvas context'));
            return;
          }
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/png'));
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = reject;
      img.src = dielineUrl;
    });
  }, [dielineUrl]);

  // Crop all 5 faces
  const handleCropAll = async () => {
    setIsCroppingAll(true);
    try {
      const newFaces: PackagingFaces = { ...faces, flat: dielineUrl };
      for (const def of FACE_DEFS) {
        const region = regions[def.key];
        if (region) {
          const cropped = await cropRegion(region);
          newFaces[def.key] = cropped;
        }
      }
      onFacesChange(newFaces);
    } catch (err) {
      console.error('Failed to crop face regions:', err);
    } finally {
      setIsCroppingAll(false);
    }
  };

  // Reset / Auto-arrange
  const handleResetRegions = () => {
    const def = getDefaultRegions(imageNaturalSize.width, imageNaturalSize.height);
    onRegionsChange(def);
  };

  // Dragging logic
  const dragRef = useRef<{
    isDragging: boolean;
    isResizing: boolean;
    startX: number;
    startY: number;
    startRegion: FaceRegionRect;
  } | null>(null);

  const startDrag = (e: React.MouseEvent, key: FaceKey, isResize: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveFace(key);

    const region = regions[key] || { x: 20, y: 20, width: 20, height: 20 };
    dragRef.current = {
      isDragging: !isResize,
      isResizing: isResize,
      startX: e.clientX,
      startY: e.clientY,
      startRegion: { ...region }
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const deltaX = ((moveEvent.clientX - dragRef.current.startX) / rect.width) * 100;
      const deltaY = ((moveEvent.clientY - dragRef.current.startY) / rect.height) * 100;

      if (dragRef.current.isDragging) {
        const newX = Math.max(0, Math.min(100 - dragRef.current.startRegion.width, dragRef.current.startRegion.x + deltaX));
        const newY = Math.max(0, Math.min(100 - dragRef.current.startRegion.height, dragRef.current.startRegion.y + deltaY));
        
        onRegionsChange({
          ...regions,
          [key]: {
            ...dragRef.current.startRegion,
            x: Math.round(newX * 10) / 10,
            y: Math.round(newY * 10) / 10
          }
        });
      } else if (dragRef.current.isResizing) {
        // Enforce physical aspect ratio during resize
        const currentDef = FACE_DEFS.find(d => d.key === key)!;
        const targetRatio = currentDef.getRatio({ L, W, H }); // faceWidth / faceHeight
        const imgAspect = (imageNaturalSize.width / (imageNaturalSize.height || 1));

        let newWidth = Math.max(8, Math.min(100 - dragRef.current.startRegion.x, dragRef.current.startRegion.width + deltaX));
        // height in % = (width in % * imgAspect) / targetRatio
        let newHeight = (newWidth * imgAspect) / targetRatio;

        if (dragRef.current.startRegion.y + newHeight > 100) {
          newHeight = 100 - dragRef.current.startRegion.y;
          newWidth = (newHeight * targetRatio) / imgAspect;
        }

        onRegionsChange({
          ...regions,
          [key]: {
            ...dragRef.current.startRegion,
            width: Math.round(newWidth * 10) / 10,
            height: Math.round(newHeight * 10) / 10
          }
        });
      }
    };

    const handleMouseUp = async () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      dragRef.current = null;
      // Auto-update cropped face for the modified region
      const updatedRegion = regions[key];
      if (updatedRegion) {
        try {
          const cropped = await cropRegion(updatedRegion);
          onFacesChange({
            ...faces,
            [key]: cropped
          });
        } catch (e) {
          // ignore
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const activeDef = FACE_DEFS.find(d => d.key === activeFace)!;
  const croppedCount = Object.keys(faces).filter(k => k !== 'flat' && faces[k as FaceKey]).length;

  return (
    <div className="space-y-4">
      {/* 1. Bộ nhập kích thước hộp vật lý Dài x Rộng x Cao */}
      <div className="p-3.5 rounded-xl bg-[#242526] border border-[#3E4042] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Box size={14} className="text-[#1877F2]" />
              Kích thước hộp vật lý (mm) — Tự động tính tỷ lệ các mặt
            </span>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Tỷ lệ các mặt hộp sẽ được tính toán chuẩn xác từ 3 chiều Dài × Rộng × Cao để định dạng khung kéo-thả.
            </p>
          </div>
          <div className="text-[10px] text-gray-400 font-mono bg-[#18191A] px-2 py-1 rounded border border-[#3E4042]">
            Tỷ lệ bế: L:{L} | W:{W} | H:{H}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Dài L (mm)</label>
            <input
              type="number"
              min="10"
              max="2000"
              value={dimensions.length}
              onChange={e => onDimensionsChange({ ...dimensions, length: e.target.value })}
              placeholder="VD: 200"
              className="w-full bg-[#18191A] border border-[#3E4042] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#1877F2]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Rộng W (mm)</label>
            <input
              type="number"
              min="10"
              max="2000"
              value={dimensions.width}
              onChange={e => onDimensionsChange({ ...dimensions, width: e.target.value })}
              placeholder="VD: 150"
              className="w-full bg-[#18191A] border border-[#3E4042] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#1877F2]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Cao H (mm)</label>
            <input
              type="number"
              min="10"
              max="2000"
              value={dimensions.height}
              onChange={e => onDimensionsChange({ ...dimensions, height: e.target.value })}
              placeholder="VD: 250"
              className="w-full bg-[#18191A] border border-[#3E4042] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#1877F2]"
            />
          </div>
        </div>
      </div>

      {/* 2. Thanh Tabs chọn 5 mặt */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <Layers size={13} className="text-amber-400" />
            Chọn mặt để kéo-thả vị trí ({croppedCount}/5 mặt đã cắt)
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetRegions}
              className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
              title="Đặt lại các khung về vị trí tiêu chuẩn"
            >
              <RotateCcw size={11} /> Tự động căn lại
            </button>
            <button
              type="button"
              onClick={handleCropAll}
              disabled={isCroppingAll}
              className="text-[10px] text-[#1877F2] hover:text-blue-400 font-bold flex items-center gap-1 transition-colors disabled:opacity-50"
            >
              <Scissors size={11} />
              {isCroppingAll ? 'Đang trích xuất...' : 'Cắt & Cập nhật 5 mặt'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {FACE_DEFS.map(def => {
            const isSelected = activeFace === def.key;
            const hasCropped = !!faces[def.key];
            return (
              <button
                key={def.key}
                type="button"
                onClick={() => setActiveFace(def.key)}
                className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center relative ${
                  isSelected
                    ? 'border-white bg-[#242526] shadow-md ring-1 ring-white/50'
                    : 'border-[#3E4042] bg-[#18191A] hover:border-gray-500'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span 
                    className="w-2 h-2 rounded-full inline-block" 
                    style={{ backgroundColor: def.color }} 
                  />
                  <span className="text-[11px] font-bold text-white truncate">
                    {def.shortLabel}
                  </span>
                </div>
                <span className="text-[9px] text-gray-400 mt-0.5 truncate max-w-full">
                  {def.getRatio({ L, W, H }).toFixed(2)}
                </span>
                {hasCropped && (
                  <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[9px] shadow">
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Vùng Canvas tương tác trên ảnh bế */}
      <div className="relative rounded-2xl overflow-hidden border border-[#3E4042] bg-[#101112]">
        {/* Banner hướng dẫn thao tác */}
        <div className="p-2.5 bg-[#18191A] border-b border-[#3E4042] flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <span 
              className="px-2 py-0.5 rounded font-bold text-white text-[10px]"
              style={{ backgroundColor: activeDef.color }}
            >
              Đang chỉnh: {activeDef.label}
            </span>
            <span className="text-gray-400">
              {activeDef.getDimText({ L, W, H })}
            </span>
          </div>
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <Move size={11} /> Kéo khung để di chuyển • Kéo góc dưới phải để phóng to/thu nhỏ
          </span>
        </div>

        {/* Khung ảnh và các overlay boxes */}
        <div 
          ref={containerRef}
          className="relative select-none w-full max-h-[500px] overflow-auto flex items-center justify-center bg-checkered p-2"
        >
          <div className="relative inline-block max-w-full">
            <img
              ref={imageRef}
              src={dielineUrl}
              alt="Bản vẽ bế"
              onLoad={handleImageLoad}
              className="max-h-[460px] w-auto max-w-full object-contain pointer-events-none rounded-lg shadow-lg block"
              referrerPolicy="no-referrer"
            />

            {/* Các khung nhận diện của 5 mặt */}
            {imageLoaded && FACE_DEFS.map(def => {
              const region = regions[def.key];
              if (!region) return null;
              const isSelected = activeFace === def.key;

              return (
                <div
                  key={def.key}
                  onMouseDown={(e) => startDrag(e, def.key, false)}
                  style={{
                    left: `${region.x}%`,
                    top: `${region.y}%`,
                    width: `${region.width}%`,
                    height: `${region.height}%`,
                    borderColor: def.color,
                    zIndex: isSelected ? 30 : 10
                  }}
                  className={`absolute border-2 cursor-move transition-[box-shadow] group ${
                    isSelected 
                      ? 'shadow-[0_0_0_2px_rgba(255,255,255,0.7)]' 
                      : 'opacity-85 hover:opacity-100'
                  }`}
                >
                  {/* Background tint */}
                  <div 
                    className="w-full h-full"
                    style={{ backgroundColor: `${def.color}25` }}
                  />

                  {/* Header Badge */}
                  <div 
                    className="absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[9px] font-bold text-white shadow pointer-events-none whitespace-nowrap flex items-center gap-1"
                    style={{ backgroundColor: def.color }}
                  >
                    <span>{def.shortLabel}</span>
                    {isSelected && <span className="text-[8px] opacity-80">({region.width.toFixed(0)}% × {region.height.toFixed(0)}%)</span>}
                  </div>

                  {/* Center Drag Icon */}
                  {isSelected && (
                    <div className="absolute inset-0 m-auto w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center pointer-events-none backdrop-blur-sm">
                      <Move size={12} />
                    </div>
                  )}

                  {/* Resize handle ở góc dưới phải */}
                  {isSelected && (
                    <div
                      onMouseDown={(e) => startDrag(e, def.key, true)}
                      className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-white border-2 border-black cursor-se-resize shadow-md flex items-center justify-center text-black hover:scale-125 transition-transform"
                      title="Kéo để phóng to / thu nhỏ theo đúng tỷ lệ hộp"
                    >
                      <Maximize2 size={8} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Xem trước 5 ảnh đã crop */}
      <div className="p-3.5 rounded-xl bg-[#242526] border border-[#3E4042] space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-400" />
            Xem trước 5 mặt trích xuất thực tế gửi cho Gemini 3D
          </span>
          <span className="text-[10px] text-gray-400">
            AI sẽ bọc chính xác 5 ảnh này lên 5 mặt hộp
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {FACE_DEFS.map(def => {
            const croppedImg = faces[def.key];
            return (
              <div 
                key={def.key}
                onClick={() => setActiveFace(def.key)}
                className={`p-1.5 rounded-lg border cursor-pointer transition-all flex flex-col items-center bg-[#18191A] ${
                  activeFace === def.key ? 'border-white' : 'border-[#3E4042] hover:border-gray-500'
                }`}
              >
                <div className="h-16 w-full flex items-center justify-center bg-black/40 rounded overflow-hidden p-0.5 relative">
                  {croppedImg ? (
                    <img 
                      src={croppedImg} 
                      alt={def.label} 
                      className="max-h-full max-w-full object-contain" 
                      referrerPolicy="no-referrer" 
                    />
                  ) : (
                    <span className="text-[9px] text-gray-500 italic">Chưa cắt</span>
                  )}
                </div>
                <div className="text-[10px] font-semibold text-gray-300 mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: def.color }} />
                  {def.shortLabel}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
