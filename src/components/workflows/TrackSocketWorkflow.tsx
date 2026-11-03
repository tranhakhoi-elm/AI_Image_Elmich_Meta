import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GenerationSettings } from '../../../types';
import { FileDropzone } from '../common/FileDropzone';
import { StepIndicator } from '../common/StepIndicator';

const LOCATIONS = ['Phòng khách hiện đại', 'Phòng ngủ ấm cúng', 'Bàn làm việc tối giản', 'Khu vực bếp tiện nghi', 'Kệ Tivi sang trọng', 'Văn phòng chuyên nghiệp'];

interface TrackSocketWorkflowProps {
  settings: GenerationSettings;
  setSettings: React.Dispatch<React.SetStateAction<GenerationSettings>>;
  trackSocketStep: number;
  setTrackSocketStep: (step: number) => void;
  onImageUpload: (filesOrEvent: React.ChangeEvent<HTMLInputElement> | FileList, type: 'track' | 'socket' | 'reference') => void;
  setAlertMessage: (msg: string | null) => void;
  // Bước 3 (camera + Tạo ảnh) dùng chung UI với STUDIO — App.tsx truyền hàm
  // render sẵn có (`renderCameraSettings`) xuống thay vì tách riêng, vì
  // STUDIO chưa được tách ra khỏi App.tsx.
  renderCameraSettings: (onBack: () => void) => React.ReactNode;
}

/** Workflow 9 — Phối cảnh Thanh ray & Ổ cắm (TRACK_SOCKET_STAGING). Tách từ App.tsx (`renderTrackSocketWorkflow`). */
export const TrackSocketWorkflow: React.FC<TrackSocketWorkflowProps> = ({
  settings,
  setSettings,
  trackSocketStep,
  setTrackSocketStep,
  onImageUpload,
  setAlertMessage,
  renderCameraSettings,
}) => {
  const trackFileRef = useRef<HTMLInputElement>(null);
  const socketFileRef = useRef<HTMLInputElement>(null);
  const refFileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-6">
      <StepIndicator current={trackSocketStep} total={3} labels={['Dữ liệu', 'Bối cảnh', 'Xuất bản']} />

      <AnimatePresence mode="wait">
        <motion.div
          key={trackSocketStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {trackSocketStep === 1 && (
            <div className="space-y-4">
              <div className="flex gap-4 mb-2">
                 <button onClick={() => setSettings({...settings, trackSocketMode: 'CREATIVE'})} className={`flex-1 p-3 rounded-xl border text-xs font-bold transition-all ${settings.trackSocketMode === 'CREATIVE' || !settings.trackSocketMode ? 'bg-blue-500 text-white border-blue-500' : 'bg-[#242526] shadow-sm text-white text-white border-[#3E4042] hover:text-white'}`}>Tự sáng tạo ảnh</button>
                 <button onClick={() => setSettings({...settings, trackSocketMode: 'REFERENCE'})} className={`flex-1 p-3 rounded-xl border text-xs font-bold transition-all ${settings.trackSocketMode === 'REFERENCE' ? 'bg-blue-500 text-white border-blue-500' : 'bg-[#242526] shadow-sm text-white text-white border-[#3E4042] hover:text-white'}`}>Tạo theo mẫu sẵn</button>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-[9px] font-bold text-white uppercase">Ảnh Thanh ray (Cố định gắn tường)</label>
                    <FileDropzone onFilesDrop={(f) => onImageUpload(f, 'track')} onClick={() => trackFileRef.current?.click()} className="h-24 w-full bg-[#242526]  border-2 border-dashed border-[#3E4042] rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden">
                      {settings.trackImage ? <img src={settings.trackImage} className="w-full h-full object-contain" /> : <span className="text-blue-400 font-bold text-[10px] uppercase">+ Tải ảnh Thanh ray</span>}
                    </FileDropzone>
                    <input type="file" hidden ref={trackFileRef} accept="image/*" onChange={e => onImageUpload(e, 'track')} />
                  </div>

                  {settings.trackSocketMode === 'REFERENCE' && (
                    <div className="space-y-2">
                      <label className="block text-[9px] font-bold text-white uppercase">Ảnh Mẫu (Reference Image)</label>
                      <FileDropzone onFilesDrop={(f) => onImageUpload(f, 'reference')} onClick={() => refFileRef.current?.click()} className="h-24 w-full bg-[#242526]  border-2 border-dashed border-[#3E4042] rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden">
                        {settings.referenceImage ? <img src={settings.referenceImage} className="w-full h-full object-contain" /> : <span className="text-blue-400 font-bold text-[10px] uppercase">+ Tải ảnh mẫu</span>}
                      </FileDropzone>
                      <input type="file" hidden ref={refFileRef} accept="image/*" onChange={e => onImageUpload(e, 'reference')} />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <input type="text" placeholder="Tên sản phẩm (VD: Thanh ray Chargee V2...)" className="col-span-2 bg-[#242526]  border border-[#3E4042] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-400" value={settings.productName} onChange={e => setSettings({...settings, productName: e.target.value})} />
                    <input type="text" placeholder="Mã sản phẩm..." className="bg-[#242526]  border border-[#3E4042] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-400" value={settings.productCode || ''} onChange={e => setSettings({...settings, productCode: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-[9px] font-bold text-white uppercase">Danh sách Ổ cắm</label>
                    <FileDropzone onFilesDrop={(f) => onImageUpload(f, 'socket')} onClick={() => socketFileRef.current?.click()} className="text-[10px] text-blue-400 font-bold uppercase hover:text-blue-300">+ Thêm Ổ cắm</FileDropzone>
                  </div>
                  <input type="file" hidden ref={socketFileRef} accept="image/*" onChange={e => onImageUpload(e, 'socket')} />

                  <div className="space-y-3">
                    {settings.sockets?.map((socket, idx) => (
                      <div key={socket.id} className="bg-[#242526]  border border-[#3E4042] rounded-xl p-3 flex gap-3 items-start">
                        <div className="w-16 h-16 bg-[#242526] shadow-sm border border-[#3E4042] rounded-lg overflow-hidden shrink-0">
                          <img src={socket.image} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-white">Loại ổ cắm {idx + 1}</span>
                            <button onClick={() => setSettings(s => ({...s, sockets: s.sockets?.filter(sk => sk.id !== socket.id)}))} className="text-red-400 text-xs hover:text-red-300">Xóa</button>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-[10px] text-white">Số lượng:</label>
                            <input type="number" min="1" value={socket.quantity} onChange={e => {
                              const newSockets = [...(settings.sockets || [])];
                              newSockets[idx].quantity = parseInt(e.target.value) || 1;
                              setSettings({...settings, sockets: newSockets});
                            }} className="w-16 bg-[#242526] shadow-sm border border-[#3E4042] border border-[#3E4042] rounded p-1 text-xs text-white outline-none" />
                          </div>
                          <input type="text" placeholder="Ghi chú thiết bị cắm vào (VD: Tivi, Đèn bàn...)" value={socket.applianceNote} onChange={e => {
                            const newSockets = [...(settings.sockets || [])];
                            newSockets[idx].applianceNote = e.target.value;
                            setSettings({...settings, sockets: newSockets});
                          }} className="w-full bg-[#242526] shadow-sm border border-[#3E4042] border border-[#3E4042] rounded p-2 text-xs text-white outline-none focus:border-blue-400" />
                        </div>
                      </div>
                    ))}
                    {(!settings.sockets || settings.sockets.length === 0) && (
                      <div className="text-center p-4 border border-dashed border-[#3E4042] rounded-xl text-white text-xs">
                        Chưa có ổ cắm nào. Hãy thêm ít nhất 1 ổ cắm.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button onClick={() => {
                if(!settings.trackImage || !settings.sockets?.length) return setAlertMessage("Vui lòng tải đủ ảnh thanh ray và ít nhất 1 ổ cắm.");
                if(settings.trackSocketMode === 'REFERENCE' && !settings.referenceImage) return setAlertMessage("Vui lòng tải ảnh mẫu.");
                if(settings.trackSocketMode === 'REFERENCE') setTrackSocketStep(3);
                else setTrackSocketStep(2);
              }} className="w-full py-4 bg-blue-500 text-white font-bold rounded-xl uppercase text-xs shadow-lg hover:brightness-110 transition-all">
                Tiếp tục
              </button>
            </div>
          )}

          {trackSocketStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                <div className="space-y-2">
                  <label className="block text-[9px] font-bold text-white uppercase">Chọn bối cảnh ứng dụng</label>
                  <div className="grid grid-cols-2 gap-2">
                    {LOCATIONS.map(loc => (
                      <button key={loc} onClick={() => setSettings({...settings, location: loc})} className={`p-3 rounded-xl border text-[10px] transition-all ${settings.location === loc ? 'bg-blue-400 text-white border-blue-400' : 'bg-[#242526]  border-[#3E4042] text-white hover:text-white'}`}>{loc}</button>
                    ))}
                  </div>
                </div>
                <textarea placeholder="Mô tả thêm về bối cảnh (Tùy chọn)..." className="w-full bg-[#242526]  border border-[#3E4042] rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-blue-400 resize-none h-20" value={settings.concept} onChange={e => setSettings({...settings, concept: e.target.value})} />
              </div>

              <div className="flex gap-2">
                <button onClick={() => setTrackSocketStep(1)} className="flex-1 py-4 border border-[#3E4042] text-white rounded-xl uppercase text-[10px] font-bold">Quay lại</button>
                <button onClick={() => { if(!settings.location) return setAlertMessage("Vui lòng chọn bối cảnh."); setTrackSocketStep(3); }} className="flex-[2] bg-blue-500 text-white font-bold rounded-xl uppercase text-xs">Tiếp tục</button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {trackSocketStep === 3 && renderCameraSettings(() => setTrackSocketStep(settings.trackSocketMode === 'REFERENCE' ? 1 : 2))}
    </div>
  );
};
