import React, { useRef, useState, useCallback, useEffect } from 'react';
import { 
  Move, 
  Maximize2, 
  Crop, 
  Plus, 
  RotateCcw, 
  Sparkles, 
  Layers, 
  X, 
  Check 
} from 'lucide-react';
import { ColorChangeEntry } from '../../../types';

interface ColorRegionSelectorProps {
  imageUrl: string;
  entries: ColorChangeEntry[];
  onEntriesChange: (entries: ColorChangeEntry[]) => void;
  activeEntryIndex: number | null;
  onSelectEntry: (index: number | null) => void;
  draftRegion: { x: number; y: number; width: number; height: number } | null;
  onDraftRegionChange: (reg: { x: number; y: number; width: number; height: number } | null) => void;
  activeColorHex: string;
}

export const ColorRegionSelector: React.FC<ColorRegionSelectorProps> = ({
  imageUrl,
  entries,
  onEntriesChange,
  activeEntryIndex,
  onSelectEntry,
  draftRegion,
  onDraftRegionChange,
  activeColorHex
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [isDrawModeActive, setIsDrawModeActive] = useState(false);

  // Interaction dragging/resizing state
  const dragRef = useRef<{
    type: 'move' | 'resize';
    handle?: 'nw' | 'ne' | 'se' | 'sw';
    startX: number;
    startY: number;
    startRegion: { x: number; y: number; width: number; height: number };
    targetIndex: number | 'draft';
  } | null>(null);

  // Convert mouse event coordinates to image percentage (0 - 100)
  const getPercentageCoords = (e: React.MouseEvent | MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    return {
      x: Math.max(0, Math.min(100, Math.round(xPct * 10) / 10)),
      y: Math.max(0, Math.min(100, Math.round(yPct * 10) / 10))
    };
  };

  // 1. Mouse down on image to draw a new region
  const handleImageMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left-click
    if (!isDrawModeActive && draftRegion) return;

    e.preventDefault();
    const coords = getPercentageCoords(e);
    setIsDrawing(true);
    setDrawStart(coords);
    onDraftRegionChange({ x: coords.x, y: coords.y, width: 2, height: 2 });
    onSelectEntry(null);
  };

  // 2. Mouse move while drawing
  const handleImageMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !drawStart) return;
    const current = getPercentageCoords(e);

    const x = Math.min(drawStart.x, current.x);
    const y = Math.min(drawStart.y, current.y);
    const width = Math.max(4, Math.abs(current.x - drawStart.x));
    const height = Math.max(4, Math.abs(current.y - drawStart.y));

    onDraftRegionChange({
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      width: Math.min(100 - x, Math.round(width * 10) / 10),
      height: Math.min(100 - y, Math.round(height * 10) / 10)
    });
  };

  // 3. Mouse up to finish drawing
  const handleImageMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setDrawStart(null);
      setIsDrawModeActive(false);
    }
  };

  // Drag to move or resize an existing region
  const startDragRegion = (
    e: React.MouseEvent,
    targetIndex: number | 'draft',
    type: 'move' | 'resize',
    handle?: 'nw' | 'ne' | 'se' | 'sw'
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (targetIndex !== 'draft') {
      onSelectEntry(targetIndex);
    }

    const currentRegion = targetIndex === 'draft' 
      ? draftRegion 
      : entries[targetIndex]?.region;

    if (!currentRegion) return;

    dragRef.current = {
      type,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startRegion: { ...currentRegion },
      targetIndex
    };

    const handleWindowMouseMove = (moveEvent: MouseEvent) => {
      if (!dragRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const deltaX = ((moveEvent.clientX - dragRef.current.startX) / rect.width) * 100;
      const deltaY = ((moveEvent.clientY - dragRef.current.startY) / rect.height) * 100;

      const { startRegion, targetIndex, type, handle } = dragRef.current;

      let newX = startRegion.x;
      let newY = startRegion.y;
      let newW = startRegion.width;
      let newH = startRegion.height;

      if (type === 'move') {
        newX = Math.max(0, Math.min(100 - startRegion.width, startRegion.x + deltaX));
        newY = Math.max(0, Math.min(100 - startRegion.height, startRegion.y + deltaY));
      } else if (type === 'resize' && handle) {
        if (handle === 'se') {
          newW = Math.max(4, Math.min(100 - startRegion.x, startRegion.width + deltaX));
          newH = Math.max(4, Math.min(100 - startRegion.y, startRegion.height + deltaY));
        } else if (handle === 'sw') {
          const right = startRegion.x + startRegion.width;
          newX = Math.max(0, Math.min(right - 4, startRegion.x + deltaX));
          newW = right - newX;
          newH = Math.max(4, Math.min(100 - startRegion.y, startRegion.height + deltaY));
        } else if (handle === 'ne') {
          const bottom = startRegion.y + startRegion.height;
          newY = Math.max(0, Math.min(bottom - 4, startRegion.y + deltaY));
          newH = bottom - newY;
          newW = Math.max(4, Math.min(100 - startRegion.x, startRegion.width + deltaX));
        } else if (handle === 'nw') {
          const right = startRegion.x + startRegion.width;
          const bottom = startRegion.y + startRegion.height;
          newX = Math.max(0, Math.min(right - 4, startRegion.x + deltaX));
          newY = Math.max(0, Math.min(bottom - 4, startRegion.y + deltaY));
          newW = right - newX;
          newH = bottom - newY;
        }
      }

      const updated = {
        x: Math.round(newX * 10) / 10,
        y: Math.round(newY * 10) / 10,
        width: Math.round(newW * 10) / 10,
        height: Math.round(newH * 10) / 10
      };

      if (targetIndex === 'draft') {
        onDraftRegionChange(updated);
      } else {
        const nextEntries = [...entries];
        nextEntries[targetIndex] = {
          ...nextEntries[targetIndex],
          region: updated
        };
        onEntriesChange(nextEntries);
      }
    };

    const handleWindowMouseUp = () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      dragRef.current = null;
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
  };

  // Add default central region
  const handleAddDefaultRegion = () => {
    onDraftRegionChange({
      x: 25,
      y: 25,
      width: 50,
      height: 50
    });
    setIsDrawModeActive(false);
  };

  return (
    <div className="space-y-3">
      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#18191A] p-2.5 rounded-xl border border-[#3E4042]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setIsDrawModeActive(!isDrawModeActive);
              if (!isDrawModeActive) onDraftRegionChange(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow ${
              isDrawModeActive 
                ? 'bg-rose-500 text-white ring-2 ring-rose-400' 
                : 'bg-[#242526] hover:bg-[#343536] text-gray-200 border border-[#3E4042]'
            }`}
          >
            <Crop size={13} />
            {isDrawModeActive ? 'Đang bật vẽ (Kéo chuột trên ảnh)' : '✏️ Kéo chuột vẽ vùng mới'}
          </button>

          <button
            type="button"
            onClick={handleAddDefaultRegion}
            className="px-2.5 py-1.5 rounded-lg bg-[#242526] hover:bg-[#343536] text-gray-300 text-xs font-medium border border-[#3E4042] transition-colors flex items-center gap-1"
            title="Tạo khung vuông mẫu 50% ở giữa ảnh"
          >
            <Maximize2 size={12} /> Khung giữa ảnh
          </button>
        </div>

        {draftRegion && (
          <button
            type="button"
            onClick={() => onDraftRegionChange(null)}
            className="text-[11px] text-gray-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
          >
            <X size={12} /> Hủy khung vẽ
          </button>
        )}
      </div>

      {/* Interactive Image Canvas */}
      <div 
        ref={containerRef}
        onMouseDown={handleImageMouseDown}
        onMouseMove={handleImageMouseMove}
        onMouseUp={handleImageMouseUp}
        className={`relative rounded-2xl overflow-hidden border border-[#3E4042] bg-[#101112] max-h-[480px] flex items-center justify-center select-none shadow-xl ${
          isDrawModeActive ? 'cursor-crosshair' : 'cursor-default'
        }`}
      >
        <img 
          ref={imageRef}
          src={imageUrl} 
          alt="Sản phẩm gốc" 
          className="max-h-[460px] w-auto max-w-full object-contain pointer-events-none rounded-lg block" 
          referrerPolicy="no-referrer" 
        />

        {/* 1. Render all configured saved entries as bounding boxes */}
        {entries.map((entry, idx) => {
          if (!entry.region) return null;
          const isSelected = activeEntryIndex === idx;
          const hex = entry.targetHex || '#3B82F6';

          return (
            <div
              key={entry.id || idx}
              onMouseDown={(e) => startDragRegion(e, idx, 'move')}
              style={{
                left: `${entry.region.x}%`,
                top: `${entry.region.y}%`,
                width: `${entry.region.width}%`,
                height: `${entry.region.height}%`,
                borderColor: hex,
                zIndex: isSelected ? 30 : 15
              }}
              className={`absolute border-2 cursor-move transition-shadow group ${
                isSelected 
                  ? 'shadow-[0_0_0_2px_rgba(255,255,255,0.9)] ring-2 ring-white/50' 
                  : 'hover:border-white'
              }`}
            >
              {/* Colored translucent overlay */}
              <div 
                className="w-full h-full pointer-events-none" 
                style={{ backgroundColor: `${hex}30` }} 
              />

              {/* Tag Badge */}
              <div 
                style={{ backgroundColor: hex }}
                className="absolute -top-5 left-0 px-2 py-0.5 rounded text-[9px] font-bold text-white shadow pointer-events-none whitespace-nowrap flex items-center gap-1.5"
              >
                <span>#{idx + 1} {entry.partName}</span>
                <span className="opacity-80">({entry.region.width.toFixed(0)}% × {entry.region.height.toFixed(0)}%)</span>
              </div>

              {/* Center Move Icon */}
              {isSelected && (
                <div className="absolute inset-0 m-auto w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center pointer-events-none backdrop-blur-sm">
                  <Move size={12} />
                </div>
              )}

              {/* 4 Corner Resize Handles */}
              {isSelected && (
                <>
                  <div
                    onMouseDown={(e) => startDragRegion(e, idx, 'resize', 'nw')}
                    className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-black rounded-sm cursor-nw-resize shadow z-40"
                  />
                  <div
                    onMouseDown={(e) => startDragRegion(e, idx, 'resize', 'ne')}
                    className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-black rounded-sm cursor-ne-resize shadow z-40"
                  />
                  <div
                    onMouseDown={(e) => startDragRegion(e, idx, 'resize', 'se')}
                    className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-black rounded-sm cursor-se-resize shadow z-40"
                  />
                  <div
                    onMouseDown={(e) => startDragRegion(e, idx, 'resize', 'sw')}
                    className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-black rounded-sm cursor-sw-resize shadow z-40"
                  />
                </>
              )}
            </div>
          );
        })}

        {/* 2. Render Draft Region (currently being drawn or configured) */}
        {draftRegion && (
          <div
            onMouseDown={(e) => startDragRegion(e, 'draft', 'move')}
            style={{
              left: `${draftRegion.x}%`,
              top: `${draftRegion.y}%`,
              width: `${draftRegion.width}%`,
              height: `${draftRegion.height}%`,
              borderColor: activeColorHex
            }}
            className="absolute border-2 border-dashed cursor-move z-35 animate-pulse shadow-[0_0_15px_rgba(255,255,255,0.4)]"
          >
            <div 
              className="w-full h-full pointer-events-none" 
              style={{ backgroundColor: `${activeColorHex}40` }} 
            />

            {/* Top Tag Badge */}
            <div 
              style={{ backgroundColor: activeColorHex }}
              className="absolute -top-5 left-0 px-2 py-0.5 rounded text-[9px] font-bold text-white shadow pointer-events-none whitespace-nowrap flex items-center gap-1.5"
            >
              <span>Vùng mới đang chọn</span>
              <span className="opacity-80">({draftRegion.width.toFixed(0)}% × {draftRegion.height.toFixed(0)}%)</span>
            </div>

            {/* Corner Resize Handles for Draft */}
            <div
              onMouseDown={(e) => startDragRegion(e, 'draft', 'resize', 'se')}
              className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-white border-2 border-black cursor-se-resize shadow-md flex items-center justify-center text-black hover:scale-125 transition-transform"
            >
              <Maximize2 size={8} />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-gray-400 px-1">
        <span>💡 Bấm nút <strong>"✏️ Kéo chuột vẽ vùng mới"</strong> rồi kéo chuột trên ảnh để khoanh mảng sản phẩm.</span>
        <span>{entries.filter(e => e.region).length} mảng đã khoanh</span>
      </div>
    </div>
  );
};
