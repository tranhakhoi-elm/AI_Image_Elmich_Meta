import React, { useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { AppState, AspectRatio, GenerationSettings } from '../../../types';
import { FileDropzone } from '../common/FileDropzone';
import { ModelSelection } from '../common/ModelSelection';

interface LineArtWorkflowProps {
  settings: GenerationSettings;
  setSettings: React.Dispatch<React.SetStateAction<GenerationSettings>>;
  onImageUpload: (filesOrEvent: React.ChangeEvent<HTMLInputElement> | FileList, type: 'reference') => void;
  appState: AppState;
  startGeneration: () => void;
  setAlertMessage: (msg: string | null) => void;
}

/** Workflow 10 — Bản vẽ Kỹ thuật & Bóc tách (LINE_ART). Tách từ App.tsx (`renderLineArtWorkflow`). */
export const LineArtWorkflow: React.FC<LineArtWorkflowProps> = ({
  settings,
  setSettings,
  onImageUpload,
  appState,
  startGeneration,
  setAlertMessage,
}) => {
  const refFileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
          <div className="space-y-4">
            <div>
              <label className="block text-[9px] font-bold text-white uppercase mb-2">Thông tin sản phẩm</label>
              <div className="grid grid-cols-3 gap-2">
                <input type="text" placeholder="Tên sản phẩm..." className="col-span-2 bg-[#242526]  border border-[#3E4042] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#1877F2] transition-colors" value={settings.productName} onChange={e => setSettings({ ...settings, productName: e.target.value })} />
                <input type="text" placeholder="Mã sản phẩm..." className="bg-[#242526]  border border-[#3E4042] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#1877F2] transition-colors" value={settings.productCode || ''} onChange={e => setSettings({ ...settings, productCode: e.target.value })} />
              </div>
            </div>

            <div>
               <label className="block text-[9px] font-bold text-white uppercase mb-2">Tỷ lệ</label>
               <select className="w-full bg-[#242526]  border border-[#3E4042] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#1877F2]" value={settings.aspectRatio} onChange={e => setSettings({ ...settings, aspectRatio: e.target.value as AspectRatio })}>
                  <option value="1:1" className="bg-[#242526]">1:1 Vuông</option>
                  <option value="4:3" className="bg-[#242526]">4:3 Catalog</option>
                  <option value="3:4" className="bg-[#242526]">3:4 Portrait</option>
                  <option value="16:9" className="bg-[#242526]">16:9 HD</option>
                  <option value="9:16" className="bg-[#242526]">9:16</option>
                  <option value="1:4" className="bg-[#242526]">1:4 Siêu dài</option>
                  <option value="4:1" className="bg-[#242526]">4:1 Siêu rộng</option>
               </select>
            </div>

            <ModelSelection imageSize={settings.imageSize} onChange={(size) => setSettings({ ...settings, imageSize: size })} imageModel={settings.imageModel} onModelChange={(model) => setSettings({ ...settings, imageModel: model })} />
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[9px] font-bold text-white uppercase mb-2">Ảnh sản phẩm gốc (Nền trắng)</label>
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

        <div className="flex gap-2 pt-2">
          <button disabled={appState !== AppState.READY} onClick={() => { if (!settings.referenceImage) { setAlertMessage("Vui lòng tải ảnh sản phẩm gốc (nền trắng) trước khi tạo ảnh Line Art."); } else { startGeneration(); } }} className="w-full py-4 bg-[#1877F2] text-white font-bold rounded-xl uppercase text-xs shadow-lg hover:brightness-110 transition-all disabled:opacity-50 flex justify-center items-center gap-2">
            {appState === AppState.GENERATING ? <Loader2 size={16} className="animate-spin" /> : null}
            Tạo ảnh Line Art
          </button>
        </div>
      </div>
    </div>
  );
};
