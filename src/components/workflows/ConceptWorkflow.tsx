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

interface ConceptWorkflowProps {
  settings: GenerationSettings;
  setSettings: React.Dispatch<React.SetStateAction<GenerationSettings>>;
  conceptStep: number;
  setConceptStep: (step: number) => void;
  suggestions: AISuggestions;
  onImageUpload: (filesOrEvent: React.ChangeEvent<HTMLInputElement> | FileList, type: 'product' | 'reference') => void;
  isAnalyzingMaterial: boolean;
  setIsAnalyzingMaterial: (val: boolean) => void;
  setAlertMessage: (msg: string | null) => void;
  handleConceptAnalysis: () => void;
  handleSelectConcept: (c: ConceptSuggestion) => void;
  handlePropSuggestion?: () => void;
  handleMorePropSuggestion: () => void;
  handleAutoSelectProps: () => void;
  handleClearAllProps: () => void;
  customProp: string;
  setCustomProp: (val: string) => void;
  addCustomPropToList: () => void;
  toggleProp: (propName: string) => void;
  renderCameraSettings: (onBack: () => void) => React.ReactNode;
}

/** Workflow 1 — Ảnh phối cảnh (CONCEPT/LIFESTYLE) tối ưu 3 bước với 1 lần suy luận toàn diện */
export const ConceptWorkflow: React.FC<ConceptWorkflowProps> = ({
  settings,
  setSettings,
  conceptStep,
  setConceptStep,
  suggestions,
  onImageUpload,
  isAnalyzingMaterial,
  setIsAnalyzingMaterial,
  setAlertMessage,
  handleConceptAnalysis,
  handleSelectConcept,
  handleMorePropSuggestion,
  handleAutoSelectProps,
  handleClearAllProps,
  customProp,
  setCustomProp,
  addCustomPropToList,
  toggleProp,
  renderCameraSettings,
}) => {
  const productFilesRef = useRef<HTMLInputElement>(null);
  const refFileRef = useRef<HTMLInputElement>(null);

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
      <StepIndicator current={conceptStep} total={3} labels={['Dữ liệu', 'Phong cách & Đạo cụ', 'Cấu hình & Tạo ảnh']} />

      <AnimatePresence mode="wait">
        <motion.div
          key={conceptStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* BƯỚC 1: DỮ LIỆU SẢN PHẨM */}
          {conceptStep === 1 && (
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
                          className="bg-[#242526] border border-[#3E4042] rounded-lg p-2 text-xs text-white outline-none focus:border-[#1877F2] transition-colors"
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
                    <label className="block text-[9px] font-bold text-white uppercase mb-2">Ảnh sản phẩm (Tải 1-5 ảnh)</label>
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
                        <FileDropzone onFilesDrop={(f) => onImageUpload(f, 'product')} onClick={() => productFilesRef.current?.click()} className="aspect-square border-2 border-dashed border-[#3E4042] rounded-lg text-white/40 flex items-center justify-center hover:border-[#1877F2] hover:text-[#1877F2] transition-all">
                          +
                        </FileDropzone>
                      )}
                    </div>
                    <input type="file" hidden ref={productFilesRef} accept="image/*" multiple onChange={e => onImageUpload(e, 'product')} />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-white uppercase mb-2">Ảnh mẫu style tham khảo (Tùy chọn)</label>
                    <FileDropzone onFilesDrop={(f) => onImageUpload(f, 'reference')} onClick={() => refFileRef.current?.click()} className="h-24 w-full bg-[#242526] border-2 border-dashed border-[#3E4042] rounded-xl flex items-center justify-center cursor-pointer hover:border-[#1877F2] transition-all overflow-hidden group">
                      {settings.referenceImage ? (
                        <img src={settings.referenceImage} className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-white text-[10px] font-bold uppercase group-hover:text-[#1877F2]">+ Thêm ảnh mẫu style</span>
                      )}
                    </FileDropzone>
                    <input type="file" hidden ref={refFileRef} accept="image/*" onChange={e => onImageUpload(e, 'reference')} />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleConceptAnalysis}
                className="w-full py-4 bg-[#1877F2] text-white font-bold rounded-xl uppercase text-xs shadow-[0_0_20px_rgba(24,119,242,0.3)] hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles size={16} /> Phân tích & Đề xuất Ý tưởng Toàn diện
              </button>
            </div>
          )}

          {/* BƯỚC 2: PHONG CÁCH & ĐẠO CỤ (GỘP SUY LUẬN & CHỈNH SỬA TRỰC TIẾP) */}
          {conceptStep === 2 && (
            <div className="space-y-6">
              {/* 1. LỰA CHỌN PHONG CÁCH */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles size={14} className="text-[#1877F2]" /> 1. Lựa chọn Phong cách phối cảnh Lifestyle ({suggestions.concepts.length} gợi ý)
                  </label>
                  <span className="text-[10px] text-gray-400">Chọn thẻ để tự động nạp bối cảnh & đạo cụ tương ứng</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                  {suggestions.concepts.map((c, idx) => {
                    const isSelected = settings.concept === c.prompt;
                    const propCount = c.props?.length || 0;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectConcept(c)}
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
                              {c.title || `Phong cách ${idx + 1}`}
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
                            <span>✨ Kèm {propCount} đạo cụ chọn lọc</span>
                            <span className="text-gray-400 font-normal">Nhấn để xem</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. KHUNG TINH CHỈNH CHI TIẾT (BỐI CẢNH + VỊ TRÍ + ĐẠO CỤ) */}
              <div className="bg-[#242526] p-4 rounded-2xl border border-[#3E4042] space-y-5">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
                  {/* Cột trái: Mô tả bối cảnh & Vị trí đặt */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[10px] font-bold text-white uppercase">2. Bối cảnh & Ánh sáng (Chỉnh sửa trực tiếp)</label>
                        <span className="text-[9px] text-gray-400">Có thể gõ thêm chi tiết</span>
                      </div>
                      <textarea
                        rows={4}
                        placeholder="Mô tả bối cảnh, ánh sáng, góc chụp..."
                        className="w-full bg-[#18191A] border border-[#3E4042] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#1877F2] resize-none custom-scrollbar leading-relaxed"
                        value={settings.concept}
                        onChange={e => setSettings({ ...settings, concept: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-white uppercase mb-1.5">3. Vị trí & Tỷ lệ sản phẩm trong khung hình</label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Đặt trên mặt bàn đá trắng lệch 1/3 bên trái, ánh nắng xiên 45 độ..."
                        className="w-full bg-[#18191A] border border-[#3E4042] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#1877F2]"
                        value={settings.placement}
                        onChange={e => setSettings({ ...settings, placement: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Cột phải: Đạo cụ đi kèm tương ứng */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-[10px] font-bold text-white uppercase block">
                          4. Đạo cụ đi kèm phong cách này
                        </label>
                        <span className="text-[9px] text-gray-400">
                          Đã chọn <strong className="text-[#1877F2]">{settings.props.length}</strong> đạo cụ
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
                          onClick={handleMorePropSuggestion}
                          className="px-2 py-1 bg-[#1877F2]/20 hover:bg-[#1877F2]/30 text-[#1877F2] rounded text-[9px] font-semibold transition-all flex items-center gap-1"
                          title="Tìm thêm đạo cụ mới từ AI"
                        >
                          <Wand2 size={11} /> Thêm gợi ý
                        </button>
                      </div>
                    </div>

                    {/* Chips đạo cụ */}
                    <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto custom-scrollbar p-2 bg-[#18191A] rounded-xl border border-[#3E4042]">
                      {suggestions.props.length === 0 ? (
                        <div className="text-[10px] text-gray-400 py-3 text-center w-full italic">
                          Chưa có gợi ý đạo cụ. Vui lòng chọn một phong cách phía trên.
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
                        placeholder="Tự nhập thêm đạo cụ khác..."
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
                  onClick={() => setConceptStep(1)}
                  className="flex-1 py-4 border border-[#3E4042] text-white rounded-xl uppercase text-xs font-bold hover:bg-[#242526] flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={14} /> Quay lại Bước 1
                </button>
                <button
                  type="button"
                  onClick={() => setConceptStep(3)}
                  className="flex-[2] py-4 bg-[#1877F2] text-white font-bold rounded-xl uppercase text-xs shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
                >
                  Tiếp tục: Cấu hình ảnh & Vị trí để trống <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* BƯỚC 3: CẤU HÌNH ẢNH & VỊ TRÍ ĐỂ TRỐNG & TẠO ẢNH */}
          {conceptStep === 3 && (
            <div className="space-y-5">
              {/* Tóm tắt phong cách đã chọn */}
              <div className="bg-[#242526] rounded-xl p-4 border border-[#3E4042] flex items-center justify-between">
                <div>
                  <div className="text-[9px] font-bold text-[#1877F2] uppercase mb-0.5">Phong cách đã chọn:</div>
                  <h4 className="text-white font-bold text-sm">
                    {settings.conceptTitle || 'Phong cách Lifestyle Elmich'}
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
                  onClick={() => setConceptStep(2)}
                  className="px-3 py-1.5 border border-[#3E4042] hover:border-[#1877F2] text-xs text-gray-300 hover:text-white rounded-lg transition-all flex items-center gap-1.5 shrink-0 ml-4"
                >
                  <RotateCcw size={12} /> Đổi style / Sửa đạo cụ
                </button>
              </div>

              {/* VỊ TRÍ ĐỂ TRỐNG CHÈN TEXT/BANNER */}
              <div className="bg-[#242526] rounded-xl p-4 border border-[#3E4042] space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-white uppercase">
                    Khoảng trống chèn chữ / Banner quảng cáo (Negative Space)
                  </label>
                  <span className="text-[9px] text-gray-400">Chọn vùng trống để ghép logo, tiêu đề khuyến mãi</span>
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
              {renderCameraSettings(() => setConceptStep(2))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
