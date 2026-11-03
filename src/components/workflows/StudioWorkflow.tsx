import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Wand2, Check, Sparkles, Plus, Trash2, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { AISuggestions, ConceptSuggestion, GenerationSettings, EmptySpacePosition } from '../../../types';
import { analyzeProductMaterials } from '../../../services/geminiService';
import { FileDropzone } from '../common/FileDropzone';
import { StepIndicator } from '../common/StepIndicator';

const EMPTY_SPACE_OPTIONS: { id: EmptySpacePosition; label: string }[] = [
  { id: 'TOP', label: 'Ở trên' },
  { id: 'BOTTOM', label: 'Ở dưới' },
  { id: 'LEFT', label: 'Bên trái' },
  { id: 'RIGHT', label: 'Bên phải' },
  { id: 'NONE', label: 'Không để trống' },
];

interface StudioWorkflowProps {
  settings: GenerationSettings;
  setSettings: React.Dispatch<React.SetStateAction<GenerationSettings>>;
  studioStep: number;
  setStudioStep: (step: number) => void;
  suggestions: AISuggestions;
  onImageUpload: (filesOrEvent: React.ChangeEvent<HTMLInputElement> | FileList, type: 'product') => void;
  isAnalyzingMaterial: boolean;
  setIsAnalyzingMaterial: (val: boolean) => void;
  setAlertMessage: (msg: string | null) => void;
  handleStudioAnalysis: () => void;
  handleSelectStudioConcept: (c: ConceptSuggestion) => void;
  handleStudioPropSuggestion?: () => void;
  handleMoreStudioPropSuggestion: () => void;
  handleAutoSelectProps: () => void;
  handleClearAllProps: () => void;
  customProp: string;
  setCustomProp: (val: string) => void;
  addCustomPropToList: () => void;
  toggleProp: (propName: string) => void;
  renderCameraSettings: (onBack: () => void) => React.ReactNode;
}

/** Workflow 8 — Chụp ảnh trong Studio (STUDIO) tối ưu 3 bước với 1 lần suy luận toàn diện */
export const StudioWorkflow: React.FC<StudioWorkflowProps> = ({
  settings,
  setSettings,
  studioStep,
  setStudioStep,
  suggestions,
  onImageUpload,
  isAnalyzingMaterial,
  setIsAnalyzingMaterial,
  setAlertMessage,
  handleStudioAnalysis,
  handleSelectStudioConcept,
  handleMoreStudioPropSuggestion,
  handleAutoSelectProps,
  handleClearAllProps,
  customProp,
  setCustomProp,
  addCustomPropToList,
  toggleProp,
  renderCameraSettings,
}) => {
  const productFilesRef = useRef<HTMLInputElement>(null);

  const toggleEmptySpace = (posId: EmptySpacePosition) => {
    if (posId === 'NONE') {
      setSettings(prev => ({ ...prev, emptySpacePosition: ['NONE'] }));
    } else {
      const current = (settings.emptySpacePosition || []).filter(p => p !== 'NONE');
      const exists = current.includes(posId);
      const next = exists ? current.filter(p => p !== posId) : [...current, posId];
      setSettings(prev => ({
        ...prev,
        emptySpacePosition: next.length === 0 ? ['NONE'] : next
      }));
    }
  };

  return (
    <div className="space-y-6">
      <StepIndicator current={studioStep} total={3} labels={['Dữ liệu', 'Phong cách Studio & Đạo cụ', 'Cấu hình & Tạo ảnh']} />

      <AnimatePresence mode="wait">
        <motion.div
          key={studioStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* BƯỚC 1: DỮ LIỆU SẢN PHẨM */}
          {studioStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-bold text-white uppercase mb-2">Thông tin sản phẩm</label>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Tên sản phẩm..."
                        className="col-span-2 bg-[#242526] border border-[#3E4042] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#1877F2] transition-colors"
                        value={settings.productName}
                        onChange={e => setSettings({ ...settings, productName: e.target.value })}
                      />
                      <input
                        type="text"
                        placeholder="Mã sản phẩm..."
                        className="bg-[#242526] border border-[#3E4042] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#1877F2] transition-colors"
                        value={settings.productCode || ''}
                        onChange={e => setSettings({ ...settings, productCode: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {['length', 'width', 'height'].map(f => (
                        <input
                          key={f}
                          type="number"
                          placeholder={f === 'length' ? 'Dài (mm)' : f === 'width' ? 'Rộng (mm)' : 'Cao (mm)'}
                          className="bg-[#242526] border border-[#3E4042] rounded-lg p-2 text-xs text-white outline-none focus:border-[#1877F2]"
                          value={(settings.dimensions as any)[f]}
                          onChange={e => setSettings({ ...settings, dimensions: { ...settings.dimensions, [f]: e.target.value } })}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-white uppercase mb-2">Mô tả đặc tính vật liệu (Quan trọng để khử CGI)</label>
                    <textarea
                      rows={3}
                      placeholder="Ví dụ: Inox xước hairline mờ, tay cầm nhựa nhám, nắp kính cường lực..."
                      className="w-full bg-[#242526] border border-[#3E4042] rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-[#1877F2] resize-none transition-all placeholder:text-gray-500"
                      value={settings.whiteBGMaterialsDescription || ''}
                      onChange={e => setSettings({ ...settings, whiteBGMaterialsDescription: e.target.value })}
                    />
                  </div>

                  <button
                    type="button"
                    disabled={settings.productImages.length === 0 || isAnalyzingMaterial}
                    onClick={async (e) => {
                      e.preventDefault();
                      if (settings.productImages.length === 0) return;
                      setIsAnalyzingMaterial(true);
                      try {
                        const result = await analyzeProductMaterials(settings.productImages[0]);
                        setSettings(s => ({
                          ...s,
                          whiteBGSelectedCategories: result.categories,
                          whiteBGMaterialsDescription: result.description
                        }));
                      } catch (err: any) {
                        console.error("Auto analyze failed:", err);
                        setAlertMessage("Lỗi phân tích chất liệu. Vui lòng thử lại.");
                      } finally {
                        setIsAnalyzingMaterial(false);
                      }
                    }}
                    className="w-full py-2 bg-[#2A2B2C] border border-[#1877F2]/30 text-[#1877F2] font-bold rounded-xl text-xs hover:bg-[#1877F2]/10 transition-all flex items-center justify-center gap-2"
                  >
                    {isAnalyzingMaterial ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                    {isAnalyzingMaterial ? 'Đang phân tích chất liệu...' : '✨ Tự động nhận diện chất liệu bằng AI'}
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-bold text-white uppercase mb-2">Ảnh sản phẩm (Nền trắng hoặc ảnh chụp điện thoại)</label>
                    <div className="grid grid-cols-5 gap-2">
                      {settings.productImages.map((img, i) => (
                        <div key={i} className="aspect-square bg-[#242526] border border-[#3E4042] rounded-lg overflow-hidden relative group">
                          <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <button
                            type="button"
                            onClick={() => setSettings(s => ({ ...s, productImages: s.productImages.filter((_, idx) => idx !== i) }))}
                            className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 transition-all text-xs flex items-center justify-center text-white"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      {settings.productImages.length < 5 && (
                        <FileDropzone onFilesDrop={(f) => onImageUpload(f, 'product')} onClick={() => productFilesRef.current?.click()} className="aspect-square border-2 border-dashed border-[#3E4042] rounded-lg text-white flex items-center justify-center hover:border-[#1877F2] transition-all">
                          +
                        </FileDropzone>
                      )}
                    </div>
                    <input type="file" hidden ref={productFilesRef} accept="image/*" multiple onChange={e => onImageUpload(e, 'product')} />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleStudioAnalysis}
                className="w-full py-4 bg-[#1877F2] text-white font-bold rounded-xl uppercase text-xs shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles size={16} /> Phân tích & Đề xuất Studio Concept Toàn diện
              </button>
            </div>
          )}

          {/* BƯỚC 2: PHONG CÁCH STUDIO & ĐẠO CỤ (GỘP SUY LUẬN & CHỈNH SỬA TRỰC TIẾP) */}
          {studioStep === 2 && (
            <div className="space-y-6">
              {/* 1. LỰA CHỌN CONCEPT STUDIO */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles size={14} className="text-[#1877F2]" /> 1. Lựa chọn Concept Studio ({suggestions.concepts.length} gợi ý)
                  </label>
                  <span className="text-[10px] text-gray-400">Tone-sur-tone liền mạch, bục đỡ & ánh sáng 3-point</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                  {suggestions.concepts.map((c, idx) => {
                    const isSelected = settings.concept === c.prompt;
                    const propCount = c.props?.length || 0;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectStudioConcept(c)}
                        className={`text-left p-3.5 rounded-xl border transition-all relative flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#1877F2]/15 border-[#1877F2] text-white shadow-[0_0_15px_rgba(24,119,242,0.25)] ring-1 ring-[#1877F2]'
                            : 'bg-[#242526] border-[#3E4042] text-white hover:bg-[#3A3B3C] hover:border-gray-500'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="font-bold text-xs text-white flex items-center gap-1.5">
                              {isSelected && <span className="w-2 h-2 rounded-full bg-[#1877F2] animate-pulse" />}
                              {c.title || `Concept ${idx + 1}`}
                            </span>
                            {isSelected && (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-[#1877F2] text-white uppercase">
                                Đang chọn
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-300 line-clamp-2 leading-relaxed opacity-90">
                            {c.prompt}
                          </p>
                        </div>

                        {propCount > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[9px] text-[#1877F2] font-semibold">
                            <span>✨ Bục & {propCount} đạo cụ</span>
                            <span className="text-gray-400 font-normal">Nhấn để xem</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. KHUNG TINH CHỈNH CHI TIẾT STUDIO */}
              <div className="bg-[#242526] p-4 rounded-2xl border border-[#3E4042] space-y-5">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
                  {/* Cột trái: Mô tả Studio & Vị trí đặt */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[10px] font-bold text-white uppercase">2. Bố cục Studio, Nền giấy & Ánh sáng</label>
                        <span className="text-[9px] text-gray-400">Có thể chỉnh sửa chi tiết</span>
                      </div>
                      <textarea
                        rows={4}
                        placeholder="Mô tả bố cục studio, nền giấy tone-sur-tone, hệ thống ánh sáng..."
                        className="w-full bg-[#18191A] border border-[#3E4042] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#1877F2] resize-none custom-scrollbar leading-relaxed"
                        value={settings.concept}
                        onChange={e => setSettings({ ...settings, concept: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-white uppercase mb-1.5">3. Vị trí & Góc chụp sản phẩm</label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Đặt chính giữa bục studio, góc chụp ngang tầm mắt 0-15 độ, ánh sáng viền sắc nét..."
                        className="w-full bg-[#18191A] border border-[#3E4042] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#1877F2]"
                        value={settings.placement}
                        onChange={e => setSettings({ ...settings, placement: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Cột phải: Bục đỡ & Đạo cụ Studio đi kèm */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-[10px] font-bold text-white uppercase block">
                          4. Bục đỡ & Đạo cụ Studio tối giản
                        </label>
                        <span className="text-[9px] text-gray-400">
                          Đã chọn <strong className="text-[#1877F2]">{settings.props.length}</strong> món
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleAutoSelectProps}
                          className="px-2 py-1 bg-[#3A3B3C] hover:bg-[#4E4F50] text-white rounded text-[9px] font-semibold transition-all flex items-center gap-1"
                          title="Tự động chọn 3 đạo cụ tiêu biểu nhất"
                        >
                          <Check size={11} /> Chọn 3 món
                        </button>
                        <button
                          type="button"
                          onClick={handleClearAllProps}
                          className="px-2 py-1 bg-[#3A3B3C] hover:bg-red-500/20 text-gray-300 hover:text-red-400 rounded text-[9px] font-semibold transition-all flex items-center gap-1"
                          title="Bỏ chọn tất cả"
                        >
                          <Trash2 size={11} /> Bỏ chọn
                        </button>
                        <button
                          type="button"
                          onClick={handleMoreStudioPropSuggestion}
                          className="px-2 py-1 bg-[#1877F2]/20 hover:bg-[#1877F2]/30 text-[#1877F2] rounded text-[9px] font-semibold transition-all flex items-center gap-1"
                          title="Tìm thêm đạo cụ studio mới từ AI"
                        >
                          <Wand2 size={11} /> Thêm gợi ý
                        </button>
                      </div>
                    </div>

                    {/* Chips đạo cụ */}
                    <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto custom-scrollbar p-2 bg-[#18191A] rounded-xl border border-[#3E4042]">
                      {suggestions.props.length === 0 ? (
                        <div className="text-[10px] text-gray-400 py-3 text-center w-full italic">
                          Chưa có gợi ý đạo cụ. Vui lòng chọn một concept phía trên.
                        </div>
                      ) : (
                        suggestions.props.map(p => {
                          const isSelected = settings.props.some(item => item.name === p);
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => toggleProp(p)}
                              className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-medium transition-all flex items-center gap-1.5 text-left ${
                                isSelected
                                  ? 'bg-[#1877F2] text-white border-[#1877F2] shadow-sm'
                                  : 'bg-[#242526] text-gray-300 border-[#3E4042] hover:border-gray-400 hover:text-white'
                              }`}
                            >
                              {isSelected ? <Check size={11} strokeWidth={3} /> : <Plus size={11} className="opacity-50" />}
                              <span>{p}</span>
                            </button>
                          );
                        })
                      )}
                    </div>

                    {/* Thêm đạo cụ tự gõ */}
                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Tự nhập thêm bục / đạo cụ studio..."
                        className="flex-1 bg-[#18191A] border border-[#3E4042] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#1877F2]"
                        value={customProp}
                        onChange={e => setCustomProp(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addCustomPropToList()}
                      />
                      <button
                        type="button"
                        onClick={addCustomPropToList}
                        className="px-4 bg-[#3A3B3C] hover:bg-[#1877F2] text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1"
                      >
                        <Plus size={14} /> Thêm
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nút điều hướng */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStudioStep(1)}
                  className="flex-1 py-4 border border-[#3E4042] text-white rounded-xl uppercase text-xs font-bold hover:bg-[#242526] flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={14} /> Quay lại Bước 1
                </button>
                <button
                  type="button"
                  onClick={() => setStudioStep(3)}
                  className="flex-[2] py-4 bg-[#1877F2] text-white font-bold rounded-xl uppercase text-xs shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
                >
                  Tiếp tục: Cấu hình ảnh & Vị trí để trống <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* BƯỚC 3: CẤU HÌNH ẢNH & VỊ TRÍ ĐỂ TRỐNG & TẠO ẢNH */}
          {studioStep === 3 && (
            <div className="space-y-5">
              {/* Tóm tắt concept studio đã chọn */}
              <div className="bg-[#242526] rounded-xl p-4 border border-[#3E4042] flex items-center justify-between">
                <div>
                  <div className="text-[9px] font-bold text-[#1877F2] uppercase mb-0.5">Concept Studio đã chọn:</div>
                  <h4 className="text-white font-bold text-sm">
                    {settings.conceptTitle || 'Studio Tối giản Cao cấp'}
                  </h4>
                  <p className="text-[10px] text-gray-300 line-clamp-1 mt-0.5">
                    {settings.concept}
                  </p>
                  <div className="text-[9px] text-gray-400 mt-1">
                    Đạo cụ áp dụng: <strong className="text-white">{settings.props.length} món</strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStudioStep(2)}
                  className="px-3 py-1.5 border border-[#3E4042] hover:border-[#1877F2] text-xs text-gray-300 hover:text-white rounded-lg transition-all flex items-center gap-1.5 shrink-0 ml-4"
                >
                  <RotateCcw size={12} /> Đổi concept / Sửa đạo cụ
                </button>
              </div>

              {/* VỊ TRÍ ĐỂ TRỐNG CHÈN TEXT/BANNER */}
              <div className="bg-[#242526] rounded-xl p-4 border border-[#3E4042] space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-white uppercase">
                    Vị trí để trống chèn Text / Logo thương hiệu (Chọn nhiều)
                  </label>
                  <span className="text-[9px] text-gray-400">Tối ưu bố cục trống trên nền giấy tone-sur-tone</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {EMPTY_SPACE_OPTIONS.map(pos => {
                    const isSelected = (settings.emptySpacePosition || []).includes(pos.id);
                    return (
                      <button
                        key={pos.id}
                        type="button"
                        onClick={() => toggleEmptySpace(pos.id)}
                        className={`py-2.5 px-3 rounded-lg border text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-[#1877F2] text-white border-[#1877F2] shadow-sm'
                            : 'bg-[#18191A] border-[#3E4042] text-gray-300 hover:text-white hover:border-gray-500'
                        }`}
                      >
                        {isSelected && <Check size={12} strokeWidth={3} />}
                        {pos.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CAMERA SETTINGS, MODEL SELECTION & NÚT TẠO ẢNH */}
              {renderCameraSettings(() => setStudioStep(2))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
