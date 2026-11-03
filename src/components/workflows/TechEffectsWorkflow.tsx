import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GenerationSettings } from '../../../types';
import { FileDropzone } from '../common/FileDropzone';
import { ModelSelection } from '../common/ModelSelection';
import { StepIndicator } from '../common/StepIndicator';

interface TechConcept {
  title: string;
  prompt: string;
}

interface TechEffectsWorkflowProps {
  settings: GenerationSettings;
  setSettings: React.Dispatch<React.SetStateAction<GenerationSettings>>;
  techEffectStep: number;
  setTechEffectStep: (step: number) => void;
  concepts: TechConcept[];
  onImageUpload: (filesOrEvent: React.ChangeEvent<HTMLInputElement> | FileList, type: 'reference') => void;
  handleSeaConceptSuggestion: () => void;
  startGeneration: () => void;
}

/** Workflow 6 — Xử lý ảnh Kỹ thuật (TECH_EFFECTS). Tách từ App.tsx (`renderTechEffectsWorkflow`). */
export const TechEffectsWorkflow: React.FC<TechEffectsWorkflowProps> = ({
  settings,
  setSettings,
  techEffectStep,
  setTechEffectStep,
  concepts,
  onImageUpload,
  handleSeaConceptSuggestion,
  startGeneration,
}) => {
  const refFileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-6">
      <StepIndicator current={techEffectStep} total={2} labels={['Chế độ', 'Xuất bản']} />

      <AnimatePresence mode="wait">
        <motion.div
          key={techEffectStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {techEffectStep === 0 && (
            <div className="space-y-4">
              <label className="block text-[10px] font-bold text-white uppercase">Chọn chế độ xử lý</label>
              <div className="flex gap-2">
                 <button onClick={() => { setSettings({...settings, techEffectType: 'REMOVE_SIGNATURE'}); setTechEffectStep(1); }} className={`flex-1 py-4 rounded-xl text-[10px] font-bold border transition-all ${settings.techEffectType === 'REMOVE_SIGNATURE' ? 'bg-[#1877F2] text-white border-[#1877F2]' : 'bg-[#242526] shadow-sm text-white border-[#3E4042] text-white hover:bg-[#3A3B3C]'}`}>Xóa chữ ký</button>
                 <button onClick={() => { setSettings({...settings, techEffectType: 'SEA_TECH_GENERATION'}); setTechEffectStep(1); }} className={`flex-1 py-4 rounded-xl text-[10px] font-bold border transition-all ${settings.techEffectType === 'SEA_TECH_GENERATION' ? 'bg-[#1877F2] text-white border-[#1877F2]' : 'bg-[#242526] shadow-sm text-white border-[#3E4042] text-white hover:bg-[#3A3B3C]'}`}>Biển đêm</button>
              </div>
            </div>
          )}

          {techEffectStep === 1 && (
            <div className="space-y-4">
              {settings.techEffectType === 'REMOVE_SIGNATURE' ? (
                <div className="space-y-4">
                   <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                     <div className="space-y-4">
                       <label className="block text-[10px] font-bold text-white uppercase">Ảnh cần xử lý</label>
                       <FileDropzone onFilesDrop={(f) => onImageUpload(f, 'reference')} onClick={() => refFileRef.current?.click()} className="h-48 bg-[#242526]  border-2 border-dashed border-[#3E4042] rounded-xl flex items-center justify-center cursor-pointer overflow-hidden group hover:border-[#1877F2] transition-all">
                         {settings.referenceImage ? <img src={settings.referenceImage} className="h-full w-full object-contain" referrerPolicy="no-referrer" /> : <span className="text-white text-xs font-bold uppercase group-hover:text-[#1877F2]">+ Tải ảnh</span>}
                       </FileDropzone>
                       <input type="file" hidden ref={refFileRef} accept="image/*" onChange={e => onImageUpload(e, 'reference')} />
                     </div>
                     <div className="space-y-4">
                       <ModelSelection imageSize={settings.imageSize} onChange={(size) => setSettings({ ...settings, imageSize: size })} imageModel={settings.imageModel} onModelChange={(model) => setSettings({ ...settings, imageModel: model })} />
                     </div>
                   </div>
                   <div className="flex gap-2">
                     <button onClick={() => setTechEffectStep(0)} className="flex-1 py-4 border border-[#3E4042] text-white rounded-xl text-[10px] font-bold hover:bg-[#242526] ">Quay lại</button>
                     <button onClick={() => startGeneration()} className="flex-[2] py-4 bg-[#1877F2] text-white font-bold rounded-xl uppercase text-xs">Tạo ảnh</button>
                   </div>
                </div>
              ) : (
                <div className="space-y-4">
                   <input type="text" placeholder="Tên SP..." className="w-full bg-[#242526]  border border-[#3E4042] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#1877F2]" value={settings.productName} onChange={e => setSettings({...settings, productName: e.target.value})} />
                   <input type="text" placeholder="Tiêu đề..." className="w-full bg-[#242526]  border border-[#3E4042] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#1877F2]" value={settings.techTitle} onChange={e => setSettings({...settings, techTitle: e.target.value})} />
                   <div className="flex gap-2">
                     <button onClick={() => setTechEffectStep(0)} className="flex-1 py-4 border border-[#3E4042] text-white rounded-xl text-[10px] font-bold hover:bg-[#242526] ">Quay lại</button>
                     <button onClick={handleSeaConceptSuggestion} className="flex-[2] py-4 bg-[#1877F2] text-white font-bold rounded-xl uppercase text-xs">Concept</button>
                   </div>
                </div>
              )}
            </div>
          )}

          {techEffectStep === 3 && (
            <div className="space-y-4">
               <label className="block text-[10px] font-bold text-white uppercase">Chọn Concept</label>
               <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                 {concepts.map((c, idx) => (
                   <button key={idx} onClick={() => setSettings({...settings, selectedTechConcept: c.prompt})} className={`w-full text-left p-3 rounded-xl border transition-all ${settings.selectedTechConcept === c.prompt ? 'bg-[#1877F2] text-white border-[#1877F2]' : 'bg-[#242526] shadow-sm text-white border-[#3E4042] text-white hover:bg-[#3A3B3C]'}`}>
                     <div className="font-bold text-[11px] mb-1">{c.title}</div>
                     <div className="text-[10px] leading-relaxed opacity-80 whitespace-pre-line">{c.prompt}</div>
                   </button>
                 ))}
               </div>
               <ModelSelection imageSize={settings.imageSize} onChange={(size) => setSettings({ ...settings, imageSize: size })} imageModel={settings.imageModel} onModelChange={(model) => setSettings({ ...settings, imageModel: model })} />
               <div className="flex gap-2">
                 <button onClick={() => setTechEffectStep(1)} className="flex-1 py-4 border border-[#3E4042] text-white rounded-xl text-[10px] font-bold hover:bg-[#242526] ">Quay lại</button>
                 <button onClick={() => startGeneration()} className="flex-[2] py-4 bg-[#1877F2] text-white font-bold rounded-xl uppercase text-xs">Tạo ảnh</button>
               </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
