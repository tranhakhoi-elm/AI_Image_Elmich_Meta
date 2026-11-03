import React, { useState, useRef, useEffect } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode-svg';
import { Download, ArrowLeft } from 'lucide-react';

interface BarcodeGeneratorProps {
  onBackToMenu?: () => void;
}

export const BarcodeGenerator: React.FC<BarcodeGeneratorProps> = ({ onBackToMenu }) => {
  const [activeTab, setActiveTab] = useState<'CODE128' | 'EAN' | 'QR'>('CODE128');

  // Code 128 State
  const [code128Input, setCode128Input] = useState('');
  const code128SvgRef = useRef<SVGSVGElement>(null);

  // EAN State
  const [eanInput, setEanInput] = useState('');
  const eanSvgRef = useRef<SVGSVGElement>(null);

  // QR State
  const [qrBaseUrl, setQrBaseUrl] = useState('https://elmich.vn/san-pham/');
  const [qrSku, setQrSku] = useState('');
  const [qrSvgString, setQrSvgString] = useState('');

  // Calculate EAN-13 Check Digit
  const calculateEAN13CheckDigit = (code: string) => {
    if (code.length !== 12 || !/^\d+$/.test(code)) return null;
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit;
  };

  // Generate Code 128
  useEffect(() => {
    if (activeTab === 'CODE128' && code128SvgRef.current) {
      if (code128Input) {
        try {
          JsBarcode(code128SvgRef.current, code128Input, {
            format: 'CODE128',
            displayValue: true,
            background: '#ffffff',
            lineColor: '#000000',
            margin: 10
          });
        } catch (error) {
          // Ignore invalid input errors for barcode
          code128SvgRef.current.innerHTML = '';
        }
      } else {
        code128SvgRef.current.innerHTML = '';
      }
    }
  }, [code128Input, activeTab]);

  // Generate EAN-13
  useEffect(() => {
    if (activeTab === 'EAN' && eanSvgRef.current) {
      if (eanInput) {
        let finalCode = eanInput;
        
        if (eanInput.length === 12 && /^\d+$/.test(eanInput)) {
          const check = calculateEAN13CheckDigit(eanInput);
          if (check !== null) {
            finalCode = eanInput + check;
          }
        }
        
        if (finalCode.length === 13 && /^\d+$/.test(finalCode)) {
          try {
            JsBarcode(eanSvgRef.current, finalCode, {
              format: 'EAN13',
              displayValue: true,
              background: '#ffffff',
              lineColor: '#000000',
              margin: 10
            });
          } catch (error) {
            eanSvgRef.current.innerHTML = '';
          }
        } else {
          eanSvgRef.current.innerHTML = '';
        }
      } else {
        eanSvgRef.current.innerHTML = '';
      }
    }
  }, [eanInput, activeTab]);

  // Generate QR
  useEffect(() => {
    if (activeTab === 'QR') {
      const combinedUrl = `${qrBaseUrl}${qrSku}`;
      if (combinedUrl) {
        try {
          const qrcode = new QRCode({
            content: combinedUrl,
            padding: 4,
            width: 256,
            height: 256,
            color: '#000000',
            background: '#ffffff',
            ecl: 'M'
          });
          setQrSvgString(qrcode.svg());
        } catch (error) {
          setQrSvgString('');
        }
      } else {
        setQrSvgString('');
      }
    }
  }, [qrBaseUrl, qrSku, activeTab]);

  const downloadSVG = (svgElement: SVGSVGElement | null, filename: string) => {
    if (!svgElement) return;
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgElement);
    if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if (!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
      source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }
    source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
    
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const sanitizeFilename = (str: string) => str.replace(/[^a-zA-Z0-9]/gi, '_').substring(0, 30);

  const downloadQR = () => {
    if (!qrSvgString) return;
    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(qrSvgString);
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    const filename = qrSku ? `qrcode_${sanitizeFilename(qrSku)}.svg` : 'qrcode.svg';
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="bg-[#18191A] min-h-[calc(100vh-80px)] text-white p-3 sm:p-6 pb-24 md:pb-12 rounded-2xl border border-[#3E4042]">
      <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          {onBackToMenu && (
            <button
              onClick={onBackToMenu}
              className="p-2 rounded-xl bg-[#242526] border border-[#3E4042] text-gray-300 hover:text-white transition-colors"
              title="Quay lại Menu"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">Tạo Mã Vạch & QR (SVG)</h2>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-6 sm:mb-8 bg-[#242526] p-1 rounded-xl w-full sm:w-fit">
        <button 
          onClick={() => setActiveTab('CODE128')}
          className={`py-2 px-3 sm:px-6 rounded-lg text-xs sm:text-sm font-semibold transition-all text-center cursor-pointer ${activeTab === 'CODE128' ? 'bg-[#1877F2] text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
        >
          Code 128
        </button>
        <button 
          onClick={() => setActiveTab('EAN')}
          className={`py-2 px-3 sm:px-6 rounded-lg text-xs sm:text-sm font-semibold transition-all text-center cursor-pointer ${activeTab === 'EAN' ? 'bg-[#1877F2] text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
        >
          EAN-13
        </button>
        <button 
          onClick={() => setActiveTab('QR')}
          className={`py-2 px-3 sm:px-6 rounded-lg text-xs sm:text-sm font-semibold transition-all text-center cursor-pointer ${activeTab === 'QR' ? 'bg-[#1877F2] text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
        >
          QR Code
        </button>
      </div>

      <div className="bg-[#242526] border border-[#3E4042] rounded-2xl p-4 sm:p-8 max-w-2xl">
        {activeTab === 'CODE128' && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-2">Nhập chuỗi ký tự (Code 128)</label>
              <input 
                type="text" 
                placeholder="Ví dụ: SP-2023-XYZ" 
                className="w-full bg-[#18191A] border border-[#3E4042] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#1877F2] transition-colors"
                value={code128Input}
                onChange={e => setCode128Input(e.target.value)}
              />
            </div>
            <div className="bg-[#18191A] min-h-[150px] rounded-xl border border-[#3E4042] flex flex-col items-center justify-center p-6 gap-6">
               <svg ref={code128SvgRef} className="max-w-full bg-white rounded-md"></svg>
               {code128Input && (
                 <button onClick={() => downloadSVG(code128SvgRef.current, `code128_${sanitizeFilename(code128Input)}.svg`)} className="flex items-center gap-2 px-6 py-2.5 bg-[#1877F2] hover:bg-blue-600 text-white font-bold rounded-lg text-sm transition-colors">
                   <Download size={16} /> Tải xuống SVG
                 </button>
               )}
            </div>
          </div>
        )}

        {activeTab === 'EAN' && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-2">Nhập mã số (EAN-13)</label>
              <input 
                type="text" 
                placeholder="Nhập 12 số cho EAN-13 (tự động tính số thứ 13)" 
                className="w-full bg-[#18191A] border border-[#3E4042] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#1877F2] transition-colors"
                value={eanInput}
                onChange={e => setEanInput(e.target.value.replace(/\D/g, ''))}
                maxLength={13}
              />
              <p className="text-[10px] text-gray-400 mt-2">
                * Nhập 12 chữ số đầu của EAN-13, hệ thống sẽ tự động tính Check Digit thứ 13.
              </p>
            </div>
            <div className="bg-[#18191A] min-h-[150px] rounded-xl border border-[#3E4042] flex flex-col items-center justify-center p-6 gap-6">
               <svg ref={eanSvgRef} className="max-w-full bg-white rounded-md"></svg>
               {(eanInput.length === 12 || eanInput.length === 13) && (
                 <button onClick={() => downloadSVG(eanSvgRef.current, `ean13_${sanitizeFilename(eanInput)}.svg`)} className="flex items-center gap-2 px-6 py-2.5 bg-[#1877F2] hover:bg-blue-600 text-white font-bold rounded-lg text-sm transition-colors">
                   <Download size={16} /> Tải xuống SVG
                 </button>
               )}
            </div>
          </div>
        )}

        {activeTab === 'QR' && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-2">Đường dẫn cơ bản (Base URL)</label>
              <input 
                type="text" 
                placeholder="Ví dụ: https://elmich.vn/san-pham/" 
                className="w-full bg-[#18191A] border border-[#3E4042] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#1877F2] transition-colors"
                value={qrBaseUrl}
                onChange={e => setQrBaseUrl(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-2">Mã SKU (Tùy chọn)</label>
              <input 
                type="text" 
                placeholder="Nhập mã SKU..." 
                className="w-full bg-[#18191A] border border-[#3E4042] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#1877F2] transition-colors"
                value={qrSku}
                onChange={e => setQrSku(e.target.value)}
              />
            </div>
            
            <div className="bg-[#18191A] p-4 rounded-xl border border-[#3E4042]">
               <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Kết quả Link QR</label>
               <div className="text-sm text-[#1877F2] break-all">
                 {qrBaseUrl}{qrSku}
                 {(!qrBaseUrl && !qrSku) && <span className="text-gray-500">Chưa có nội dung</span>}
               </div>
            </div>

            <div className="bg-[#18191A] min-h-[250px] rounded-xl border border-[#3E4042] flex flex-col items-center justify-center p-6 gap-6">
               {qrSvgString ? (
                 <>
                   <div className="bg-white p-2 rounded-lg" dangerouslySetInnerHTML={{ __html: qrSvgString }} />
                   <button onClick={downloadQR} className="flex items-center gap-2 px-6 py-2.5 bg-[#1877F2] hover:bg-blue-600 text-white font-bold rounded-lg text-sm transition-colors">
                     <Download size={16} /> Tải xuống SVG
                   </button>
                 </>
               ) : (
                 <div className="text-sm text-gray-500">Mã QR sẽ hiển thị ở đây</div>
               )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
