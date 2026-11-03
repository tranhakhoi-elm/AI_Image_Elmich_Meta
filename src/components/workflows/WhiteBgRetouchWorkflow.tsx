import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Wand2 } from 'lucide-react';
import { AppState, AspectRatio, GenerationSettings } from '../../../types';
import { analyzeProductMaterials } from '../../../services/geminiService';
import { FileDropzone } from '../common/FileDropzone';
import { ModelSelection } from '../common/ModelSelection';
import { StepIndicator } from '../common/StepIndicator';

const MATERIAL_OPTIONS = [
  { id: 'METAL', label: 'Kim loại (Inox, Thép, Nhôm...)' },
  { id: 'PLASTIC', label: 'Nhựa & Polymer (ABS, Silicon...)' },
  { id: 'GLASS', label: 'Thủy tinh & Trong suốt' },
  { id: 'CERAMIC', label: 'Gốm sứ & Chống dính' },
];

interface WhiteBgRetouchWorkflowProps {
  settings: GenerationSettings;
  setSettings: React.Dispatch<React.SetStateAction<GenerationSettings>>;
  whiteBgStep: number;
  setWhiteBgStep: (step: number) => void;
  onImageUpload: (filesOrEvent: React.ChangeEvent<HTMLInputElement> | FileList, type: 'reference') => void;
  appState: AppState;
  isAnalyzingMaterial: boolean;
  setIsAnalyzingMaterial: (val: boolean) => void;
  setAlertMessage: (msg: string | null) => void;
  startGeneration: () => void;
}

/** Workflow 7 — Làm ảnh nền trắng (WHITE_BG_RETOUCH). Tách từ App.tsx (`renderWhiteBgRetouchWorkflow`). */
export const WhiteBgRetouchWorkflow: React.FC<WhiteBgRetouchWorkflowProps> = ({
  settings,
  setSettings,
  whiteBgStep,
  setWhiteBgStep,
  onImageUpload,
  appState,
  isAnalyzingMaterial,
  setIsAnalyzingMaterial,
  setAlertMessage,
  startGeneration,
}) => {
  const refFileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-6">
      <StepIndicator current={whiteBgStep} total={2} labels={['Dữ liệu', 'Thiết lập kích thước & tạo ảnh']} />

      <AnimatePresence mode="wait">
        <motion.div
          key={whiteBgStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {whiteBgStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-bold text-white uppercase mb-2">Thông tin sản phẩm</label>
                    <div className="grid grid-cols-3 gap-2">
                      <input type="text" placeholder="Tên sản phẩm..." className="col-span-2 bg-[#242526]  border border-[#3E4042] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#1877F2] transition-colors" value={settings.productName} onChange={e => setSettings({...settings, productName: e.target.value})} />
                      <input type="text" placeholder="Mã sản phẩm..." className="bg-[#242526]  border border-[#3E4042] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#1877F2] transition-colors" value={settings.productCode || ''} onChange={e => setSettings({...settings, productCode: e.target.value})} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-white uppercase mb-2">Các chất liệu có trong sản phẩm (Tích chọn nhiều)</label>
                    <div className="grid grid-cols-2 gap-2 bg-[#242526]/50 border border-white/5 p-3 rounded-xl">
                      {MATERIAL_OPTIONS.map(item => {
                        const selectedList = settings.whiteBGSelectedCategories || [];
                        const checked = selectedList.includes(item.id);
                        return (
                          <label key={item.id} className="flex items-center gap-2 px-3 py-2 bg-[#242526] hover:bg-[#3A3B3C] border border-[#3E4042] rounded-lg cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                const nextList = checked
                                  ? selectedList.filter(c => c !== item.id)
                                  : [...selectedList, item.id];
                                setSettings({...settings, whiteBGSelectedCategories: nextList});
                              }}
                              className="accent-[#1877F2] rounded w-4 h-4 cursor-pointer"
                            />
                            <span className="text-[10px] text-white select-none">{item.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-white uppercase mb-2">Mô tả vị trí & đặc tính các vật liệu</label>
                    <textarea
                      rows={3}
                      placeholder="Ví dụ: Thân ấm làm từ thép không gỉ sáng bóng, quai cầm và nắp dùng nhựa ABS đen mờ, chân dán tem kim loại..."
                      className="w-full bg-[#242526] border border-[#3E4042] rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-[#1877F2] resize-none transition-all placeholder:text-gray-500"
                      value={settings.whiteBGMaterialsDescription || ''}
                      onChange={e => setSettings({...settings, whiteBGMaterialsDescription: e.target.value})}
                    />
                    <p className="text-[8px] text-gray-400 mt-1">Thông tin bổ sung này giúp AI nhận diện chuẩn hóa bối cảnh ánh sáng phản xạ thích hợp cực kỳ thông minh.</p>
                  </div>

                  <button
                    type="button"
                    disabled={!settings.referenceImage || appState !== AppState.READY || isAnalyzingMaterial}
                    onClick={async (e) => {
                      e.preventDefault();
                      if (!settings.referenceImage) return;
                      setIsAnalyzingMaterial(true);
                      try {
                        const result = await analyzeProductMaterials(settings.referenceImage);
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
                    <label className="block text-[9px] font-bold text-white uppercase mb-2">Ảnh sản phẩm gốc</label>
                    <FileDropzone onFilesDrop={(f) => onImageUpload(f, 'reference')} onClick={() => refFileRef.current?.click()} className="h-48 bg-[#242526]  border-2 border-dashed border-[#3E4042] rounded-xl flex items-center justify-center cursor-pointer overflow-hidden group relative hover:border-[#1877F2] transition-all">
                       {settings.referenceImage ? (
                         <>
                           <img src={settings.referenceImage} className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                           <div className="absolute inset-0 bg-[#242526] shadow-sm opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-xs font-bold">Thay ảnh</div>
                         </>
                       ) : <span className="text-white text-xs font-bold uppercase group-hover:text-[#1877F2]">+ Tải ảnh SP gốc</span>}
                    </FileDropzone>
                    <input type="file" hidden ref={refFileRef} accept="image/*" onChange={e => onImageUpload(e, 'reference')} />
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={!settings.referenceImage || !settings.productName || isAnalyzingMaterial}
                onClick={() => setWhiteBgStep(2)}
                className="w-full py-4 bg-[#1877F2] text-white font-bold rounded-xl uppercase text-xs disabled:opacity-50 hover:brightness-110 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]"
              >
                Tiếp tục cài đặt kích thước
              </button>
            </div>
          )}

          {whiteBgStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                <div className="space-y-4">
                  <div>
                     <label className="block text-[9px] font-bold text-white uppercase mb-2">Tỷ lệ khung hình</label>
                     <select className="w-full bg-[#242526]  border border-[#3E4042] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#1877F2]" value={settings.aspectRatio} onChange={e => setSettings({...settings, aspectRatio: e.target.value as AspectRatio})}>
                        <option value="1:1" className="bg-[#242526]">1:1 Vuông</option>
                        <option value="4:3" className="bg-[#242526]">4:3 Catalog</option>
                        <option value="3:4" className="bg-[#242526]">3:4 Portrait</option>
                        <option value="16:9" className="bg-[#242526]">16:9 HD</option>
                        <option value="9:16" className="bg-[#242526]">9:16</option>
                        <option value="1:4" className="bg-[#242526]">1:4 Siêu dài</option>
                        <option value="4:1" className="bg-[#242526]">4:1 Siêu rộng</option>
                     </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-white uppercase mb-2">Các chỉnh sửa ưu tiên (Tùy chọn)</label>
                    <textarea
                      placeholder="Ví dụ: Làm sáng phần tay cầm inox, xử lý bề mặt nồi sáng bóng hơn..."
                      className="w-full bg-[#242526] border border-[#3E4042] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#1877F2] transition-colors resize-none h-20"
                      value={settings.whiteBGPriorityAdjustments || ''}
                      onChange={e => setSettings({...settings, whiteBGPriorityAdjustments: e.target.value})}
                    />
                  </div>
                </div>

                <ModelSelection imageSize={settings.imageSize} onChange={(size) => setSettings({ ...settings, imageSize: size })} imageModel={settings.imageModel} onModelChange={(model) => setSettings({ ...settings, imageModel: model })} />
              </div>

              <div className="flex gap-2 mb-4">
                <button onClick={() => setWhiteBgStep(1)} className="flex-1 py-4 border border-[#3E4042] text-white rounded-xl text-[10px] font-bold hover:bg-[#242526] ">Quay lại</button>
                <button onClick={() => startGeneration()} className="flex-[2] py-4 bg-[#1877F2] text-white font-bold rounded-xl uppercase text-xs shadow-lg shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all">Tạo ảnh</button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
