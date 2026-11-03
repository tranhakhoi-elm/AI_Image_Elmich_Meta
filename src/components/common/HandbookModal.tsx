import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BookOpen, Layers, CheckCircle2, Cpu, FileText, Code2, Sparkles, AlertTriangle } from 'lucide-react';

interface HandbookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HandbookModal: React.FC<HandbookModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'workflows' | 'prompts' | 'architecture'>('overview');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-[#242526] border border-[#3E4042] rounded-2xl w-full max-w-5xl h-[92vh] sm:h-[85vh] flex flex-col shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-3 sm:p-5 border-b border-[#3E4042] flex items-center justify-between bg-[#18191A] shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#1877F2]/20 border border-[#1877F2]/30 flex items-center justify-center text-[#1877F2] shrink-0">
                <BookOpen size={18} />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-lg font-bold text-white truncate">Elmich AI Design Suite — Handbook</h2>
                <p className="text-[11px] sm:text-xs text-gray-400 hidden sm:block">Tài liệu chuẩn hóa kiến trúc, hướng dẫn công cụ và nguyên tắc prompt</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-[#3A3B3C] text-gray-400 hover:text-white transition-colors shrink-0 ml-2"
            >
              <X size={20} />
            </button>
          </div>

          {/* Nav Tabs */}
          <div className="flex items-center gap-1 px-3 sm:px-4 py-2 bg-[#242526] border-b border-[#3E4042] overflow-x-auto text-xs font-bold shrink-0 custom-scrollbar">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'bg-[#1877F2] text-white' : 'text-gray-400 hover:text-white hover:bg-[#3A3B3C]'}`}
            >
              1. Tổng quan & Chi phí
            </button>
            <button
              onClick={() => setActiveTab('workflows')}
              className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'workflows' ? 'bg-[#1877F2] text-white' : 'text-gray-400 hover:text-white hover:bg-[#3A3B3C]'}`}
            >
              2. 11 Công cụ Chuyên Biệt
            </button>
            <button
              onClick={() => setActiveTab('prompts')}
              className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'prompts' ? 'bg-[#1877F2] text-white' : 'text-gray-400 hover:text-white hover:bg-[#3A3B3C]'}`}
            >
              3. Prompt Engineering & Skills
            </button>
            <button
              onClick={() => setActiveTab('architecture')}
              className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'architecture' ? 'bg-[#1877F2] text-white' : 'text-gray-400 hover:text-white hover:bg-[#3A3B3C]'}`}
            >
              4. Kiến trúc Hệ thống & API
            </button>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar text-sm text-gray-200 leading-relaxed space-y-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="bg-[#18191A] p-5 rounded-xl border border-[#3E4042]">
                  <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                    <Sparkles size={18} className="text-[#1877F2]" />
                    Sứ mệnh hệ thống Elmich AI Image Studio
                  </h3>
                  <p className="text-gray-300 text-xs sm:text-sm">
                    Bộ công cụ tích hợp giải quyết toàn diện quy trình sáng tạo hình ảnh sản phẩm Elmich: từ nghiên cứu concept lifestyle, dựng phối cảnh phòng bếp hiện đại, giả lập hiệu ứng kỹ thuật, tách phông chụp studio thương mại điện tử, đến đối chiếu và kiểm duyệt bao bì tự động với file Excel thông số kỹ thuật.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[#18191A] p-4 rounded-xl border border-[#3E4042]">
                    <div className="text-xs font-bold text-[#1877F2] uppercase mb-1">Mô hình AI Tối tân</div>
                    <div className="text-white font-bold text-base mb-2">Nano Banana 2 & Pro</div>
                    <p className="text-xs text-gray-400">Người dùng tự chọn <strong>Flash (gemini-3.1-flash-image)</strong> hoặc <strong>Pro (gemini-3-pro-image)</strong> cùng độ phân giải 1K/2K/4K trước khi tạo ảnh, tái hiện kim loại Inox 304, lớp chống dính và thủy tinh borosilicate chân thực.</p>
                  </div>

                  <div className="bg-[#18191A] p-4 rounded-xl border border-[#3E4042]">
                    <div className="text-xs font-bold text-emerald-400 uppercase mb-1">Kiểm duyệt Bao bì</div>
                    <div className="text-white font-bold text-base mb-2">Đối chiếu Excel & AI OCR</div>
                    <p className="text-xs text-gray-400">Đọc bảng thông số kỹ thuật chuẩn, quét qua từng file thiết kế (hộp màu, tem phụ, thùng carton) và báo cáo lỗi sai lệch thông tin ngay lập tức.</p>
                  </div>

                  <div className="bg-[#18191A] p-4 rounded-xl border border-[#3E4042]">
                    <div className="text-xs font-bold text-purple-400 uppercase mb-1">Dịch bao bì tự động</div>
                    <div className="text-white font-bold text-base mb-2">Chuyển đổi EN ➔ VN 1K</div>
                    <p className="text-xs text-gray-400">Giữ nguyên 100% đường bế dieline, layout và màu sắc nhận diện; chuyển ngữ toàn bộ tiếng Anh sang tiếng Việt mượt mà cho đội ngũ Content.</p>
                  </div>
                </div>

                <div className="bg-[#18191A] p-5 rounded-xl border border-[#3E4042]">
                  <h4 className="font-bold text-white text-sm mb-3">Bảng giá tạo ảnh theo model & độ phân giải (mỗi ảnh):</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#242526] text-gray-400 border-b border-[#3E4042]">
                        <tr>
                          <th className="p-2.5">Model</th>
                          <th className="p-2.5">1K</th>
                          <th className="p-2.5">2K</th>
                          <th className="p-2.5">4K</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#3E4042]">
                        <tr>
                          <td className="p-2.5 font-bold text-white">Flash — gemini-3.1-flash-image <span className="text-gray-500 font-normal">(Nano Banana 2, mặc định)</span></td>
                          <td className="p-2.5 text-emerald-400">$0.067</td>
                          <td className="p-2.5 text-emerald-400">$0.101</td>
                          <td className="p-2.5 text-emerald-400">$0.151</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-white">Pro — gemini-3-pro-image <span className="text-gray-500 font-normal">(Nano Banana Pro)</span></td>
                          <td className="p-2.5 text-amber-400">$0.134</td>
                          <td className="p-2.5 text-amber-400">$0.134</td>
                          <td className="p-2.5 text-amber-400">$0.24</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <h4 className="font-bold text-white text-sm mb-3 mt-5">Giá xử lý văn bản (phân tích ảnh, gợi ý prompt, dịch/kiểm bao bì) — theo 1 triệu token:</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#242526] text-gray-400 border-b border-[#3E4042]">
                        <tr>
                          <th className="p-2.5">Model</th>
                          <th className="p-2.5">Input</th>
                          <th className="p-2.5">Output</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#3E4042]">
                        <tr>
                          <td className="p-2.5 font-bold text-white">Flash — gemini-3.8-flash / gemini-3.1-flash-image</td>
                          <td className="p-2.5 text-emerald-400">$0.30</td>
                          <td className="p-2.5 text-emerald-400">$2.50</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-white">Pro — gemini-3.1-pro-preview / gemini-3-pro-image</td>
                          <td className="p-2.5 text-amber-400">$1.25</td>
                          <td className="p-2.5 text-amber-400">$10.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">Chi phí mỗi ảnh = giá tạo ảnh (theo model & độ phân giải người dùng chọn) + phí phân tích văn bản đi kèm (thường chỉ $0.001-0.01 do prompt ngắn). Toàn bộ chi phí được ghi nhật ký tự động vào Google Sheets dùng chung cho cả team.</p>
                </div>
              </div>
            )}

            {activeTab === 'workflows' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white">Chi tiết 11 Công cụ trên màn hình chính</h3>
                <p className="text-xs text-gray-500 -mt-2">Thứ tự đúng như lưới icon ở màn hình chính sau khi mở khóa.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-[#18191A] rounded-xl border border-[#3E4042]">
                    <div className="text-xs font-bold text-[#1877F2]">1. Ảnh nền trắng (WHITE_BG_RETOUCH)</div>
                    <p className="text-xs text-gray-400 mt-1">Tách nền trắng tuyệt đối (#FFFFFF), tái tạo ánh sáng rim-light trên mép kính, xử lý vân xước Inox 304 chuẩn catalogue sàn TMĐT.</p>
                  </div>

                  <div className="p-3 bg-[#18191A] rounded-xl border border-[#3E4042]">
                    <div className="text-xs font-bold text-[#1877F2]">2. Ảnh studio nền trơn (STUDIO)</div>
                    <p className="text-xs text-gray-400 mt-1">Tạo concept chụp studio nghệ thuật cao cấp với bục podium, hình khối hình học tối giản, ánh sáng tương phản nghệ thuật.</p>
                  </div>

                  <div className="p-3 bg-[#18191A] rounded-xl border border-[#3E4042]">
                    <div className="text-xs font-bold text-[#1877F2]">3. Ảnh phối cảnh (CONCEPT)</div>
                    <p className="text-xs text-gray-400 mt-1">Gợi ý 5 ý tưởng bối cảnh sinh động (bếp gia đình ấm cúng, bàn ăn sáng, phòng khách hiện đại), điều chỉnh tiêu cự ống kính (24mm - 100mm) và đạo cụ hài hòa.</p>
                  </div>

                  <div className="p-3 bg-[#18191A] rounded-xl border border-[#3E4042]">
                    <div className="text-xs font-bold text-[#1877F2]">4. Làm màu sản phẩm (COLOR_CHANGE)</div>
                    <p className="text-xs text-gray-400 mt-1">Thay đổi màu sắc các bộ phận (nắp, tay cầm, thân nồi) theo mã Pantone chuẩn hoặc ảnh mẫu màu mà vẫn giữ bóng kim loại.</p>
                  </div>

                  <div className="p-3 bg-[#18191A] rounded-xl border border-[#3E4042]">
                    <div className="text-xs font-bold text-[#1877F2]">5. Tạo QR & Barcode (BARCODE_QR_GENERATOR)</div>
                    <p className="text-xs text-gray-400 mt-1">Tạo mã vạch Code 128, EAN-13 (tính check-digit tự động) và mã QR Elmich xuất SVG vector độ sắc nét tuyệt đối để in ấn bao bì.</p>
                  </div>

                  <div className="p-3 bg-[#18191A] rounded-xl border border-[#3E4042]">
                    <div className="text-xs font-bold text-[#1877F2]">6. Trợ lý Tracing (TRACING_ASSISTANT)</div>
                    <p className="text-xs text-gray-400 mt-1">Hỗ trợ vẽ nét outline vector hóa sản phẩm và hướng dẫn thao tác chi tiết.</p>
                  </div>

                  <div className="p-3 bg-[#18191A] rounded-xl border border-[#3E4042]">
                    <div className="text-xs font-bold text-[#1877F2]">7. Ảnh 3D - Ảnh chụp (3D_TO_REAL_WHITE_BG)</div>
                    <p className="text-xs text-gray-400 mt-1">Biến file render 3D dạng khối thô thành ảnh chụp studio có chất cảm bề mặt, phản xạ quang học và bóng đổ chân thực.</p>
                  </div>

                  <div className="p-3 bg-[#18191A] rounded-xl border border-[#3E4042]">
                    <div className="text-xs font-bold text-[#1877F2]">8. Chuyển thành Line Art (LINE_ART)</div>
                    <p className="text-xs text-gray-400 mt-1">Vẽ sơ đồ cấu tạo, bóc tách linh kiện (exploded view) phục vụ sách hướng dẫn sử dụng và tài liệu đăng ký chất lượng.</p>
                  </div>

                  <div className="p-3 bg-[#18191A] rounded-xl border border-[#3E4042]">
                    <div className="text-xs font-bold text-[#1877F2]">9. Mockup bao bì (PACKAGING_MOCKUP)</div>
                    <p className="text-xs text-gray-400 mt-1">Dựng hộp 3D từ file bình bản 2D hoặc từng mặt riêng biệt (mặt trước, hông, nắp) trên phông trắng hoặc trong bối cảnh quầy kệ.</p>
                  </div>

                  <div className="p-3 bg-[#18191A] rounded-xl border border-[#3E4042]">
                    <div className="text-xs font-bold text-[#1877F2]">10. Dịch bao bì tự động (TRANSLATE_PACKAGING)</div>
                    <p className="text-xs text-gray-400 mt-1">Chuyển ngữ bao bì tiếng Anh sang tiếng Việt, giữ nguyên kết cấu bế, xuất ảnh chuẩn cho đội ngũ Content không cần phần mềm đồ họa.</p>
                  </div>

                  <div className="p-3 bg-[#18191A] rounded-xl border border-[#3E4042]">
                    <div className="text-xs font-bold text-[#1877F2]">11. Kiểm tra bao bì (PACKAGING_CHECK)</div>
                    <p className="text-xs text-gray-400 mt-1">Tải file Excel thông số chuẩn, tải nhiều ảnh/PDF thiết kế bao bì (hộp màu, tem phụ, carton), AI tự động soi lỗi và xuất file Excel đối chiếu ĐẠT/KHÔNG ĐẠT.</p>
                  </div>
                </div>

                <div className="bg-[#18191A] p-4 rounded-xl border border-[#3E4042] mt-2">
                  <div className="text-xs font-bold text-white mb-1">Trợ lý Chat AI & Lịch sử</div>
                  <p className="text-xs text-gray-400">Ngoài 11 công cụ trên, thanh hồng cuối màn hình chính mở <strong>Trợ lý Chat AI</strong> (tư vấn thiết kế bằng chữ hoặc tạo/sửa ảnh bằng prompt tự nhiên, cũng có lựa chọn Flash/Pro riêng); ô xám &ldquo;Lịch sử&rdquo; mở lại lịch sử tạo ảnh dùng chung cho cả team.</p>
                </div>
              </div>
            )}

            {activeTab === 'prompts' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white">Quy chuẩn Prompt Engineering cho Elmich</h3>
                <div className="bg-[#18191A] p-4 rounded-xl border border-[#3E4042] space-y-3 text-xs">
                  <div className="font-bold text-emerald-400 text-sm">Cấu trúc Prompt Chuẩn:</div>
                  <code className="block bg-[#242526] p-3 rounded-lg font-mono text-gray-300">
                    [Loại ảnh] + [Chủ thể Elmich chính xác] + [Chất liệu & Chi tiết bề mặt] + [Bối cảnh & Đạo cụ] + [Ánh sáng & Camera] + [Quy định bảo toàn nhận diện thương hiệu]
                  </code>
                  <ul className="list-disc list-inside space-y-1 text-gray-300">
                    <li><strong>Chất liệu kim loại:</strong> Luôn ghi rõ &ldquo;304 stainless steel with fine brushed satin texture, sharp realistic longitudinal specular highlights&rdquo;.</li>
                    <li><strong>Lớp chống dính:</strong> Ghi rõ &ldquo;matte textured black non-stick coating with subtle micro-granite sparkle&rdquo;.</li>
                    <li><strong>Thủy tinh:</strong> &ldquo;Ultra-clear borosilicate high-temperature glass with refractive edge caustics&rdquo;.</li>
                    <li><strong>Quy tắc cấm (Negative):</strong> Tuyệt đối không biến dạng quai cầm, không làm mất logo dập nổi hoặc in laser Elmich, không làm mờ vạch chia dung tích.</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'architecture' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white">Kiến trúc Toàn diện & Tích hợp Doanh nghiệp</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-[#18191A] p-4 rounded-xl border border-[#3E4042] space-y-2">
                    <div className="font-bold text-white text-sm flex items-center gap-2">
                      <Cpu size={16} className="text-[#1877F2]" />
                      Frontend & Local Engine
                    </div>
                    <p className="text-gray-400">React 19, Vite, Tailwind CSS, Motion animations.</p>
                    <p className="text-gray-400">Lưu trữ lịch sử chat và bộ sưu tập ảnh bằng <strong>LocalForage (IndexedDB)</strong> để không lo tràn dung lượng localStorage.</p>
                    <p className="text-gray-400">Tạo mã vạch và QR cục bộ với <strong>JsBarcode</strong> và <strong>qrcode-svg</strong>, giải mã QR với <strong>jsQR</strong>.</p>
                  </div>

                  <div className="bg-[#18191A] p-4 rounded-xl border border-[#3E4042] space-y-2">
                    <div className="font-bold text-white text-sm flex items-center gap-2">
                      <Code2 size={16} className="text-[#1877F2]" />
                      Backend & Corporate Sync
                    </div>
                    <p className="text-gray-400">Express server (`server.ts`) chạy cổng 3000 kết hợp Vite middleware.</p>
                    <p className="text-gray-400">Tích hợp <strong>Google Sheets API</strong> qua Service Account ghi nhật ký tạo ảnh và chi phí token (đã gỡ bỏ toàn bộ tích hợp Lark Bitable, không còn sử dụng).</p>
                  </div>

                  <div className="bg-[#18191A] p-4 rounded-xl border border-[#3E4042] space-y-2 md:col-span-2">
                    <div className="font-bold text-white text-sm flex items-center gap-2">
                      <Sparkles size={16} className="text-[#1877F2]" />
                      Lựa chọn model theo tác vụ (Flash / Pro)
                    </div>
                    <p className="text-gray-400">Trước khi tạo ảnh ở bất kỳ công cụ nào, người dùng chọn độ phân giải (1K/2K/4K) và tier model (<strong>Flash</strong> — mặc định, nhanh & rẻ; hoặc <strong>Pro</strong> — chất lượng cao hơn, tối ưu cho mockup bao bì) ngay trước khi gửi prompt. Lựa chọn này áp dụng cho cả tạo ảnh chính, chỉnh sửa ảnh (modal &ldquo;Chỉnh sửa ảnh với AI&rdquo;) và chế độ tạo ảnh trong Trợ lý Chat AI.</p>
                    <p className="text-gray-400">Các tác vụ phân tích nội bộ (gợi ý prompt, gợi ý đạo cụ, bóc tách chất liệu, trích xuất thông số bao bì) dùng <strong>gemini-3.8-flash</strong>; riêng phân tích & dịch nội dung bao bì và đối thoại trợ lý dùng <strong>gemini-3.1-pro-preview</strong> để đảm bảo độ chính xác và chất lượng cao.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[#3E4042] bg-[#18191A] flex items-center justify-between">
            <span className="text-xs text-gray-500">Tài liệu lưu hành nội bộ — Ban Truyền thông & Thiết kế Elmich Vietnam</span>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-[#1877F2] hover:bg-blue-600 text-white font-bold rounded-xl text-xs transition-colors"
            >
              Đóng Handbook
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
