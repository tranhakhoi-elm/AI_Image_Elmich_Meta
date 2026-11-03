import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { 
  ArrowLeft, 
  Trash2, 
  Box, 
  Loader2, 
  Sparkles, 
  Download, 
  X, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { AppState, PackagingStandardParam } from '../../../types';
import { analyzePackagingContent, extractStandardParamsWithAI } from '../../../services/geminiService';
import { StepIndicator } from '../common/StepIndicator';

interface PackagingCheckWorkflowProps {
  onBackToMenu: () => void;
  appState: AppState;
  setAppState: (state: AppState) => void;
  setLoadingMessage: (msg: string) => void;
  setAlertMessage: (msg: string | null) => void;
}

export const PackagingCheckWorkflow: React.FC<PackagingCheckWorkflowProps> = ({
  onBackToMenu,
  appState,
  setAppState,
  setLoadingMessage,
  setAlertMessage
}) => {
  const [packagingCheckStep, setPackagingCheckStep] = useState<number>(1);
  const [packagingInputMode, setPackagingInputMode] = useState<'EXCEL' | 'MANUAL'>('EXCEL');
  const [pastedText, setPastedText] = useState<string>('');
  const [standardParams, setStandardParams] = useState<PackagingStandardParam[]>([]);
  const [packagingFiles, setPackagingFiles] = useState<{ name: string; data: string }[]>([]);
  const [packagingCheckResult, setPackagingCheckResult] = useState<any>(null);
  const productFilesRef = useRef<HTMLInputElement>(null);

  const handleExcelUpload = async (filesOrEvent: React.ChangeEvent<HTMLInputElement> | FileList) => {
    const files = 'target' in filesOrEvent ? filesOrEvent.target.files : filesOrEvent;
    const file = files?.[0];
    if (!file) return;
    if (appState !== AppState.READY) return; // tránh chọn file khác trong lúc file trước đang được AI phân tích
    setLoadingMessage("AI đang phân tích dữ liệu Excel...");
    setAppState(AppState.ANALYZING);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      
      let textData = "";
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
        jsonData.forEach(row => {
          textData += row.join(" \t ") + "\n";
        });
      });
      
      const aiParams = await extractStandardParamsWithAI(textData);
      setStandardParams(aiParams);
    } catch (err: any) {
      console.error(err);
      setAlertMessage("Lỗi khi đọc file Excel: " + err.message);
    } finally {
      setAppState(AppState.READY);
    }
    if ('target' in filesOrEvent && filesOrEvent.target) filesOrEvent.target.value = '';
  };

  const handleAnalyzePastedData = async () => {
    // Khóa lại nếu đang có 1 lần phân tích khác chạy dở (tránh gọi AI trùng
    // lặp/song song dẫn đến race condition khi kết quả trả về không theo
    // đúng thứ tự) — nút bên dưới cũng đã disable theo appState, đây là
    // lớp bảo vệ thứ 2 phòng trường hợp gọi hàm trực tiếp.
    if (appState !== AppState.READY) return;
    const text = pastedText.trim();
    if (!text) return;

    setLoadingMessage("AI đang phân tích dữ liệu văn bản...");
    setAppState(AppState.ANALYZING);
    try {
      const aiParams = await extractStandardParamsWithAI(text);
      setStandardParams(aiParams);
    } catch (err: any) {
      console.error(err);
      setAlertMessage("Lỗi phân tích: " + err.message);
    } finally {
      setAppState(AppState.READY);
    }
  };

  const addStandardParam = () => setStandardParams(prev => [...prev, { key: '', value: '' }]);
  const updateStandardParam = (index: number, field: 'key' | 'value', val: string) => {
    setStandardParams(prev => {
      const newParams = [...prev];
      newParams[index][field] = val;
      return newParams;
    });
  };
  const removeStandardParam = (index: number) => {
    setStandardParams(prev => prev.filter((_, i) => i !== index));
  };

  const exportPackagingReport = () => {
    if (!packagingCheckResult || !packagingCheckResult.params) return;

    const data: any[] = [];
    packagingCheckResult.params.forEach((res: any) => {
      const row: any = {
        'Thông số': res.key,
        'Giá trị chuẩn': res.expected || '-',
        'Khớp (Tổng thể)': res.match ? 'ĐẠT' : 'KHÔNG ĐẠT',
      };

      packagingFiles.forEach((file, fIdx) => {
        let fileResult = (res.fileResults || []).find((fr: any) => {
          if (!fr.fileName) return false;
          const cleanFr = fr.fileName.toLowerCase().trim();
          const cleanF = file.name.toLowerCase().trim();
          return cleanFr === cleanF || cleanFr.includes(cleanF) || cleanF.includes(cleanFr);
        });
        if (!fileResult && (res.fileResults || []).length === packagingFiles.length) {
          fileResult = (res.fileResults || [])[fIdx];
        }

        row[`File: ${file.name} (Thực tế)`] = fileResult ? (fileResult.actual || 'Không tìm thấy') : 'Không có dữ liệu';
        row[`File: ${file.name} (Ghi chú)`] = fileResult ? (fileResult.notes || '') : '';
        row[`File: ${file.name} (Đánh giá)`] = fileResult ? (fileResult.match ? 'ĐẠT' : 'KHÔNG ĐẠT') : '-';
      });

      data.push(row);
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "BaoCaoKiemTra");
    XLSX.writeFile(workbook, `BaoCao_KiemTraBaoBi_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const runPackagingCheck = async () => {
    if (packagingFiles.length === 0) return;
    setAppState(AppState.ANALYZING);
    setLoadingMessage("AI đang quét thiết kế và đối chiếu thông số...");
    
    try {
      const result = await analyzePackagingContent(packagingFiles, standardParams);
      
      const enrichedParams = standardParams.filter(p => p.value.trim() !== '').map(param => {
        const aiResult = (result.params || []).find((res: any) => 
          res.key && (
            res.key.toLowerCase().trim() === param.key.toLowerCase().trim() ||
            res.key.toLowerCase().trim().includes(param.key.toLowerCase().trim()) ||
            param.key.toLowerCase().trim().includes(res.key.toLowerCase().trim())
          )
        );
        
        if (aiResult) {
          return {
            ...aiResult,
            key: param.key,
            expected: param.value
          };
        } else {
          return {
            key: param.key,
            expected: param.value,
            match: false,
            fileResults: []
          };
        }
      });

      setPackagingCheckResult({
        params: enrichedParams
      });
      setPackagingCheckStep(3);
    } catch (e) {
      console.error(e);
      setAlertMessage("Lỗi trong quá trình kiểm tra. Vui lòng thử lại.");
    } finally {
      setAppState(AppState.READY);
    }
  };

  return (
    <div className="space-y-6">
      <button onClick={onBackToMenu} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-bold mb-2">
        <ArrowLeft size={16} /> Quay lại Menu
      </button>
      <StepIndicator current={packagingCheckStep} total={3} labels={['Nhập dữ liệu chuẩn', 'Tải thiết kế', 'Kết quả']} />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={packagingCheckStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {packagingCheckStep === 1 && (
            <div className="space-y-4">
              <div className="flex gap-2 p-1 bg-[#242526] rounded-xl border border-[#3E4042]">
                <button onClick={() => setPackagingInputMode('EXCEL')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${packagingInputMode === 'EXCEL' ? 'bg-[#1877F2] text-white' : 'text-gray-400 hover:text-white'}`}>Nhập từ Excel</button>
                <button onClick={() => setPackagingInputMode('MANUAL')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${packagingInputMode === 'MANUAL' ? 'bg-[#1877F2] text-white' : 'text-gray-400 hover:text-white'}`}>Nhập thủ công</button>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                <div className="space-y-4">
                  {packagingInputMode === 'EXCEL' ? (
                    <div className="bg-[#242526] border border-[#3E4042] rounded-xl p-6 text-center">
                      <div className="mb-4 text-white text-sm">Tải lên file Excel (.xlsx) chứa dữ liệu chuẩn của bao bì</div>
                      <input
                        type="file"
                        accept=".xlsx, .xls, .csv"
                        onChange={handleExcelUpload}
                        disabled={appState !== AppState.READY}
                        className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#1877F2]/10 file:text-[#1877F2] hover:file:bg-[#1877F2]/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  ) : (
                    <div className="bg-[#242526] border border-[#3E4042] rounded-xl p-4">
                      <span className="text-white text-xs font-bold block mb-2">Dán dữ liệu từ Excel (Copy các cột Tên thông số, Giá trị):</span>
                      <textarea
                        className="w-full h-24 bg-[#3A3B3C] border border-[#3E4042] rounded-lg p-2 text-white text-xs outline-none focus:border-[#1877F2] resize-none disabled:opacity-50"
                        placeholder="Dán nội dung bảng vào đây, sau đó bấm Phân tích..."
                        value={pastedText}
                        onChange={(e) => setPastedText(e.target.value)}
                        disabled={appState !== AppState.READY}
                      ></textarea>
                      <div className="flex justify-end gap-2 mt-2">
                        <button onClick={addStandardParam} className="px-3 py-1 bg-[#3A3B3C] hover:bg-[#4A4B4C] text-white rounded-lg text-xs font-bold transition-all border border-[#3E4042]">+ Thêm 1 dòng trống</button>
                        <button
                          onClick={handleAnalyzePastedData}
                          disabled={!pastedText.trim() || appState !== AppState.READY}
                          className="px-3 py-1 bg-[#1877F2] hover:brightness-110 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {appState === AppState.ANALYZING ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                          Phân tích
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {standardParams.length > 0 && (
                    <div className="bg-[#242526] border border-[#3E4042] rounded-xl overflow-hidden">
                      <div className="p-4 border-b border-[#3E4042] flex justify-between items-center">
                        <h3 className="text-white text-sm font-bold">Dữ liệu chuẩn trích xuất ({standardParams.length} thông số)</h3>
                        <button onClick={addStandardParam} className="text-xs text-[#1877F2] hover:underline font-bold">+ Thêm thông số</button>
                      </div>
                      <div className="max-h-64 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left text-xs text-white">
                          <thead className="bg-[#3A3B3C] sticky top-0">
                            <tr>
                              <th className="p-3 font-semibold">Thông số</th>
                              <th className="p-3 font-semibold">Giá trị chuẩn</th>
                              <th className="p-3 w-10"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {standardParams.map((param, index) => (
                              <tr key={index} className="border-b border-[#3E4042]">
                                <td className="p-2">
                                  <input
                                    value={param.key}
                                    onChange={(e) => updateStandardParam(index, 'key', e.target.value)}
                                    className="w-full bg-transparent border-none outline-none focus:ring-1 focus:ring-[#1877F2] rounded px-2 py-1"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    value={param.value}
                                    onChange={(e) => updateStandardParam(index, 'value', e.target.value)}
                                    className="w-full bg-transparent border-none outline-none focus:ring-1 focus:ring-[#1877F2] rounded px-2 py-1"
                                  />
                                </td>
                                <td className="p-2 text-center">
                                  <button onClick={() => removeStandardParam(index)} className="text-red-400 hover:text-red-300">
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <button
                disabled={standardParams.length === 0} 
                onClick={() => setPackagingCheckStep(2)} 
                className="w-full py-4 bg-[#1877F2] text-white font-bold rounded-xl uppercase text-xs shadow-lg disabled:opacity-50 hover:brightness-110 transition-all"
              >
                Tiếp tục tải thiết kế
              </button>
            </div>
          )}

          {packagingCheckStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                <div className="space-y-4">
                  <label className="block text-[9px] font-bold text-white uppercase mt-4">Tải lên các file thiết kế bao bì (Ảnh hoặc PDF)</label>
                  <div
                    onClick={() => productFilesRef.current?.click()}
                    className="h-32 w-full bg-[#242526] border-2 border-dashed border-[#3E4042] rounded-xl flex items-center justify-center cursor-pointer overflow-hidden relative group hover:border-[#1877F2] transition-all"
                  >
                    <span className="text-white font-bold uppercase text-[10px] group-hover:text-[#1877F2]">+ Chọn file thiết kế (Hộp màu, Tem phụ, Thùng carton...)</span>
                  </div>
                  <input
                    type="file"
                    hidden
                    multiple
                    ref={productFilesRef}
                    accept="image/*, application/pdf"
                    onChange={e => {
                      const files = Array.from(e.target.files || []) as File[];
                      if (files.length > 0) {
                        files.forEach(file => {
                          const reader = new FileReader();
                          reader.onload = () => {
                            setPackagingFiles(prev => [...prev, { name: file.name, data: reader.result as string }]);
                          };
                          reader.readAsDataURL(file);
                        });
                      }
                      e.target.value = '';
                    }}
                  />
                </div>

                <div className="space-y-4">
                  {packagingFiles.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {packagingFiles.map((f, i) => (
                        <div key={i} className="relative bg-[#242526] border border-[#3E4042] rounded-xl p-2 flex items-center gap-2">
                          {f.data.startsWith('data:application/pdf') ? (
                            <div className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center shrink-0">
                              <Box size={20} className="text-[#1877F2]" />
                            </div>
                          ) : (
                            <img src={f.data} className="w-10 h-10 rounded object-cover shrink-0" referrerPolicy="no-referrer" alt={f.name} />
                          )}
                          <span className="text-white text-xs truncate flex-1">{f.name}</span>
                          <button onClick={() => setPackagingFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-300 p-1 shrink-0">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button onClick={() => setPackagingCheckStep(1)} className="flex-1 py-4 border border-[#3E4042] text-white rounded-xl text-[10px] font-bold hover:bg-[#242526]">Quay lại</button>
                <button 
                  disabled={packagingFiles.length === 0 || appState !== AppState.READY} 
                  onClick={runPackagingCheck} 
                  className="flex-[2] py-4 bg-[#1877F2] text-white font-bold rounded-xl uppercase text-xs shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {appState === AppState.ANALYZING ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  Bắt đầu AI Kiểm tra
                </button>
              </div>
            </div>
          )}

          {packagingCheckStep === 3 && packagingCheckResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-sm uppercase">Kết quả kiểm tra AI</h3>
                <button onClick={exportPackagingReport} className="flex items-center gap-2 bg-[#2E7D32] hover:bg-[#1B5E20] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                  <Download size={14} />
                  Xuất báo cáo
                </button>
              </div>
              
              <div className="overflow-x-auto custom-scrollbar mt-4 border border-[#3E4042] rounded-xl bg-[#1A1A1C] max-h-[500px]">
                <table className="w-full text-left text-xs text-gray-300 min-w-[600px] relative">
                  <thead className="bg-[#242526] text-gray-400 uppercase text-[10px] tracking-wider sticky top-0 z-10 shadow-md">
                    <tr>
                      <th className="px-4 py-3 min-w-[150px] border-r border-b border-[#3E4042] font-bold">Thông số</th>
                      <th className="px-4 py-3 min-w-[150px] border-r border-b border-[#3E4042] font-bold">Chuẩn</th>
                      {packagingFiles.map((file, idx) => (
                        <th key={idx} className="px-4 py-3 min-w-[200px] border-r border-b border-[#3E4042] last:border-r-0 truncate max-w-[200px]" title={file.name}>
                          <div className="flex items-center gap-1.5 font-bold">
                            <Box size={14} className="text-[#1877F2]" />
                            <span className="truncate">{file.name}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#3E4042]">
                    {packagingCheckResult.params.map((res: any, idx: number) => (
                      <tr key={idx} className={`hover:bg-[#2A2B2D] transition-colors ${!res.match ? 'bg-red-500/5' : ''}`}>
                        <td className="px-4 py-4 border-r border-[#3E4042] align-top">
                          <div className="font-bold text-white mb-1 flex items-start justify-between gap-2">
                            <span>{res.key}</span>
                            {!res.match && <X size={14} className="text-red-400 shrink-0 mt-0.5" />}
                            {res.match && <Check size={14} className="text-green-500 shrink-0 mt-0.5" />}
                          </div>
                        </td>
                        <td className="px-4 py-4 border-r border-[#3E4042] text-white font-medium align-top">
                          {res.expected || '-'}
                        </td>
                        {packagingFiles.map((file, fIdx) => {
                          let fileResult = (res.fileResults || []).find((fr: any) => {
                            if (!fr.fileName) return false;
                            const cleanFr = fr.fileName.toLowerCase().trim();
                            const cleanF = file.name.toLowerCase().trim();
                            return cleanFr === cleanF || cleanFr.includes(cleanF) || cleanF.includes(cleanFr);
                          });
                          if (!fileResult && (res.fileResults || []).length === packagingFiles.length) {
                            fileResult = (res.fileResults || [])[fIdx];
                          }
                          if (!fileResult) {
                            return <td key={fIdx} className="px-4 py-4 border-r border-[#3E4042] last:border-r-0 align-top text-gray-500 text-[11px] italic">Không có dữ liệu</td>;
                          }
                          return (
                            <td key={fIdx} className="px-4 py-4 border-r border-[#3E4042] last:border-r-0 align-top">
                              <div className={`font-medium mb-1 ${fileResult.match ? 'text-green-100' : 'text-red-300'}`}>
                                {fileResult.actual || 'Không tìm thấy'}
                              </div>
                              {!fileResult.match && fileResult.notes && (
                                <div className="mt-2 text-[10px] text-red-300 bg-red-500/10 p-2 rounded-lg flex items-start gap-1.5">
                                  <AlertCircle size={12} className="shrink-0 mt-0.5" />
                                  <span className="leading-relaxed">{fileResult.notes}</span>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={() => setPackagingCheckStep(1)} className="flex-1 py-4 border border-[#3E4042] text-white rounded-xl text-[10px] font-bold hover:bg-[#242526]">Bắt đầu lại</button>
                <button onClick={() => setPackagingCheckStep(2)} className="flex-1 py-4 bg-[#242526] border border-[#3E4042] text-white font-bold rounded-xl text-[10px] hover:bg-[#3A3B3C]">Kiểm tra lại thiết kế</button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
