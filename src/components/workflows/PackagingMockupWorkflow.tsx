import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Box, 
  Sparkles, 
  RefreshCw, 
  Layers, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  Eye, 
  Sliders, 
  Package,
  Check,
  Split
} from 'lucide-react';
import { 
  GenerationSettings, 
  PackagingFaces, 
  PackagingHandleType, 
  PackagingMockupLayout, 
  PackagingPaperSubstrate 
} from '../../../types';
import { FileDropzone } from '../common/FileDropzone';
import { ModelSelection } from '../common/ModelSelection';
import { StepIndicator } from '../common/StepIndicator';
import { PackagingFaceSelector } from './PackagingFaceSelector';

interface PackagingMockupWorkflowProps {
  settings: GenerationSettings;
  setSettings: React.Dispatch<React.SetStateAction<GenerationSettings>>;
  packagingStep: number;
  setPackagingStep: (step: number) => void;
  pendingPackagingFace: React.MutableRefObject<keyof PackagingFaces | "flat">;
  onImageUpload: (filesOrEvent: React.ChangeEvent<HTMLInputElement> | FileList, type: 'packaging') => void;
  startGeneration: (overrideSettings?: Partial<GenerationSettings>) => void;
}

export const PackagingMockupWorkflow: React.FC<PackagingMockupWorkflowProps> = ({
  settings,
  setSettings,
  packagingStep,
  setPackagingStep,
  pendingPackagingFace,
  onImageUpload,
  startGeneration,
}) => {
  const packagingFileRef = useRef<HTMLInputElement>(null);

  // Defaults
  const currentHandle: PackagingHandleType = settings.packagingHandleType || 'PLASTIC_CLEAR';
  const currentLayout: PackagingMockupLayout = settings.packagingMockupLayout || 'SEPARATE_VIEWS';
  const currentSubstrate: PackagingPaperSubstrate = settings.packagingPaperSubstrate || 'IVORY_DUPLEX_COATED';

  const handleStartRender = () => {
    const layout = settings.packagingMockupLayout || 'SEPARATE_VIEWS';
    if (layout === 'SEPARATE_VIEWS') {
      // Tự động tạo 2 ảnh: Ảnh 1 là Mặt trước, Ảnh 2 là Mặt sau
      startGeneration({
        numImages: 2,
        packagingMockupLayout: 'SEPARATE_VIEWS'
      });
    } else {
      // 1 ảnh duy nhất (Dual box hoặc Front only hoặc Back only)
      startGeneration({
        numImages: 1,
        packagingMockupLayout: layout
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 via-[#242526] to-[#1877F2]/10 border border-[#3E4042]/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shadow-lg">
            <Box size={22} />
          </div>
          <div>
            <h3 className="text-white text-sm font-bold flex items-center gap-2">
              Mockup Bao Bì 3D Chuẩn Việt Nam
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Nền Trắng Studio #FFFFFF
              </span>
            </h3>
            <p className="text-gray-400 text-xs mt-0.5">
              Tạo mockup 3D phối cảnh Mặt Trước & Mặt Sau chuẩn xác từ file bế 2D phẳng, trang bị quai nhựa trong suốt.
            </p>
          </div>
        </div>
      </div>

      <StepIndicator 
        current={packagingStep} 
        total={3} 
        labels={['1. Kéo chọn 5 mặt bế', '2. Quai nhựa & Chất liệu', '3. Góc nhìn & Xuất bản']} 
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={packagingStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* ======================= BƯỚC 1: FILE BẾ & ĐỊNH VỊ 5 MẶT ======================= */}
          {packagingStep === 1 && (
            <div className="space-y-5">
              {!settings.packagingFaces.flat ? (
                /* Chưa có file: Dropzone tải file */
                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
                    <Layers size={14} className="text-[#1877F2]" />
                    Tải lên bản vẽ thiết kế bế 2D (Flat Dieline Layout)
                  </label>

                  <FileDropzone 
                    onFilesDrop={(f) => { 
                      pendingPackagingFace.current = 'flat'; 
                      onImageUpload(f, 'packaging'); 
                    }} 
                    onClick={() => { 
                      pendingPackagingFace.current = 'flat'; 
                      packagingFileRef.current?.click(); 
                    }} 
                    className="h-64 bg-[#242526] border-2 border-dashed border-[#3E4042] rounded-2xl flex flex-col items-center justify-center cursor-pointer overflow-hidden group hover:border-[#1877F2] transition-all p-6 text-center"
                  >
                    <div className="space-y-2">
                      <div className="w-14 h-14 mx-auto rounded-2xl bg-[#18191A] border border-[#3E4042] flex items-center justify-center text-gray-400 group-hover:text-[#1877F2] group-hover:border-[#1877F2] transition-colors shadow-lg">
                        <Package size={28} />
                      </div>
                      <div className="text-xs font-bold text-gray-200">
                        Kéo thả file thiết kế bế bao bì hoặc click để tải lên
                      </div>
                      <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
                        Hỗ trợ file ảnh trải phẳng toàn bộ các mặt hộp (Mặt trước, Mặt sau, Hông trái, Hông phải, Nắp trên và tai dán).
                      </p>
                    </div>
                  </FileDropzone>
                  <input type="file" accept="image/*" hidden ref={packagingFileRef} onChange={e => onImageUpload(e, 'packaging')} />
                </div>
              ) : (
                /* Đã có file: Trình định vị 5 mặt tương tác trực tiếp */
                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-2 border-b border-[#3E4042]">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      <span className="text-xs font-bold text-white">
                        Định vị 5 mặt theo tỷ lệ kích thước hộp (mm)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        pendingPackagingFace.current = 'flat';
                        packagingFileRef.current?.click();
                      }}
                      className="text-[11px] text-[#1877F2] hover:text-blue-400 font-bold transition-colors flex items-center gap-1.5"
                    >
                      <RefreshCw size={12} /> Đổi file bế khác
                    </button>
                    <input type="file" accept="image/*" hidden ref={packagingFileRef} onChange={e => onImageUpload(e, 'packaging')} />
                  </div>

                  {/* Component chọn vùng 5 mặt tương tác */}
                  <PackagingFaceSelector
                    dielineUrl={settings.packagingFaces.flat}
                    dimensions={settings.dimensions}
                    onDimensionsChange={(dims) => setSettings(prev => ({ ...prev, dimensions: dims }))}
                    regions={settings.packagingFaceRegions || {}}
                    onRegionsChange={(regs) => setSettings(prev => ({ ...prev, packagingFaceRegions: regs }))}
                    faces={settings.packagingFaces}
                    onFacesChange={(fcs) => setSettings(prev => ({ ...prev, packagingFaces: fcs }))}
                  />
                </div>
              )}

              {/* Thông tin sản phẩm nhanh */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Tên sản phẩm trên bao bì</label>
                  <input 
                    type="text" 
                    placeholder="VD: Ấm siêu tốc Elmich KEE-1776..." 
                    className="w-full bg-[#242526] border border-[#3E4042] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#1877F2] transition-colors" 
                    value={settings.productName} 
                    onChange={e => setSettings({ ...settings, productName: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Mã sản phẩm / SKU</label>
                  <input 
                    type="text" 
                    placeholder="VD: EL-8899..." 
                    className="w-full bg-[#242526] border border-[#3E4042] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#1877F2] transition-colors" 
                    value={settings.productCode || ''} 
                    onChange={e => setSettings({ ...settings, productCode: e.target.value })} 
                  />
                </div>
              </div>

              {/* Nút tiếp tục */}
              <button 
                onClick={() => setPackagingStep(2)} 
                disabled={!settings.packagingFaces.flat}
                className="w-full py-3.5 bg-[#1877F2] hover:bg-blue-600 disabled:opacity-50 text-white font-bold rounded-xl uppercase text-xs transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                Tiếp tục sang bước 2: Chọn quai nhựa & chất liệu
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* ======================= BƯỚC 2: QUAI NHỰA & CHẤT LIỆU ======================= */}
          {packagingStep === 2 && (
            <div className="space-y-6">
              {/* Tùy chọn Quai Xách (Đặc trưng Việt Nam) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck size={14} className="text-emerald-400" />
                    Quai xách bao bì (Chuẩn gia dụng Việt Nam)
                  </label>
                  <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    Đặc trưng Elmich VN
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      id: 'PLASTIC_CLEAR' as PackagingHandleType,
                      title: 'Quai nhựa trong suốt (Khuyên dùng)',
                      desc: 'Quai xách dẻo trong mờ bán nguyệt, 2 ngàm gài nắp trên chuẩn hộp Elmich VN',
                      badge: 'Phổ biến nhất',
                      accent: 'border-emerald-500/60 bg-emerald-500/5'
                    },
                    {
                      id: 'PLASTIC_OPAQUE' as PackagingHandleType,
                      title: 'Quai nhựa trắng đục / màu',
                      desc: 'Nhựa dẻo màu trắng đục hoặc màu thương hiệu Elmich chắc chắn',
                      badge: 'Gia dụng lớn',
                      accent: 'border-blue-500/60 bg-blue-500/5'
                    },
                    {
                      id: 'ROPE_RIBBON' as PackagingHandleType,
                      title: 'Quai dây dù / vải canvas',
                      desc: 'Dây vải mềm thắt nút qua lỗ đục kim tuyến nắp hộp quà cao cấp',
                      badge: 'Hộp quà',
                      accent: 'border-amber-500/60 bg-amber-500/5'
                    },
                    {
                      id: 'NONE' as PackagingHandleType,
                      title: 'Không quai (Nắp gập cài phẳng)',
                      desc: 'Hộp giấy tiêu chuẩn không gắn quai xách, nắp gấp phẳng vuông vức',
                      badge: 'Hộp tiêu chuẩn',
                      accent: 'border-gray-500/60 bg-gray-500/5'
                    },
                  ].map(item => {
                    const isSelected = currentHandle === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSettings({ ...settings, packagingHandleType: item.id })}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between relative ${
                          isSelected 
                            ? 'border-[#1877F2] bg-[#1877F2]/10 shadow-md ring-1 ring-[#1877F2]' 
                            : 'border-[#3E4042] bg-[#242526] hover:border-[#52555a]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            {item.title}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold bg-[#18191A] text-gray-400 border border-[#3E4042]">
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
                          {item.desc}
                        </p>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#1877F2] text-white flex items-center justify-center">
                            <Check size={10} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tùy chọn Chất liệu Giấy & Bề mặt */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
                  <Package size={14} className="text-amber-400" />
                  Chất liệu giấy & Bề mặt in ấn
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'IVORY_DUPLEX_COATED' as PackagingPaperSubstrate,
                      title: 'Ivory / Duplex bồi carton',
                      desc: 'Mặt ngoài phủ bóng/mờ mịn màng, sóng E chịu lực, màu sắc in sống động',
                      tag: 'Gia dụng cao cấp'
                    },
                    {
                      id: 'KRAFT_CORRUGATED' as PackagingPaperSubstrate,
                      title: 'Carton Kraft sóng nâu',
                      desc: 'Bìa carton xi măng nhám sần, mực đen / xám phong cách eco',
                      tag: 'Thùng carton'
                    },
                    {
                      id: 'MATTE_ART_PAPER' as PackagingPaperSubstrate,
                      title: 'Giấy Mỹ thuật Matte',
                      desc: 'Phủ mờ mịn như nhung, chống lóa sáng, viền nếp gập sắc nét tinh xảo',
                      tag: 'Hộp quà cao cấp'
                    }
                  ].map(mat => {
                    const isSelected = currentSubstrate === mat.id;
                    return (
                      <div
                        key={mat.id}
                        onClick={() => setSettings({ ...settings, packagingPaperSubstrate: mat.id })}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected 
                            ? 'border-amber-400 bg-amber-400/10 ring-1 ring-amber-400' 
                            : 'border-[#3E4042] bg-[#242526] hover:border-[#52555a]'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-white mb-1">{mat.title}</div>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#18191A] text-amber-300 border border-amber-500/20 font-medium">
                            {mat.tag}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2">
                          {mat.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Điều hướng */}
              <div className="flex gap-3">
                <button 
                  onClick={() => setPackagingStep(1)} 
                  className="flex-1 py-3.5 border border-[#3E4042] hover:bg-[#242526] text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft size={14} /> Quay lại
                </button>
                <button 
                  onClick={() => setPackagingStep(3)} 
                  className="flex-[2] py-3.5 bg-[#1877F2] hover:bg-blue-600 text-white font-bold rounded-xl uppercase text-xs transition-colors flex items-center justify-center gap-2 shadow-lg"
                >
                  Tiếp tục: Cấu hình góc nhìn & Xuất bản
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* ======================= BƯỚC 3: GÓC NHÌN & XUẤT BẢN ======================= */}
          {packagingStep === 3 && (
            <div className="space-y-6">
              {/* Tùy chọn Bố cục Mockup & Góc nhìn */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
                  <Split size={14} className="text-[#1877F2]" />
                  Bố cục & Góc nhìn Mockup (Nền Trắng #FFFFFF)
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      id: 'SEPARATE_VIEWS' as PackagingMockupLayout,
                      title: 'Bộ 2 ảnh Mockup (Trước & Sau)',
                      desc: 'Xuất riêng 2 ảnh 3D phân giải cao: 1 ảnh Phối cảnh Mặt trước + 1 ảnh Phối cảnh Mặt sau.',
                      highlight: 'Khuyên dùng cho Catalog / TMĐT',
                      badge: 'Bộ 2 ảnh'
                    },
                    {
                      id: 'DUAL_FRONT_BACK' as PackagingMockupLayout,
                      title: '2 Hộp song song trong 1 ảnh',
                      desc: 'Cả 2 hộp mặt trước và mặt sau đứng cạnh nhau trên cùng 1 khung hình nền trắng duy nhất.',
                      highlight: 'Poster / Hero Banner',
                      badge: '1 ảnh đôi'
                    },
                    {
                      id: 'FRONT_ONLY' as PackagingMockupLayout,
                      title: 'Chỉ phối cảnh Mặt trước',
                      desc: '1 ảnh 3D tập trung mặt trước, mặt hông và nắp có quai nhựa trong suốt.',
                      highlight: 'Góc nhìn chính',
                      badge: '1 ảnh'
                    },
                    {
                      id: 'BACK_ONLY' as PackagingMockupLayout,
                      title: 'Chỉ phối cảnh Mặt sau',
                      desc: '1 ảnh 3D tập trung mặt sau hiển thị bảng thông số kỹ thuật, barcode và chứng chỉ.',
                      highlight: 'Chi tiết thông số',
                      badge: '1 ảnh'
                    },
                  ].map(opt => {
                    const isSelected = currentLayout === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setSettings({ ...settings, packagingMockupLayout: opt.id })}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected 
                            ? 'border-[#1877F2] bg-[#1877F2]/10 ring-1 ring-[#1877F2]' 
                            : 'border-[#3E4042] bg-[#242526] hover:border-[#52555a]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{opt.title}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold bg-[#18191A] text-[#1877F2] border border-[#1877F2]/30">
                            {opt.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
                          {opt.desc}
                        </p>
                        <div className="mt-2 text-[10px] text-emerald-400 font-medium">
                          ✦ {opt.highlight}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cấu hình kích thước & model */}
              <div className="p-4 rounded-xl bg-[#242526] border border-[#3E4042] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <Sliders size={14} className="text-gray-400" />
                    Cấu hình Studio & Model AI
                  </span>
                  <span className="text-[11px] text-gray-400">
                    Nền chuẩn: <strong className="text-white">Studio White #FFFFFF</strong>
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

              {/* Điều hướng & Nút Xuất bản */}
              <div className="flex gap-3">
                <button 
                  onClick={() => setPackagingStep(2)} 
                  className="flex-1 py-4 border border-[#3E4042] hover:bg-[#242526] text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft size={14} /> Quay lại
                </button>
                <button 
                  onClick={handleStartRender}
                  className="flex-[2] py-4 bg-gradient-to-r from-orange-500 to-[#1877F2] hover:from-orange-600 hover:to-blue-600 text-white font-bold rounded-xl uppercase text-xs transition-all flex items-center justify-center gap-2 shadow-xl hover:shadow-orange-500/20 active:scale-[0.99]"
                >
                  <Sparkles size={16} />
                  {currentLayout === 'SEPARATE_VIEWS' 
                    ? '🚀 Xuất Bộ 2 Mockup 3D (Mặt Trước & Mặt Sau)' 
                    : currentLayout === 'DUAL_FRONT_BACK'
                    ? '🚀 Xuất Mockup 2 Hộp Song Song Nền Trắng'
                    : currentLayout === 'FRONT_ONLY'
                    ? '🚀 Xuất Mockup Mặt Trước 3D Nền Trắng'
                    : '🚀 Xuất Mockup Mặt Sau 3D Nền Trắng'
                  }
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
