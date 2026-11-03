import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Wand2 } from 'lucide-react';
import { AspectRatio, GenerationSettings } from '../../../types';
import { analyzeProductMaterials } from '../../../services/geminiService';
import { FileDropzone } from '../common/FileDropzone';
import { ModelSelection } from '../common/ModelSelection';
import { StepIndicator } from '../common/StepIndicator';

interface Render3DToPhotoWorkflowProps {
  settings: GenerationSettings;
  setSettings: React.Dispatch<React.SetStateAction<GenerationSettings>>;
  render3DStep: number;
  setRender3DStep: (step: number) => void;
  onImageUpload: (filesOrEvent: React.ChangeEvent<HTMLInputElement> | FileList, type: 'reference') => void;
  isAnalyzingMaterial: boolean;
  setIsAnalyzingMaterial: (val: boolean) => void;
  setAlertMessage: (msg: string | null) => void;
  startGeneration: () => void;
}

/** Workflow 2 — 3D Render sang Ảnh Thật (3D_TO_REAL_WHITE_BG). Tách từ App.tsx (`render3DRenderToPhotoWorkflow`). */
export const Render3DToPhotoWorkflow: React.FC<Render3DToPhotoWorkflowProps> = ({
  settings,
  setSettings,
  render3DStep,
  setRender3DStep,
  onImageUpload,
  isAnalyzingMaterial,
  setIsAnalyzingMaterial,
  setAlertMessage,
  startGeneration,
}) => {
  const refFileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-6">
      <StepIndicator current={render3DStep} total={2} labels={['Dữ liệu & Chất liệu', 'Kích thước & Tạo ảnh']} />

      <AnimatePresence mode="wait">
        <motion.div
          key={render3DStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {render3DStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-bold text-white uppercase mb-2">Tên Sản Phẩm (Bắt buộc)</label>
                    <input type="text" placeholder="Ví dụ: Nồi inox 304, Sofa da..." className="w-full bg-[#242526] border border-[#3E4042] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#1877F2] transition-colors" value={settings.productName} onChange={e => setSettings({...settings, productName: e.target.value})} />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-white uppercase mb-2">Mô tả đặc tính vật liệu (Quan trọng để khử CGI)</label>
                    <textarea
                      rows={3}
                      placeholder="Ví dụ: Inox xước hairline mờ, tay cầm nhựa nhám, nắp kính cường lực..."
                      className="w-full bg-[#242526] border border-[#3E4042] rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-[#1877F2] resize-none transition-all placeholder:text-gray-500"
                      value={settings.whiteBGMaterialsDescription || ''}
                      onChange={e => setSettings({...settings, whiteBGMaterialsDescription: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-bold text-white uppercase mb-2">Ảnh 3D Render gốc</label>
                    <FileDropzone onFilesDrop={(f) => onImageUpload(f, 'reference')} onClick={() => refFileRef.current?.click()} className="h-48 bg-[#242526] border-2 border-dashed border-[#3E4042] rounded-xl flex items-center justify-center cursor-pointer overflow-hidden group relative hover:border-[#1877F2] transition-all">
                       {settings.referenceImage ? (
                         <>
                           <img src={settings.referenceImage} className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                           <div className="absolute inset-0 bg-[#242526] shadow-sm opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-xs font-bold">Thay ảnh</div>
                         </>
                       ) : <span className="text-white text-xs font-bold uppercase group-hover:text-[#1877F2]">+ Tải ảnh 3D gốc</span>}
                    </FileDropzone>
                    <input type="file" hidden ref={refFileRef} accept="image/*" onChange={e => onImageUpload(e, 'reference')} />
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={!settings.referenceImage || isAnalyzingMaterial}
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

              <button
                type="button"
                disabled={!settings.referenceImage || !settings.productName}
                onClick={() => setRender3DStep(2)}
                className="w-full py-4 bg-[#1877F2] text-white font-bold rounded-xl uppercase text-xs disabled:opacity-50 hover:brightness-110 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]"
              >
                Tiếp tục
              </button>
            </div>
          )}

          {render3DStep === 2 && (
            <div className="space-y-4">
              <div>
                 <label className="block text-[9px] font-bold text-white uppercase mb-2">Tỷ lệ khung hình</label>
                 <select className="w-full bg-[#242526] border border-[#3E4042] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#1877F2]" value={settings.aspectRatio} onChange={e => setSettings({...settings, aspectRatio: e.target.value as AspectRatio})}>
                    <option value="1:1" className="bg-[#242526]">1:1 Vuông</option>
                    <option value="4:3" className="bg-[#242526]">4:3 Catalog</option>
                    <option value="3:4" className="bg-[#242526]">3:4 Portrait</option>
                    <option value="16:9" className="bg-[#242526]">16:9 HD</option>
                    <option value="9:16" className="bg-[#242526]">9:16</option>
                 </select>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-white uppercase mb-2">Các chỉnh sửa ưu tiên (Tùy chọn)</label>
                <textarea
                  placeholder="Ví dụ: Tăng thêm độ xước cho inox, làm ánh sáng gắt hơn..."
                  className="w-full bg-[#242526] border border-[#3E4042] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#1877F2] transition-colors resize-none h-20"
                  value={settings.whiteBGPriorityAdjustments || ''}
                  onChange={e => setSettings({...settings, whiteBGPriorityAdjustments: e.target.value})}
                />
              </div>

              <ModelSelection imageSize={settings.imageSize} onChange={(size) => setSettings({ ...settings, imageSize: size })} imageModel={settings.imageModel} onModelChange={(model) => setSettings({ ...settings, imageModel: model })} />

              <div className="flex gap-2 mb-4">
                <button onClick={() => setRender3DStep(1)} className="flex-1 py-4 border border-[#3E4042] text-white rounded-xl text-[10px] font-bold hover:bg-[#242526] ">Quay lại</button>
                <button onClick={() => startGeneration()} className="flex-[2] py-4 bg-[#1877F2] text-white font-bold rounded-xl uppercase text-xs shadow-lg shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all">Tạo ảnh</button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
