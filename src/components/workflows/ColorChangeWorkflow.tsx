import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Palette, 
  MapPin, 
  Plus, 
  Trash2, 
  Sparkles, 
  Layers, 
  ArrowRight, 
  ArrowLeft, 
  Sliders, 
  RefreshCw, 
  Eye, 
  Check, 
  CheckCircle2, 
  Info,
  Crop
} from 'lucide-react';
import { AspectRatio, ColorChangeEntry, GenerationSettings, SurfaceFinish } from '../../../types';
import { FileDropzone } from '../common/FileDropzone';
import { ModelSelection } from '../common/ModelSelection';
import { StepIndicator } from '../common/StepIndicator';
import { ColorRegionSelector } from './ColorRegionSelector';

interface ColorChangeWorkflowProps {
  settings: GenerationSettings;
  setSettings: React.Dispatch<React.SetStateAction<GenerationSettings>>;
  colorChangeStep: number;
  setColorChangeStep: (step: number) => void;
  currentSampleImage: string | null;
  setCurrentSampleImage: (val: string | null) => void;
  onImageUpload: (filesOrEvent: React.ChangeEvent<HTMLInputElement> | FileList, type: 'product' | 'color_sample') => void;
  startGeneration: () => void;
}

// Bảng màu Elmich sang trọng cho đồ gia dụng
const ELMICH_PRESET_COLORS = [
  { name: 'Đỏ Ruby Elmich', r: 200, g: 16, b: 46, hex: '#C8102E' },
  { name: 'Xanh Navy Hoàng Gia', r: 0, g: 45, b: 98, hex: '#002D62' },
  { name: 'Xám Titan / Than chì', r: 62, g: 68, b: 75, hex: '#3E444B' },
  { name: 'Vàng Champagne', r: 247, g: 231, b: 206, hex: '#F7E7CE' },
  { name: 'Trắng Sữa Cao Cấp', r: 245, g: 245, b: 240, hex: '#F5F5F0' },
  { name: 'Đen Mờ Phantom', r: 28, g: 28, b: 30, hex: '#1C1C1E' },
  { name: 'Xanh Mint Pastel', r: 152, g: 216, b: 170, hex: '#98D8AA' },
  { name: 'Cam Nude Pastel', r: 247, g: 160, b: 114, hex: '#F7A072' },
];

export const ColorChangeWorkflow: React.FC<ColorChangeWorkflowProps> = ({
  settings,
  setSettings,
  colorChangeStep,
  setColorChangeStep,
  onImageUpload,
  startGeneration,
}) => {
  const productFilesRef = useRef<HTMLInputElement>(null);

  // Form states cho mảng màu đang thao tác
  const [partName, setPartName] = useState('');
  const [description, setDescription] = useState('');
  const [r, setR] = useState(200);
  const [g, setG] = useState(16);
  const [b, setB] = useState(46);
  const [finish, setFinish] = useState<SurfaceFinish>('MATTE');
  const [draftRegion, setDraftRegion] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [activeEntryIndex, setActiveEntryIndex] = useState<number | null>(null);

  // Chuyển đổi RGB sang HEX
  const rgbToHex = (red: number, green: number, blue: number) => {
    const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
    return `#${toHex(red)}${toHex(green)}${toHex(blue)}`.toUpperCase();
  };

  // Chuyển đổi HEX sang RGB
  const hexToRgb = (hex: string) => {
    const cleaned = hex.replace('#', '');
    if (cleaned.length === 6) {
      const red = parseInt(cleaned.substring(0, 2), 16);
      const green = parseInt(cleaned.substring(2, 4), 16);
      const blue = parseInt(cleaned.substring(4, 6), 16);
      if (!isNaN(red) && !isNaN(green) && !isNaN(blue)) {
        setR(red);
        setG(green);
        setB(blue);
      }
    }
  };

  const currentHex = rgbToHex(r, g, b);

  // Thêm hoặc cập nhật mảng màu vào danh sách
  const handleAddOrUpdateColor = () => {
    if (!partName.trim()) return;

    const newEntry: ColorChangeEntry = {
      id: Date.now().toString(),
      partName: partName.trim(),
      targetRgb: { r, g, b },
      targetHex: currentHex,
      finish,
      description: description.trim(),
      region: draftRegion || undefined,
      pin: draftRegion ? { x: Math.round(draftRegion.x + draftRegion.width / 2), y: Math.round(draftRegion.y + draftRegion.height / 2) } : undefined
    };

    if (activeEntryIndex !== null) {
      // Cập nhật mảng đang chọn
      setSettings(prev => {
        const updated = [...prev.colorChanges];
        updated[activeEntryIndex] = newEntry;
        return { ...prev, colorChanges: updated };
      });
      setActiveEntryIndex(null);
    } else {
      // Thêm mới
      setSettings(prev => ({
        ...prev,
        colorChanges: [...prev.colorChanges, newEntry]
      }));
    }

    // Reset form nhẹ nhàng
    setPartName('');
    setDescription('');
    setDraftRegion(null);
  };

  // Chọn một mảng từ danh sách để sửa
  const handleSelectEntryToEdit = (entry: ColorChangeEntry, index: number) => {
    setActiveEntryIndex(index);
    setPartName(entry.partName);
    setDescription(entry.description || '');
    if (entry.targetRgb) {
      setR(entry.targetRgb.r);
      setG(entry.targetRgb.g);
      setB(entry.targetRgb.b);
    }
    if (entry.finish) setFinish(entry.finish);
    setDraftRegion(entry.region || null);
  };

  // Xóa mảng màu
  const handleRemoveEntry = (index: number) => {
    setSettings(prev => ({
      ...prev,
      colorChanges: prev.colorChanges.filter((_, i) => i !== index)
    }));
    if (activeEntryIndex === index) {
      setActiveEntryIndex(null);
      setPartName('');
      setDescription('');
      setDraftRegion(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-[#242526] to-purple-500/10 border border-[#3E4042]/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shadow-lg">
            <Palette size={22} />
          </div>
          <div>
            <h3 className="text-white text-sm font-bold flex items-center gap-2">
              Đổi Màu Sản Phẩm Kỹ Thuật Số Chuẩn Xác
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Mã Màu sRGB
              </span>
            </h3>
            <p className="text-gray-400 text-xs mt-0.5">
              Click ghim mảng màu trực tiếp trên ảnh, chọn mã RGB chính xác và mô tả chi tiết vị trí đổi màu.
            </p>
          </div>
        </div>
      </div>

      <StepIndicator 
        current={colorChangeStep} 
        total={3} 
        labels={['1. Ảnh sản phẩm gốc', '2. Khoanh vùng & Mã RGB', '3. Xuất bản']} 
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={colorChangeStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* ======================= BƯỚC 1: ẢNH GỐC ======================= */}
          {colorChangeStep === 1 && (
            <div className="space-y-5">
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
                  <Layers size={14} className="text-[#1877F2]" />
                  Tải lên ảnh sản phẩm gốc cần đổi màu
                </label>

                <FileDropzone 
                  onFilesDrop={(f) => onImageUpload(f, 'product')} 
                  onClick={() => productFilesRef.current?.click()} 
                  className="h-64 bg-[#242526] border-2 border-dashed border-[#3E4042] rounded-2xl flex flex-col items-center justify-center cursor-pointer overflow-hidden group hover:border-[#1877F2] transition-all p-4 relative"
                >
                  {settings.productImages[0] ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img 
                        src={settings.productImages[0]} 
                        alt="Ảnh sản phẩm gốc" 
                        className="max-h-full max-w-full object-contain rounded-lg shadow-md" 
                        referrerPolicy="no-referrer" 
                      />
                      <div className="absolute bottom-2 right-2 px-2.5 py-1 bg-black/70 backdrop-blur-md rounded-lg text-[10px] text-gray-300 font-medium border border-white/10 flex items-center gap-1">
                        <Eye size={12} className="text-emerald-400" /> Đã sẵn sàng
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <div className="w-14 h-14 mx-auto rounded-2xl bg-[#18191A] border border-[#3E4042] flex items-center justify-center text-gray-400 group-hover:text-[#1877F2] group-hover:border-[#1877F2] transition-colors shadow-lg">
                        <Palette size={28} />
                      </div>
                      <div className="text-xs font-bold text-gray-200">
                        Kéo thả ảnh sản phẩm hoặc click để tải lên
                      </div>
                      <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
                        Ảnh chất lượng cao, rõ nét từng chi tiết vỏ nhựa, kim loại Inox và quai cầm.
                      </p>
                    </div>
                  )}
                </FileDropzone>
                <input type="file" hidden ref={productFilesRef} accept="image/*" onChange={e => onImageUpload(e, 'product')} />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Tên sản phẩm</label>
                <input 
                  type="text" 
                  placeholder="VD: Nồi chiên không dầu Elmich, Ấm siêu tốc..." 
                  className="w-full bg-[#242526] border border-[#3E4042] rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-[#1877F2] transition-colors" 
                  value={settings.productName} 
                  onChange={e => setSettings({ ...settings, productName: e.target.value })} 
                />
              </div>

              <button 
                disabled={!settings.productImages[0]} 
                onClick={() => setColorChangeStep(2)} 
                className="w-full py-4 bg-[#1877F2] hover:bg-blue-600 text-white font-bold rounded-xl uppercase text-xs disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                Tiếp tục: Ghim mảng & Chọn mã màu RGB
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* ======================= BƯỚC 2: KHOANH VÙNG & CHỌN MÃ RGB ======================= */}
          {colorChangeStep === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* CỘT TRÁI (7/12): Canvas chọn vùng tương tác trên ảnh */}
                <div className="lg:col-span-7 space-y-3">
                  <ColorRegionSelector
                    imageUrl={settings.productImages[0]}
                    entries={settings.colorChanges}
                    onEntriesChange={(newEntries) => {
                      setSettings(prev => ({ ...prev, colorChanges: newEntries }));
                    }}
                    activeEntryIndex={activeEntryIndex}
                    onSelectEntry={(idx) => {
                      if (idx !== null && settings.colorChanges[idx]) {
                        handleSelectEntryToEdit(settings.colorChanges[idx], idx);
                      } else {
                        setActiveEntryIndex(null);
                        setPartName('');
                        setDescription('');
                        setDraftRegion(null);
                      }
                    }}
                    draftRegion={draftRegion}
                    onDraftRegionChange={setDraftRegion}
                    activeColorHex={currentHex}
                  />
                </div>

                {/* CỘT PHẢI (5/12): Bộ chọn mã màu RGB & mô tả chi tiết */}
                <div className="lg:col-span-5 space-y-4 bg-[#242526] p-4 rounded-2xl border border-[#3E4042]">
                  <div className="flex items-center justify-between pb-2 border-b border-[#3E4042]">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Palette size={14} className="text-[#1877F2]" />
                      {activeEntryIndex !== null ? `Chỉnh sửa mảng #${activeEntryIndex + 1}` : 'Thêm mảng màu mới'}
                    </span>
                    {activeEntryIndex !== null && (
                      <button 
                        onClick={() => {
                          setActiveEntryIndex(null);
                          setPartName('');
                          setDescription('');
                          setDraftRegion(null);
                        }}
                        className="text-[10px] text-gray-400 hover:text-white"
                      >
                        Huỷ sửa
                      </button>
                    )}
                  </div>

                  {/* 1. Tên bộ phận */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                      Tên bộ phận / Vị trí mảng
                    </label>
                    <input 
                      type="text" 
                      placeholder="VD: Thân vỏ ngoài, Tay cầm nắp, Đế máy..." 
                      className="w-full bg-[#18191A] border border-[#3E4042] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#1877F2]" 
                      value={partName} 
                      onChange={e => setPartName(e.target.value)} 
                    />
                  </div>

                  {/* 2. Bảng chọn mã màu RGB & HEX */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">
                        Mã màu mục tiêu (RGB / HEX)
                      </label>
                      <div className="flex items-center gap-2">
                        {/* Swatch màu thực tế */}
                        <div 
                          style={{ backgroundColor: currentHex }}
                          className="w-6 h-6 rounded-lg border border-white/30 shadow-md"
                        />
                        <span className="font-mono text-xs font-bold text-white">
                          {currentHex}
                        </span>
                      </div>
                    </div>

                    {/* Thanh trượt R, G, B */}
                    <div className="space-y-2 bg-[#18191A] p-3 rounded-xl border border-[#3E4042]">
                      {/* RED */}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="w-4 font-bold text-rose-400">R</span>
                        <input 
                          type="range" 
                          min="0" 
                          max="255" 
                          value={r} 
                          onChange={e => setR(Number(e.target.value))}
                          className="flex-1 accent-rose-500 cursor-pointer"
                        />
                        <input 
                          type="number" 
                          min="0" 
                          max="255" 
                          value={r} 
                          onChange={e => setR(Math.max(0, Math.min(255, Number(e.target.value))))}
                          className="w-12 bg-[#242526] border border-[#3E4042] rounded px-1.5 py-0.5 text-center text-xs text-white font-mono"
                        />
                      </div>

                      {/* GREEN */}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="w-4 font-bold text-emerald-400">G</span>
                        <input 
                          type="range" 
                          min="0" 
                          max="255" 
                          value={g} 
                          onChange={e => setG(Number(e.target.value))}
                          className="flex-1 accent-emerald-500 cursor-pointer"
                        />
                        <input 
                          type="number" 
                          min="0" 
                          max="255" 
                          value={g} 
                          onChange={e => setG(Math.max(0, Math.min(255, Number(e.target.value))))}
                          className="w-12 bg-[#242526] border border-[#3E4042] rounded px-1.5 py-0.5 text-center text-xs text-white font-mono"
                        />
                      </div>

                      {/* BLUE */}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="w-4 font-bold text-blue-400">B</span>
                        <input 
                          type="range" 
                          min="0" 
                          max="255" 
                          value={b} 
                          onChange={e => setB(Number(e.target.value))}
                          className="flex-1 accent-blue-500 cursor-pointer"
                        />
                        <input 
                          type="number" 
                          min="0" 
                          max="255" 
                          value={b} 
                          onChange={e => setB(Math.max(0, Math.min(255, Number(e.target.value))))}
                          className="w-12 bg-[#242526] border border-[#3E4042] rounded px-1.5 py-0.5 text-center text-xs text-white font-mono"
                        />
                      </div>

                      {/* Input màu trực quan */}
                      <div className="pt-2 border-t border-[#3E4042] flex items-center justify-between text-xs">
                        <span className="text-[10px] text-gray-400">Chọn nhanh bằng bảng màu:</span>
                        <input 
                          type="color" 
                          value={currentHex} 
                          onChange={e => hexToRgb(e.target.value)}
                          className="w-8 h-6 bg-transparent border-0 cursor-pointer rounded overflow-hidden" 
                        />
                      </div>
                    </div>

                    {/* Palette gợi ý Elmich */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Gợi ý màu Elmich cao cấp</span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {ELMICH_PRESET_COLORS.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setR(preset.r);
                              setG(preset.g);
                              setB(preset.b);
                            }}
                            className="p-1.5 rounded-lg bg-[#18191A] border border-[#3E4042] hover:border-white transition-all text-left flex items-center gap-1.5 group"
                            title={preset.name}
                          >
                            <span 
                              style={{ backgroundColor: preset.hex }}
                              className="w-3.5 h-3.5 rounded-full inline-block flex-shrink-0 border border-white/20"
                            />
                            <span className="text-[9px] text-gray-300 truncate">
                              {preset.name.split(' ')[0]}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 3. Hoàn thiện bề mặt */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                      Chất liệu hoàn thiện bề mặt
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 text-center">
                      {[
                        { id: 'MATTE' as const, label: 'Sơn mờ' },
                        { id: 'GLOSSY' as const, label: 'Sơn bóng' },
                        { id: 'METALLIC' as const, label: 'Ánh kim' },
                        { id: 'SATIN' as const, label: 'Satin mịn' },
                        { id: 'INOX_POLISHED' as const, label: '✨ Inox bóng gương' },
                        { id: 'INOX_BRUSHED' as const, label: 'Inox xước 304' }
                      ].map(item => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setFinish(item.id)}
                          className={`py-1.5 px-1 rounded-lg text-[10px] font-bold border transition-all ${
                            finish === item.id 
                              ? 'border-[#1877F2] bg-[#1877F2] text-white shadow-sm' 
                              : 'border-[#3E4042] bg-[#18191A] text-gray-400 hover:text-white'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4. Mô tả text chi tiết cho mảng màu */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                      Mô tả chi tiết vùng màu (Text Description)
                    </label>
                    <textarea 
                      placeholder="VD: Chỉ đổi màu cho phần vỏ nhựa ABS màu trắng cũ sang màu mới, giữ nguyên viền Inox 304 và núm xoay mạ chrome..." 
                      className="w-full bg-[#18191A] border border-[#3E4042] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#1877F2] h-16 resize-none custom-scrollbar" 
                      value={description} 
                      onChange={e => setDescription(e.target.value)} 
                    />
                  </div>

                  {/* Nút thêm / cập nhật */}
                  <button
                    type="button"
                    onClick={handleAddOrUpdateColor}
                    disabled={!partName.trim()}
                    className="w-full py-3 bg-[#1877F2] hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg"
                  >
                    <Plus size={15} />
                    {activeEntryIndex !== null ? 'Cập nhật mảng màu' : '+ Thêm vào danh sách đổi màu'}
                  </button>
                </div>
              </div>

              {/* Danh sách các mảng màu đã cấu hình */}
              {settings.colorChanges.length > 0 && (
                <div className="p-4 rounded-2xl bg-[#242526] border border-[#3E4042] space-y-3">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-400" />
                    Danh sách các mảng màu sẽ đổi ({settings.colorChanges.length} mảng)
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {settings.colorChanges.map((item, idx) => {
                      const hexColor = item.targetHex || rgbToHex(item.targetRgb?.r || 200, item.targetRgb?.g || 16, item.targetRgb?.b || 46);
                      const isSelected = activeEntryIndex === idx;

                      return (
                        <div 
                          key={idx}
                          onClick={() => handleSelectEntryToEdit(item, idx)}
                          className={`p-3 rounded-xl border bg-[#18191A] cursor-pointer transition-all flex flex-col justify-between relative group ${
                            isSelected ? 'border-[#1877F2] ring-1 ring-[#1877F2]' : 'border-[#3E4042] hover:border-gray-500'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span 
                                style={{ backgroundColor: hexColor }}
                                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white border border-white/30 shadow"
                              >
                                {idx + 1}
                              </span>
                              <div>
                                <h4 className="text-xs font-bold text-white">{item.partName}</h4>
                                <span className="font-mono text-[10px] text-gray-400">
                                  {hexColor} • RGB({item.targetRgb?.r || 0}, {item.targetRgb?.g || 0}, {item.targetRgb?.b || 0})
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveEntry(idx);
                              }}
                              className="text-gray-500 hover:text-rose-400 p-1 transition-colors"
                              title="Xóa mảng này"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          {item.description && (
                            <p className="text-[10px] text-gray-400 mt-2 line-clamp-2 italic">
                              "{item.description}"
                            </p>
                          )}

                          <div className="mt-2 pt-2 border-t border-[#3E4042]/50 flex items-center justify-between text-[9px] text-gray-400">
                            <span>Bề mặt: <strong className="text-white">
                              {item.finish === 'INOX_POLISHED' ? '✨ Inox bóng gương' :
                               item.finish === 'INOX_BRUSHED' ? 'Inox xước 304' :
                               item.finish === 'GLOSSY' ? 'Sơn bóng' :
                               item.finish === 'METALLIC' ? 'Ánh kim' :
                               item.finish === 'SATIN' ? 'Satin mịn' : 'Sơn mờ'}
                            </strong></span>
                            {item.region ? (
                              <span className="text-emerald-400">Vùng ({item.region.width.toFixed(0)}% × {item.region.height.toFixed(0)}%)</span>
                            ) : item.pin ? (
                              <span className="text-emerald-400">Ghim (X:{item.pin.x}%, Y:{item.pin.y}%)</span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Điều hướng */}
              <div className="flex gap-3">
                <button 
                  onClick={() => setColorChangeStep(1)} 
                  className="flex-1 py-3.5 border border-[#3E4042] hover:bg-[#242526] text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft size={14} /> Quay lại
                </button>
                <button 
                  disabled={settings.colorChanges.length === 0}
                  onClick={() => setColorChangeStep(3)} 
                  className="flex-[2] py-3.5 bg-[#1877F2] hover:bg-blue-600 disabled:opacity-50 text-white font-bold rounded-xl uppercase text-xs transition-colors flex items-center justify-center gap-2 shadow-lg"
                >
                  Tiếp tục: Cấu hình studio & Xuất bản
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* ======================= BƯỚC 3: XUẤT BẢN ======================= */}
          {colorChangeStep === 3 && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-[#242526] border border-[#3E4042] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <Sliders size={14} className="text-gray-400" />
                    Cấu hình Studio & Model AI
                  </span>
                  <span className="text-[11px] text-gray-400">
                    Đã cấu hình: <strong className="text-white">{settings.colorChanges.length} mảng màu</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Tỷ lệ khung hình</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['1:1', '4:3', '3:4', '16:9'] as const).map(ratio => (
                        <button
                          key={ratio}
                          type="button"
                          onClick={() => setSettings({ ...settings, aspectRatio: ratio })}
                          className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                            settings.aspectRatio === ratio
                              ? 'border-[#1877F2] bg-[#1877F2] text-white shadow-sm'
                              : 'border-[#3E4042] bg-[#18191A] text-gray-300 hover:border-gray-500'
                          }`}
                        >
                          {ratio}
                        </button>
                      ))}
                    </div>
                  </div>

                  <ModelSelection 
                    imageSize={settings.imageSize} 
                    onChange={(size) => setSettings({ ...settings, imageSize: size })} 
                    imageModel={settings.imageModel} 
                    onModelChange={(model) => setSettings({ ...settings, imageModel: model })} 
                  />
                </div>
              </div>

              {/* Điều hướng & Nút Tạo ảnh */}
              <div className="flex gap-3">
                <button 
                  onClick={() => setColorChangeStep(2)} 
                  className="flex-1 py-4 border border-[#3E4042] hover:bg-[#242526] text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft size={14} /> Quay lại
                </button>
                <button 
                  onClick={() => startGeneration()} 
                  className="flex-[2] py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl uppercase text-xs transition-all flex items-center justify-center gap-2 shadow-xl active:scale-[0.99]"
                >
                  <Sparkles size={16} />
                  🚀 Tạo ảnh đổi màu sản phẩm chính xác
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
