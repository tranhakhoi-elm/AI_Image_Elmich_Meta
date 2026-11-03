import { Type } from "@google/genai";
import { GenerationSettings, AISuggestions, AIConceptAnalysis, CameraSettings, PropConfig, ConceptSuggestion, AspectRatio, ImageSize, ImageModelTier, DielineStructureAnalysis } from "../types";
import { reportToLark, calculateGeminiCost, calculateImagenCost } from "./metricsService";
import { isMetaProvider, metaGenerateImage, metaEditImage } from "./metaService";
import { createAiClient } from "./aiClient";

const trackGeminiUsage = async (response: any, taskName: string, modelName: string = "gemini-2.5-flash") => {
  try {
    const usage = response?.usageMetadata;
    if (usage) {
      const { promptTokenCount = 0, candidatesTokenCount = 0 } = usage;
      const { tokens, costUSD } = calculateGeminiCost(modelName, promptTokenCount, candidatesTokenCount);
      const productCode = localStorage.getItem('elmich_ai_product_code') || 'N/A';
      const productName = localStorage.getItem('elmich_ai_product_name') || 'Nhiệm vụ AI';
      reportToLark(productCode, productName, tokens, costUSD, taskName);
    }
  } catch (error) {
    console.error("Failed to track Gemini usage:", error);
  }
};

const trackImagenUsage = async (modelName: string, numImages: number, taskName: string, imageSize?: string) => {
  try {
    const { costUSD } = calculateImagenCost(modelName, numImages, imageSize);
    const productCode = localStorage.getItem('elmich_ai_product_code') || 'N/A';
    const productName = localStorage.getItem('elmich_ai_product_name') || 'Tạo ảnh AI';
    reportToLark(productCode, productName, 0, costUSD, taskName);
  } catch (error) {
    console.error("Failed to track Imagen usage:", error);
  }
};


import designLifestyleConcept from '../Design_Lifestyle_Concept.md?raw';
import designStudioCreative from '../Design_Studio_Creative.md?raw';
import designLineArt from '../Design_Line_Art.md?raw';
import designColorEditing from '../Design_Color_Editing.md?raw';
import designPackagingMockup from '../Design_Packaging_Mockup.md?raw';
import designWhiteBGRetouch from '../Design_WhiteBG_Retouch.md?raw';
import render3DToPhoto from '../3DRender_To_Photo.md?raw';
import designTechEffects from '../Design_Tech_Effects.md?raw';
import chatAssistantHandbook from '../ChatAssistant_Handbook.md?raw';

const CHAT_SYSTEM_INSTRUCTION = `${chatAssistantHandbook}

Luôn ưu tiên trả lời bằng tiếng Việt, trừ khi người dùng chủ động dùng ngôn ngữ khác. Trả lời ngắn gọn, đi thẳng vào tư vấn thực tế — KHÔNG liệt kê hay trích dẫn lại nguyên văn cẩm nang trên cho người dùng đọc.`;

const resizeImageToQuality = (base64Data: string, quality: '1K' | '2K' | '4K'): Promise<string> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve(base64Data);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let maxDimension = 1024;
        if (quality === '2K') maxDimension = 2048;
        if (quality === '4K') maxDimension = 4096;
        
        const currentMax = Math.max(img.width, img.height);
        
        // If image is already close to the desired resolution, don't resize it unless it's too small
        if (currentMax === maxDimension && base64Data.startsWith('data:image/png')) {
            resolve(base64Data);
            return;
        }

        const scaleFactor = maxDimension / currentMax;
        
        canvas.width = Math.round(img.width * scaleFactor);
        canvas.height = Math.round(img.height * scaleFactor);
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          // Luôn xuất định dạng PNG để giữ chất lượng cao nhất (lossless), giống phiên bản cũ
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve(base64Data);
        }
      } catch (err) {
        console.error("Failed to resize image:", err);
        resolve(base64Data);
      }
    };
    img.onerror = () => {
      resolve(base64Data);
    };
    img.src = base64Data;
  });
};

const padImageToAspectRatio = (base64Data: string, aspectRatio: string, padColor: string = '#FFFFFF'): Promise<string> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve(base64Data);
      return;
    }
    const [wRatio, hRatio] = aspectRatio.split(':').map(Number);
    if (!wRatio || !hRatio) {
      resolve(base64Data);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const targetRatio = wRatio / hRatio;
        const currentRatio = img.width / img.height;
        
        let newWidth = img.width;
        let newHeight = img.height;

        if (currentRatio > targetRatio + 0.01) {
          // Image is wider than target. Need to pad height.
          newHeight = Math.round(img.width / targetRatio);
        } else if (currentRatio < targetRatio - 0.01) {
          // Image is taller than target. Need to pad width.
          newWidth = Math.round(img.height * targetRatio);
        } else {
          if (base64Data.startsWith('data:image/png')) {
            resolve(base64Data);
          } else {
            const canvas = document.createElement('canvas');
            canvas.width = newWidth;
            canvas.height = newHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              resolve(canvas.toDataURL('image/png'));
            } else {
              resolve(base64Data);
            }
          }
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = padColor;
          ctx.fillRect(0, 0, newWidth, newHeight);
          
          const offsetX = Math.round((newWidth - img.width) / 2);
          const offsetY = Math.round((newHeight - img.height) / 2);
          
          ctx.drawImage(img, offsetX, offsetY);
          // Luôn xuất định dạng PNG
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve(base64Data);
        }
      } catch (error) {
        console.error("Padding error:", error);
        resolve(base64Data);
      }
    };
    img.onerror = () => resolve(base64Data);
    img.src = base64Data;
  });
};

/**
 * Ép các vùng gần-trắng nối liền với viền ảnh thành trắng tuyệt đối #FFFFFF
 * bằng flood-fill (BFS) — dọn nốt bóng xám/viền mà AI generate còn sót lại,
 * không tốn thêm lượt gọi AI nào. Chỉ lan từ viền vào trong, nên không đụng
 * tới các vùng trắng/sáng NẰM TRÊN sản phẩm (không nối liền với viền qua
 * đường toàn pixel gần-trắng) — dùng cho WHITE_BG_RETOUCH.
 */
const whitenNearWhiteBackground = (base64Data: string, tolerance = 18): Promise<string> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve(base64Data);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(base64Data); return; }
        ctx.drawImage(img, 0, 0);

        const { width, height } = canvas;
        const imageData = ctx.getImageData(0, 0, width, height);
        const { data } = imageData;
        const visited = new Uint8Array(width * height);
        const queue = new Int32Array(width * height);
        let qTail = 0;

        const isNearWhite = (p: number) => (255 - data[p]) <= tolerance && (255 - data[p + 1]) <= tolerance && (255 - data[p + 2]) <= tolerance;

        const trySeed = (x: number, y: number) => {
          const idx = y * width + x;
          if (visited[idx]) return;
          if (isNearWhite(idx * 4)) {
            visited[idx] = 1;
            queue[qTail++] = idx;
          }
        };

        for (let x = 0; x < width; x++) { trySeed(x, 0); trySeed(x, height - 1); }
        for (let y = 0; y < height; y++) { trySeed(0, y); trySeed(width - 1, y); }

        let qHead = 0;
        while (qHead < qTail) {
          const idx = queue[qHead++];
          const x = idx % width;
          const y = (idx / width) | 0;
          if (x > 0) trySeed(x - 1, y);
          if (x < width - 1) trySeed(x + 1, y);
          if (y > 0) trySeed(x, y - 1);
          if (y < height - 1) trySeed(x, y + 1);
        }

        for (let i = 0; i < visited.length; i++) {
          if (visited[i]) {
            const p = i * 4;
            data[p] = 255; data[p + 1] = 255; data[p + 2] = 255;
          }
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        console.error("Whiten background failed:", err);
        resolve(base64Data);
      }
    };
    img.onerror = () => resolve(base64Data);
    img.src = base64Data;
  });
};

// Tự động phân tích chất liệu từ ảnh
export const analyzeProductMaterials = async (imageBase64: string): Promise<{ categories: string[], description: string }> => {
  const ai = createAiClient();
  try {
    const match = imageBase64.match(/^data:(image\/[a-z]+);base64,(.+)$/);
    const parts: any[] = [{
      text: `Analyze the provided product image to determine its materials. 
Please classify the materials into the following categories (return an array of IDs):
- 'METAL' (for any metal, stainless steel, aluminum, chrome)
- 'PLASTIC' (for plastic, polymer, silicone, ABS)
- 'GLASS' (for glass, transparent materials)
- 'CERAMIC' (for ceramic, non-stick coatings, enamel)

Also provide a detailed description (in Vietnamese) of where these materials are located on the product and their exact visual properties (e.g., "Thân ấm làm từ inox xước (brushed stainless steel) mờ, nắp nhựa ABS đen bóng, viền mạ chrome bóng loáng (mirror-polished)"). This helps in generating highly realistic textures.

Return ONLY a JSON object with this exact structure:
{
  "categories": ["METAL", "PLASTIC"],
  "description": "Mô tả chi tiết bằng tiếng Việt..."
}`
    }];
    
    if (match) {
      parts.push({
        inlineData: {
          mimeType: match[1],
          data: match[2]
        }
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json"
      }
    });

    trackGeminiUsage(response, "Phân tích chất liệu sản phẩm");
    if (response.text) {
      const parsed = safeParseGeminiJson(response.text);
      if (parsed && Array.isArray(parsed.categories)) {
        return {
          categories: parsed.categories,
          description: String(parsed.description || ""),
        };
      }
      throw new Error("AI trả về dữ liệu không đúng định dạng. Vui lòng thử lại.");
    }
    throw new Error("AI không trả về kết quả. Vui lòng thử lại.");
  } catch (error: any) {
    console.error("Lỗi phân tích chất liệu:", error);
    // Ném lỗi kèm NGUYÊN NHÂN THẬT ra ngoài để giao diện hiển thị cho người
    // dùng (vd chưa cấu hình Meta API key, key bị từ chối) thay vì nuốt lỗi
    // và trả về rỗng như trước — lỗi nuốt khiến không ai chẩn đoán được.
    if (error instanceof Error) throw error;
    throw new Error("Không gọi được AI. Vui lòng thử lại.");
  }
};

// --- CÁC HÀM CHO CÁC MODE CŨ ---
export const getAiSuggestions = async (settings: { productName: string, visualStyle: string, techDescription?: string }): Promise<AISuggestions> => {
  const ai = createAiClient();
  let styleContext = settings.visualStyle === "TECH_PS" ? `Phong cách "Ảnh USP Kỹ thuật".` : `Phong cách cơ bản.`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Gợi ý cho: "${settings.productName}". ${styleContext}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            concepts: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  prompt: { type: Type.STRING }
                },
                required: ["title", "prompt"]
              } 
            },
            locations: { type: Type.ARRAY, items: { type: Type.STRING } },
            props: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["concepts", "locations", "props"]
        }
      }
    });
    trackGeminiUsage(response, settings.productName || "Gợi ý AI");
    const result = JSON.parse(response.text || "{}");
    return {
      concepts: result.concepts || [],
      locations: result.locations || [],
      props: result.props || []
    };
  } catch (e) { return { concepts: [], locations: [], props: [] }; }
};

// 1. Phân tích Concept (Lifestyle) - CẬP NHẬT ĐỂ NHẬN ẢNH THAM KHẢO
export const analyzeConceptAndCamera = async (productName: string, dimensions: string, images: string[], refImage: string | null, categoryGuidance?: string): Promise<AIConceptAnalysis> => {
  const ai = createAiClient();
  try {
    const categoryGuidanceBlock = categoryGuidance
      ? `
=== CHỈ DẪN THAM KHẢO CHO DÒNG SẢN PHẨM NÀY ===
Đúc kết từ các ảnh cùng dòng sản phẩm đã được đội ngũ Elmich đánh giá "Rất tốt!" trước đây — đây là xu hướng thẩm mỹ chung được ưa chuộng cho cả dòng sản phẩm, KHÔNG PHẢI một công thức cố định phải chép lại y hệt cho sản phẩm cụ thể đang phân tích. Hãy dùng nó như 1 gợi ý định hướng, nhưng BẮT BUỘC vẫn điều chỉnh chi tiết cụ thể (không gian, đạo cụ, ánh sáng...) theo đúng DANH MỤC/màu sắc/chất liệu THẬT của sản phẩm ở Bước 1 bên dưới — hai sản phẩm khác loại trong cùng dòng vẫn phải ra concept khác nhau rõ rệt:
${categoryGuidance}
========================================
`
      : "";

    const prompt = `
=== ĐỌC QUY CHUẨN TRƯỚC KHI THỰC HIỆN (BẮT BUỘC) ===
Dưới đây là tài liệu quy chuẩn phong cách và các lỗi cần tránh của phong cách này:
${designLifestyleConcept}
========================================
${categoryGuidanceBlock}
Bạn là Giám đốc Sáng tạo Nhiếp ảnh Ẩm thực & Prompt Engineer chuyên nghiệp của Elmich.
Dựa vào quy chuẩn phong cách thiết kế phía trên, hãy phân tích sản phẩm và đề xuất 5 Ý tưởng phối cảnh Lifestyle ĐA DẠNG & TOÀN DIỆN:
Sản phẩm: "${productName}". Kích thước: ${dimensions}.
${refImage ? "Tôi có gửi kèm một ảnh mẫu phong cách (Style Reference). Hãy dựa vào style của ảnh này để đề xuất." : ""}

BƯỚC 1 — PHÂN TÍCH SẢN PHẨM & CÂU CHUYỆN SỬ DỤNG:
- Xác định chính xác DANH MỤC sản phẩm và công năng sử dụng thực tế (nấu nướng, pha trà/cà phê, nướng bánh, xay sinh tố, giữ nhiệt, là ủi, hút bụi...).
- Quan sát kỹ hình khối, đường nét, chất liệu bề mặt và bảng màu sắc đặc trưng của sản phẩm.
- Lựa chọn các trường phái không gian ẩm thực phù hợp nhất (Modern Mediterranean, Italian Minimalist, Japandi Organic, Parisian Bakery, Scandinavian, Cozy Farmhouse...).

BƯỚC 2 — ĐỀ XUẤT 5 PHONG CÁCH TOÀN DIỆN (GỒM CẢ BỐI CẢNH + ĐẠO CỤ + VỊ TRÍ ĐẶT):
Với MỖI concept trong số 5 concept, bạn hãy cung cấp đầy đủ 4 trường thông tin:
1. 'title': Tên phong cách (tiếng Việt ngắn gọn, gợi cảm xúc, ví dụ: "Bình minh Địa Trung Hải & Bữa sáng", "Bếp Ý Tối giản Sang trọng", "Không gian Japandi Mộc mạc & Thư thái", "Bếp bánh ấm cúng phong cách Pháp", "Căn hộ Bắc Âu Hiện đại & Năng động").
2. 'prompt': Bản mô tả bối cảnh chi tiết (tiếng Việt), mạch lạc, giàu sức sống và tương tác ẩm thực chân thực:
   - Mô tả phong cách nội thất kiến trúc, vật liệu mặt bàn (đá cẩm thạch, gỗ sồi, bê tông mài, gạch gốm...)
   - Mô tả tương tác ẩm thực sống động (thức ăn tươi đang sơ chế, làn hơi ấm bốc nhẹ, sốt bóng mịn...)
   - Cách ánh sáng tự nhiên rọi vào (nắng sớm xiên cửa sổ, ánh sáng dịu qua rèm, hoàng hôn ấm áp)
   - Tông màu tổng thể hài hòa, tôn lên màu sắc và chất liệu của sản phẩm
3. 'props': Danh sách 8-10 đạo cụ (props) cụ thể ăn khớp hoàn hảo với concept đó theo mô hình 3 tầng:
   - Tầng 1: Nguyên liệu/thức ăn tươi ngon đúng công năng của sản phẩm
   - Tầng 2: Đồ dùng bàn ăn (tableware), thớt gỗ, đĩa gốm artisan, thìa nĩa, lọ gia vị nắp bần
   - Tầng 3: Chi tiết khí quyển & cảm xúc (nhánh thảo mộc đọng sương, vết bột mì lấm tấm, hơi nước ấm)
   (Mỗi đạo cụ mô tả cụ thể về chất liệu và trạng thái, ví dụ "vài nhánh hương thảo tươi trên đĩa gốm mờ", "lọ dầu ô liu thủy tinh thanh mảnh")
4. 'placement': Vị trí, góc đặt sản phẩm và tỷ lệ tối ưu trong khung hình (ví dụ: "Đặt trên mặt bàn đá trắng lệch 1/3 bên trái, hướng góc 45 độ đón nắng sớm").

BẮT BUỘC ĐA DẠNG: 5 concept phải mang 5 tâm trạng/không gian và bảng màu khác biệt nhau rõ rệt, không lặp lại cùng một công thức!

Trả về JSON với mảng concepts (mỗi phần tử gồm title, prompt, props, placement) và suggestedCamera.
`;

    const parts: any[] = [{ text: prompt }];
    images.forEach(img => parts.push({ inlineData: { data: img.split(',')[1], mimeType: 'image/png' } }));
    if (refImage) {
      parts.push({ inlineData: { data: refImage.split(',')[1], mimeType: 'image/png' } });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        temperature: 1.15,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            concepts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  prompt: { type: Type.STRING },
                  props: { type: Type.ARRAY, items: { type: Type.STRING } },
                  placement: { type: Type.STRING }
                },
                required: ["title", "prompt", "props", "placement"]
              }
            },
            suggestedCamera: {
              type: Type.OBJECT,
              properties: {
                angle: { type: Type.NUMBER },
                focalLength: { type: Type.NUMBER },
                aperture: { type: Type.STRING },
                iso: { type: Type.STRING },
                isMacro: { type: Type.BOOLEAN }
              },
              required: ["angle", "focalLength", "aperture", "iso", "isMacro"]
            }
          },
          required: ["concepts", "suggestedCamera"]
        }
      }
    });

    trackGeminiUsage(response, productName || "Phân tích Concept");
    return JSON.parse(response.text || "{}") as AIConceptAnalysis;
  } catch (error: any) {
    if (error.message?.includes("Requested entity was not found")) throw new Error("AUTH_ERROR");
    throw error;
  }
};

// 2. Phân tích Tech USP
export const analyzeTechConceptAndCamera = async (productName: string, techDesc: string, dimensions: string, images: string[]): Promise<AIConceptAnalysis> => {
  const ai = createAiClient();
  try {
    const prompt = `
=== ĐỌC QUY CHUẨN TRƯỚC KHI THỰC HIỆN (BẮT BUỘC) ===
Dưới đây là tài liệu quy chuẩn phong cách và đặc tả kỹ năng cho tác vụ này:
${designTechEffects}
========================================

Bạn là một chuyên gia Prompt Engineer và Giám đốc sáng tạo nhiếp ảnh sản phẩm chuyên nghiệp của Elmich.
Dựa TRÊN QUY CHUẨN TRÊN, hãy thực hiện phân tích kỹ thuật:
Phân tích kỹ thuật cho: "${productName}". Tính năng: "${techDesc}". Kích thước: ${dimensions}.

BƯỚC 1 — PHÂN TÍCH TRƯỚC KHI ĐỀ XUẤT (không cần viết ra câu trả lời của bước này):
- Xác định DANH MỤC sản phẩm (nồi chiên không dầu, quạt/máy lọc không khí, bếp từ, máy xay, ấm siêu tốc...) và cơ chế vật lý thực tế đằng sau tính năng "${techDesc}" (đối lưu khí nóng, cảm ứng điện từ, áp suất, ly tâm...) để hiệu ứng đồ họa mô tả ĐÚNG bản chất vật lý, không tưởng tượng tùy tiện.
- Xác định 1-2 màu neon/ánh sáng phù hợp nhất với bản chất tính năng đó (nhiệt = cam/đỏ, làm mát/lọc khí = xanh dương/ngọc bích, điện từ = tím/xanh điện...).

YÊU CẦU ĐỀ XUẤT:
1. Trả về JSON 5 concept (mỗi concept gồm 'title' bằng tiếng Việt và 'prompt') và camera.
2. BẮT BUỘC ĐA DẠNG: 5 concept phải thể hiện 5 GÓC ĐỘ khác nhau của cùng 1 tính năng (ví dụ: toàn cảnh luồng khí bao quanh sản phẩm, cận cảnh mặt cắt xuyên thấu bên trong, góc từ trên xuống cho thấy vùng tác động, góc thấp nhấn mạnh sức mạnh, góc kèm biểu đồ/mũi tên chỉ hướng dòng chảy) — không lặp lại cùng 1 bố cục hiệu ứng.
3. YÊU CẦU CHO 'prompt': Viết 100% bằng tiếng Việt, mạch lạc, BẮT BUỘC XUỐNG DÒNG (dùng \
), KHÔNG viết tên tiêu chí, chỉ ghi nội dung bắt đầu bằng gạch đầu dòng:
- [Mô tả phong cách hiệu năng công nghệ, đúng bản chất vật lý đã xác định ở Bước 1]
- [Mô tả không gian hiển thị, bối cảnh tối sang trọng]
- [Mô tả cách đánh sáng phát quang tinh tế theo đúng màu đã chọn]
- [Mô tả cảm giác, màu sắc của dải nhiệt/lạnh phù hợp]
- [Quy chuẩn chống lòe loẹt, chống lỗi bóng mờ]`;
    const parts: any[] = [{ text: prompt }];
    images.forEach(img => parts.push({ inlineData: { data: img.split(',')[1], mimeType: 'image/png' } }));

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            concepts: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  prompt: { type: Type.STRING }
                },
                required: ["title", "prompt"]
              } 
            },
            suggestedCamera: {
              type: Type.OBJECT,
              properties: {
                angle: { type: Type.NUMBER }, focalLength: { type: Type.NUMBER }, aperture: { type: Type.STRING }, iso: { type: Type.STRING }, isMacro: { type: Type.BOOLEAN }
              },
              required: ["angle", "focalLength", "aperture", "iso", "isMacro"]
            }
          },
          required: ["concepts", "suggestedCamera"]
        }
      }
    });
    trackGeminiUsage(response, productName || "Phân tích Tech/USP");
    const result = JSON.parse(response.text || "{}");
    return {
      concepts: result.concepts || [],
      suggestedCamera: result.suggestedCamera || { angle: 0, focalLength: 50, aperture: 'f/2.8', iso: '100', isMacro: false }
    };
  } catch (error: any) { throw error; }
};

// Hàm parse JSON an toàn từ kết quả của mô hình Gemini (loại bỏ markdown fences nếu có)
export const safeParseGeminiJson = (text?: string): any => {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    const cleaned = text
      .replace(/^```(?:json)?\s*/im, '')
      .replace(/\s*```$/im, '')
      .trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        try {
          return JSON.parse(text.slice(firstBrace, lastBrace + 1));
        } catch {}
      }
      return {};
    }
  }
};

// Danh sách đạo cụ dự phòng chất lượng cao chuẩn Elmich phòng khi API gặp sự cố mạng
export const getFallbackProps = (productName: string = '', mode: 'STUDIO' | 'LIFESTYLE' = 'LIFESTYLE'): string[] => {
  const lower = productName.toLowerCase();
  if (mode === 'STUDIO') {
    if (lower.includes('nồi') || lower.includes('chảo')) {
      return [
        'Bục gỗ sồi tự nhiên màu sáng, bề mặt mịn màng',
        'Vài nhánh hương thảo tươi xếp gọn gàng cạnh chân bục',
        'Đĩa gốm men mờ màu xám tro phong cách tối giản',
        'Vải lanh dệt thô màu kem phủ nhẹ một góc bục',
        'Vài lát chanh vàng tươi cắt mỏng xếp nghệ thuật',
        'Trụ kim loại xước mờ satin bổ trợ góc sau',
        'Vài hạt tiêu đen nguyên hạt rải nhẹ tạo điểm nhấn'
      ];
    }
    if (lower.includes('ấm') || lower.includes('bình')) {
      return [
        'Bục đá travertine màu be sáng với vân tự nhiên',
        'Vài lát cam vàng khô xếp cạnh chân bục',
        'Đế lót bằng gỗ óc chó tròn tối giản',
        'Nhánh hoa baby khô tạo cảm giác thanh lịch',
        'Vải lụa mờ màu kem nhạt xếp nếp mềm mại',
        'Khối mica mờ khuếch tán ánh sáng nhẹ phía sau'
      ];
    }
    return [
      'Bục đá travertine màu be sáng với vân tự nhiên',
      'Khối gỗ sồi màu sáng phong cách tối giản',
      'Vải lanh dệt thô màu xám tro nhẹ',
      'Đế lót gốm thủ công mộc mạc',
      'Nhánh lá xanh nhỏ tạo sức sống thanh khiết',
      'Bục mica trong mờ khuếch tán ánh sáng dịu'
    ];
  } else {
    if (lower.includes('nồi') || lower.includes('chảo')) {
      return [
        'Thớt gỗ sồi tự nhiên có vân sáng, đặt nghiêng trên mặt bàn',
        'Bát gốm men mờ đựng rau củ tươi (cà rốt, bí ngòi)',
        'Khăn lau bếp vải lanh màu kem nhạt gấp gọn gàng',
        'Lọ gia vị thủy tinh đựng hạt tiêu đen và muối biển',
        'Chai dầu ô liu thủy tinh trong suốt dáng thanh mảnh',
        'Muôi gỗ tự nhiên cán dài gác nhẹ cạnh bếp',
        'Chậu cây hương thảo nhỏ trong chậu đất nung'
      ];
    }
    if (lower.includes('ấm') || lower.includes('bình')) {
      return [
        'Khay gỗ tự nhiên màu sáng đựng bộ ly thủy tinh',
        'Hũ thủy tinh nhỏ đựng lá trà thảo mộc sấy khô',
        'Vài lát chanh tươi và lá bạc hà trên đĩa gốm nhỏ',
        'Cuốn tạp chí phong cách sống mở hờ trên bàn gỗ',
        'Khăn trải bàn vải thô màu be ấm áp',
        'Cốc trà thủy tinh hai lớp chịu nhiệt'
      ];
    }
    return [
      'Mặt bàn đá nhân tạo vân mây sang trọng',
      'Thớt gỗ tự nhiên cao cấp phong cách Scandinavia',
      'Khăn lau vải lanh màu pastel thanh lịch',
      'Lọ hoa gốm nhỏ cắm cành lá xanh tươi mát',
      'Hũ gia vị nắp gỗ tối giản xếp ngăn nắp',
      'Ánh nắng tự nhiên buổi sáng rọi qua khung cửa sổ'
    ];
  }
};

// 3. Gợi ý Props cho Concept Lifestyle
export const suggestPropsForConcept = async (productName: string, concept: string, mode: 'STUDIO' | 'LIFESTYLE' = 'LIFESTYLE', excludeProps: string[] = [], categoryGuidance?: string): Promise<{props: string[], placement: string}> => {
  const ai = createAiClient();
  const isMore = excludeProps.length > 0;
  const count = isMore ? 8 : 10;
  const categoryGuidanceNote = categoryGuidance
    ? `\nCHỈ DẪN RIÊNG CHO DÒNG SẢN PHẨM NÀY (đúc kết từ các ảnh đã được đội ngũ Elmich đánh giá "Rất tốt!" — ưu tiên áp dụng khi chọn đạo cụ/bố cục bên dưới):\n${categoryGuidance}\n`
    : "";
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Sản phẩm thực tế: ${productName || "Sản phẩm gia dụng cao cấp Elmich"}.
Bối cảnh/Concept thiết kế: "${concept}".

YÊU CẦU PHÂN TÍCH:
1. Đọc kỹ tên sản phẩm, XÁC ĐỊNH DANH MỤC cụ thể (ấm/bình trà, nồi/chảo, máy xay/ép, nồi chiên không dầu, bình giữ nhiệt, bàn ủi, máy hút bụi, lò nướng, dụng cụ nhỏ...) và hiểu rõ chức năng, cách sử dụng thực tế của nó.
2. Suy luận sâu để đề xuất 'placement': Vị trí, góc đặt sản phẩm, và cách ánh sáng tương tác tôn lên vẻ đẹp của sản phẩm.
3. Đề xuất ${count} đạo cụ (props) đi kèm, viết mỗi đạo cụ dưới dạng 1 cụm mô tả CÓ CHI TIẾT CHẤT LIỆU/TRẠNG THÁI (ví dụ "vài lát cam khô xếp cạnh ấm, tỏa hơi ấm nhẹ" thay vì chỉ "lát cam khô") để prompt sinh ảnh có đủ dữ liệu hình ảnh phong phú. Các đạo cụ này PHẢI cực kỳ logic với công năng của DANH MỤC sản phẩm đã xác định ở bước 1 và bối cảnh được chọn. KHÔNG liệt kê các đạo cụ nghệ thuật chung chung (như lăng kính, khối mica, v.v.) nếu nó không thực sự liên quan đến sản phẩm.
4. BẮT BUỘC ĐA DẠNG VÀ KHÔNG TRÙNG LẶP: ${count} đạo cụ phải khác nhau rõ rệt (không liệt kê 2 biến thể của cùng 1 vật), và nên phối hợp ít nhất 2 nhóm khác nhau: (a) nguyên liệu/vật dụng gắn trực tiếp với chức năng sản phẩm, (b) vật trang trí môi trường xung quanh hợp bối cảnh (không lấn át sản phẩm chính).
5. MÀU SẮC PHẢI ĂN KHỚP: mỗi đạo cụ phải có tông màu cùng nhóm (tone-on-tone) hoặc bổ trợ hài hòa với màu chủ đạo/phụ trợ của sản phẩm và bối cảnh đã chọn — tuyệt đối không đề xuất đạo cụ có màu sắc chỏi, lệch tông so với bảng màu tổng thể.

${mode === 'STUDIO'
  ? 'LƯU Ý STUDIO: Phông nền đơn sắc. Đạo cụ tập trung làm nổi bật chất liệu và kiểu dáng sản phẩm — ví dụ: máy xay/ép đi với trái cây tươi cắt lát hoặc hạt cà phê rang; nồi/chảo đi với rau củ hoặc nguyên liệu đang chế biến; nồi chiên không dầu đi với khay thực phẩm/giỏ chiên; bàn ủi đi với vải/áo sơ mi xếp gọn; máy hút bụi đi với sàn nhà/thảm sạch bóng; bình giữ nhiệt đi với đá viên hoặc hơi nước bốc lên. Luôn kèm 1 bục đỡ (plinth) phù hợp kiểu dáng và hiệu ứng bóng đổ tự nhiên — NHƯNG BẮT BUỘC LUÂN PHIÊN chất liệu bục theo tông màu/phong cách sản phẩm, KHÔNG mặc định lúc nào cũng là khối đá travertine/marble: có thể là khối gỗ sồi/gỗ óc chó sáng màu, đĩa/trụ kim loại chải xước, bục mica/lucite trong mờ, bệ gốm men mờ, hoặc vải lanh/nhung phủ nhẹ — chọn loại ăn khớp nhất với tông màu sản phẩm ở yêu cầu (5).'
  : 'LƯU Ý LIFESTYLE (Phối cảnh): Đạo cụ phải thuộc về môi trường tự nhiên của DANH MỤC sản phẩm. Ví dụ: đồ gia dụng nhà bếp đi với nguyên liệu nấu nướng, gia vị, thớt gỗ, bếp...; bình giữ nhiệt đi với balo, góc làm việc, hoặc đồ thể thao; bàn ủi đi với góc phòng giặt ủi, quần áo treo gọn gàng; máy hút bụi đi với không gian phòng khách/thảm sạch. Tập trung vào tính thực tế, chân thực, tránh những đạo cụ "thơ mộng" hoặc "trừu tượng" không ăn nhập với công năng.'
}
${isMore ? `\nDANH SÁCH ĐÃ GỢI Ý TRƯỚC ĐÓ (TUYỆT ĐỐI KHÔNG LẶP LẠI, kể cả biến thể gần giống): ${excludeProps.map(p => `"${p}"`).join(', ')}\nHãy nghĩ theo hướng KHÁC HẲN nhóm đạo cụ trên (đổi chất liệu, đổi loại vật dụng, đổi vị trí) để mở rộng lựa chọn cho người dùng, không chỉ đổi từ ngữ của cùng 1 ý tưởng.` : ''}
${categoryGuidanceNote}
Trả về định dạng JSON với 'placement' (string) và 'props' (mảng ${count} chuỗi, mỗi chuỗi miêu tả ngắn gọn nhưng có chi tiết hình ảnh cụ thể về một đạo cụ hoặc yếu tố môi trường).`,
      config: {
        responseMimeType: "application/json",
        temperature: isMore ? 1.3 : 1,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            placement: { type: Type.STRING },
            props: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["placement", "props"]
        }
      }
    });

    try {
      trackGeminiUsage(response, productName || "Đạo cụ Concept", "gemini-2.5-flash");
    } catch {}

    const parsed = safeParseGeminiJson(response.text);
    const parsedProps = Array.isArray(parsed.props)
      ? parsed.props.filter((p: any) => typeof p === 'string' && p.trim().length > 0)
      : [];

    return {
      props: parsedProps.length > 0 ? parsedProps : getFallbackProps(productName, mode),
      placement: typeof parsed.placement === 'string' && parsed.placement.trim().length > 0
        ? parsed.placement
        : (mode === 'STUDIO' ? 'Đặt chính giữa bục studio, góc chụp ngang tầm mắt tôn dáng sản phẩm' : 'Đặt trên mặt bàn bếp, ánh sáng tự nhiên nghiêng 45 độ')
    };
  } catch (error) {
    console.warn("suggestPropsForConcept encountered error, using fallback props:", error);
    return {
      props: getFallbackProps(productName, mode),
      placement: mode === 'STUDIO'
        ? 'Đặt chính giữa bục studio, góc chụp ngang tầm mắt tôn dáng sản phẩm'
        : 'Đặt trên mặt bàn bếp, ánh sáng tự nhiên nghiêng 45 độ'
    };
  }
};

// 4. Gợi ý Visual Elements cho Tech USP
export const suggestTechVisuals = async (productName: string, concept: string): Promise<{props: string[], placement: string}> => {
  const ai = createAiClient();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
=== QUY CHUẨN THAM KHẢO (Tech Effects) ===
${designTechEffects}
========================================

Sản phẩm: ${productName}. Tech Concept: "${concept}".
YÊU CẦU:
1. Xác định DANH MỤC sản phẩm và cơ chế vật lý thực tế đằng sau concept trên (đối lưu khí nóng, hơi nước áp suất, cảm ứng điện từ, ly tâm, sóng âm khử khuẩn...).
2. Suy luận sâu và đề xuất 'placement': Vị trí và tỷ lệ sản phẩm (cách đặt sản phẩm, tỷ lệ so với khung hình) sao cho hiệu ứng có đủ không gian hiển thị.
3. Liệt kê 10 hiệu ứng đồ họa/visual elements đi kèm, mỗi hiệu ứng viết CÓ CHI TIẾT HÌNH ẢNH cụ thể (ví dụ "luồng khí nóng màu cam xoáy hình trôn ốc bao quanh giỏ chiên" thay vì chỉ "luồng khí nóng") và phải khớp đúng cơ chế vật lý đã xác định ở bước 1 — không dùng hiệu ứng chung chung không liên quan tính năng thật.
4. BẮT BUỘC ĐA DẠNG: 10 hiệu ứng phải khác nhau về vị trí xuất hiện (bên trong/bên ngoài/mặt cắt), hình dạng (xoáy/tia thẳng/tỏa tròn/gợn sóng) và cường độ — không lặp lại cùng 1 kiểu hiệu ứng dưới tên gọi khác nhau.
Trả về JSON với 'placement' (string) và 'props' (array of strings).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { 
            placement: { type: Type.STRING },
            props: { type: Type.ARRAY, items: { type: Type.STRING } } 
          }
        }
      }
    });
    trackGeminiUsage(response, productName || "Hiệu ứng Tech");
    const result = JSON.parse(response.text || "{}");
    return {
      props: result.props || [],
      placement: result.placement || ""
    };
  } catch (error) { return { props: [], placement: "" }; }
};

// 5. Gợi ý Tech Concepts cho Hiệu ứng mặt biển
export const suggestTechConcepts = async (productName: string, title: string): Promise<ConceptSuggestion[]> => {
  const ai = createAiClient();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
=== ĐỌC QUY CHUẨN TRƯỚC KHI THỰC HIỆN (BẮT BUỘC) ===
Dưới đây là tài liệu quy chuẩn phong cách và đặc tả kỹ năng cho tác vụ này:
${designTechEffects}
========================================

Sản phẩm: ${productName}, Tiêu đề: ${title}. Mô tả 3 ý tưởng hiển thị trên mặt nước biển đêm theo đúng Quy Chuẩn Hiệu ứng Công nghệ.
BẮT BUỘC ĐA DẠNG: 3 ý tưởng phải khác nhau rõ rệt về bố cục sóng (gợn nhẹ lăn tăn / xoáy cuộn mạnh / tách lớp thành dải) và tông màu neon (xanh ngọc bích / xanh dương đậm / pha ánh tím) — không lặp lại cùng 1 kiểu chuyển động sóng hay cùng 1 tông màu giữa 3 ý tưởng.
JSON array với 'title' (tiếng Việt) và 'prompt'.
YÊU CẦU CHO 'prompt': Viết 100% bằng tiếng Việt, mạch lạc, BẮT BUỘC XUỐNG DÒNG (dùng \
), KHÔNG viết tên tiêu chí, chỉ ghi nội dung bắt đầu bằng gạch đầu dòng:
- [Mô tả phong cách và cấu trúc hiệu ứng của sóng nước đại dương rực rỡ]
- [Mô tả nền mặt biển ẩm mượt, tinh khôi]
- [Mô tả cách đánh sáng phát quang, ánh neon phản chiếu xanh lam/ngọc bích]
- [Mô tả cảm giác, màu sắc chủ đạo, chất lượng hoàn hảo]`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { 
            concepts: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  prompt: { type: Type.STRING }
                },
                required: ["title", "prompt"]
              } 
            } 
          }
        }
      }
    });
    trackGeminiUsage(response, productName || "Gợi ý Tech");
    const result = JSON.parse(response.text || "{}");
    return result.concepts || [];
  } catch (error) { return []; }
};

// 6. Phân tích phối cảnh staging
export const analyzeStagingScene = async (concept: string, realSceneImg: string, refStyleImg: string): Promise<string[]> => {
  const ai = createAiClient();
  try {
    const prompt = `
=== QUY CHUẨN THAM KHẢO (Lifestyle & Scene Staging) ===
${designLifestyleConcept}
========================================

Bạn là chuyên gia Home Staging cho ảnh sản phẩm thương mại. Bạn được cung cấp 2 ảnh: (1) ảnh không gian phòng thực tế sẽ đặt sản phẩm vào, (2) ảnh tham khảo phong cách mong muốn. Concept mô tả thêm: "${concept}".

YÊU CẦU PHÂN TÍCH:
1. Quan sát ảnh (1) để nhận diện loại không gian (bếp/phòng khách/bàn ăn...), nội thất/màu sắc sẵn có, và các vị trí trống hợp lý để thêm đạo cụ mà không che khuất sản phẩm chính.
2. Quan sát ảnh (2) để nắm bắt tông màu, mood và loại vật dụng đặc trưng của phong cách tham khảo.
3. Đề xuất 10 vật phẩm trang trí thêm vào phòng (1), kết hợp hài hòa giữa nội thất sẵn có của (1) và phong cách của (2) — mỗi vật phẩm viết CÓ CHI TIẾT chất liệu/vị trí đặt (ví dụ "bình gốm nhỏ men mờ đặt góc trái quầy bếp" thay vì chỉ "bình gốm").
4. BẮT BUỘC ĐA DẠNG VÀ THỰC TẾ: không liệt kê 2 vật tương tự nhau; ưu tiên các nhóm khác nhau (cây xanh/hoa, vật dụng bếp liên quan trực tiếp tới sản phẩm nếu ảnh (1) là bếp, vải/khăn trải, ánh sáng trang trí, vật trang trí nhỏ). Tuân thủ nguyên tắc "Aesthetic Order" của quy chuẩn — không đề xuất vật gây rối mắt, không hợp không gian, hoặc làm bừa bộn (mục 2 và Defect Prevention Checklist của quy chuẩn).

Trả về JSON 10 vật phẩm trang trí thêm vào phòng.`;
    const parts: any[] = [
      { text: prompt },
      { inlineData: { data: realSceneImg.split(',')[1], mimeType: 'image/png' } },
      { inlineData: { data: refStyleImg.split(',')[1], mimeType: 'image/png' } }
    ];
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { items: { type: Type.ARRAY, items: { type: Type.STRING } } }
        }
      }
    });
    trackGeminiUsage(response, "Phân tích Phối cảnh");
    const result = JSON.parse(response.text || "{}");
    return result.items || [];
  } catch (error) { return []; }
};

// 7. Phân tích Concept Studio (Mới)
export const analyzeStudioConcept = async (productName: string, dimensions: string, images: string[], categoryGuidance?: string): Promise<AIConceptAnalysis> => {
  const ai = createAiClient();
  try {
    const categoryGuidanceBlock = categoryGuidance
      ? `
=== CHỈ DẪN THAM KHẢO CHO DÒNG SẢN PHẨM NÀY ===
Đúc kết từ các ảnh cùng dòng sản phẩm đã được đội ngũ Elmich đánh giá "Rất tốt!" trước đây — đây là xu hướng thẩm mỹ chung được ưa chuộng cho cả dòng sản phẩm, KHÔNG PHẢI một công thức cố định phải chép lại y hệt cho sản phẩm cụ thể đang phân tích. Hãy dùng nó như 1 gợi ý định hướng, nhưng BẮT BUỘC vẫn điều chỉnh chi tiết cụ thể (chất liệu bục, tông màu nền, góc máy...) theo đúng hình khối/màu sắc/chất liệu THẬT của sản phẩm ở Bước 1 bên dưới — hai sản phẩm khác loại trong cùng dòng vẫn phải ra concept khác nhau rõ rệt:
${categoryGuidance}
========================================
`
      : "";

    const prompt = `
=== ĐỌC QUY CHUẨN TRƯỚC KHI THỰC HIỆN (BẮT BUỘC) ===
${designStudioCreative}
========================================
${categoryGuidanceBlock}
Bạn là Giám đốc Sáng tạo Nhiếp ảnh Studio Thương mại của Elmich.
Dựa vào quy chuẩn chụp studio sáng tạo phía trên, hãy phân tích sản phẩm và đề xuất 5 Ý tưởng Studio TOÀN DIỆN (GỒM CẢ BỐI CẢNH + ĐẠO CỤ STUDIO + VỊ TRÍ ĐẶT):
Sản phẩm: "${productName}". Kích thước: ${dimensions}.

BƯỚC 1 — PHÂN TÍCH HÌNH KHỐI, CHẤT LIỆU VÀ MÀU SẮC SẢN PHẨM:
- Quan sát kỹ hình khối đặc trưng của sản phẩm (trụ tròn, khối hộp chữ nhật, tay cầm, vòi, nắp...) để thiết lập hướng chiếu sáng rim light / kickers.
- Xác định chất liệu bề mặt (inox bóng gương, nhôm xước mờ satin, nhựa phủ nhám, thủy tinh trong suốt) để chọn loại tản sáng (diffuser) tương ứng.
- Xác định chính xác tông màu chủ đạo để tính toán màu nền giấy tone-sur-tone liền mạch (seamless paper background).

BƯỚC 2 — ĐỀ XUẤT 5 CONCEPT STUDIO TOÀN DIỆN:
Với MỖI concept trong 5 concept, bạn cung cấp 4 trường thông tin:
1. 'title': Tên concept studio (tiếng Việt ngắn gọn, ví dụ: "Tối giản Hiện đại Tone-sur-tone", "Ánh sáng Kịch tính & Halo Hậu cảnh", "Bục Kiến trúc Đa tầng Tinh tế", "Studio Tinh khiết Softbox Đa điểm", "Nghệ thuật Tương phản Đẳng cấp").
2. 'prompt': Bản mô tả chi tiết bố cục studio, màu nền giấy tone-sur-tone, cách đánh sáng 3-point (Key, Fill, 2 Rim lights, Backlight halo), cấu trúc bóng đổ đa tầng (contact shadow, key shadow).
3. 'props': Danh sách 6-8 đạo cụ studio tối giản ăn khớp hoàn hảo với concept và màu sắc sản phẩm:
   - 1 bục plinth phù hợp (bục đá travertine vân tự nhiên, khối bê tông mài, đĩa gốm mờ, khối gỗ sồi sáng màu, trụ kim loại chải xước, hoặc bục mica trong mờ)
   - 2-3 phụ kiện hoặc nguyên liệu tối giản liên quan đến sản phẩm (ví dụ lát cam khô, vài hạt tiêu, cành lá xanh nhỏ, vải lanh gấp gọn)
   (Mỗi đạo cụ mô tả cụ thể về chất liệu và hình khối).
4. 'placement': Vị trí, góc đặt sản phẩm và góc máy (ví dụ: "Đặt chính giữa bục studio, góc chụp ngang tầm mắt 0-15 độ, ánh sáng viền ôm trọn đường cong").

BẮT BUỘC ĐA DẠNG: 5 concept phải luân phiên chất liệu bục đỡ và sắc thái ánh sáng (dịu nhẹ / tương phản kịch tính / có halo hắt sáng).

Trả về JSON với 5 concepts (mỗi concept gồm title, prompt, props, placement) và suggestedCamera.
`;

    const parts: any[] = [{ text: prompt }];
    images.forEach(img => parts.push({ inlineData: { data: img.split(',')[1], mimeType: 'image/png' } }));

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        temperature: 1.15,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            concepts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  prompt: { type: Type.STRING },
                  props: { type: Type.ARRAY, items: { type: Type.STRING } },
                  placement: { type: Type.STRING }
                },
                required: ["title", "prompt", "props", "placement"]
              }
            },
            suggestedCamera: {
              type: Type.OBJECT,
              properties: {
                angle: { type: Type.NUMBER },
                focalLength: { type: Type.NUMBER },
                aperture: { type: Type.STRING },
                iso: { type: Type.STRING },
                isMacro: { type: Type.BOOLEAN }
              },
              required: ["angle", "focalLength", "aperture", "iso", "isMacro"]
            }
          },
          required: ["concepts", "suggestedCamera"]
        }
      }
    });

    trackGeminiUsage(response, productName || "Phân tích Studio");
    return JSON.parse(response.text || "{}") as AIConceptAnalysis;
  } catch (error: any) {
    if (error.message?.includes("Requested entity was not found")) throw new Error("AUTH_ERROR");
    throw error;
  }
};

export const editProductImage = async (base64Image: string, prompt: string, imageSize: string = '1K', referenceImage?: string | null, sourceSettings?: GenerationSettings, imageModel: 'FLASH' | 'PRO' = 'FLASH'): Promise<string> => {
  const ai = createAiClient();
  
  const mimeTypeMatch = base64Image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!mimeTypeMatch || mimeTypeMatch.length !== 3) {
    throw new Error("Invalid image format");
  }
  
  const mimeType = mimeTypeMatch[1];
  const data = mimeTypeMatch[2];

  const parts: any[] = [
    { inlineData: { data, mimeType } },
    { text: prompt }
  ];

  if (referenceImage) {
    const refMatch = referenceImage.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (refMatch && refMatch.length === 3) {
      parts.push({ inlineData: { data: refMatch[2], mimeType: refMatch[1] } });
    }
  }

  if (isMetaProvider()) {
    const metaImages = [base64Image, ...(referenceImage ? [referenceImage] : [])];
    const rawMeta = await metaEditImage(prompt, metaImages, {});
    let finalImage = await resizeImageToQuality(rawMeta, '2K');
    if (sourceSettings?.visualStyle === "WHITE_BG_RETOUCH") {
      finalImage = await whitenNearWhiteBackground(finalImage);
    }
    return finalImage;
  }

  try {
    let imageConfig: any = {};
    imageConfig.imageSize = imageSize === '4K' ? '2K' : imageSize;

    const fallbackModel = imageModel === 'PRO' ? 'gemini-3-pro-image' : 'gemini-3.1-flash-image';

    const response = await ai.models.generateContent({
      model: fallbackModel,
      contents: { parts },
      config: { imageConfig }
    });

    if (!response.candidates?.[0]?.content?.parts) throw new Error("AI không phản hồi.");
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        trackImagenUsage(fallbackModel, 1, "Chỉnh sửa ảnh", imageSize);
        const base64Data = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        // Đồng bộ với generateProductImage: ảnh gốc WHITE_BG_RETOUCH còn được làm sạch nền.
        const isWhiteBgRetouch = sourceSettings?.visualStyle === "WHITE_BG_RETOUCH";
        let finalImage = await resizeImageToQuality(base64Data, imageSize as '1K' | '2K' | '4K');
        if (isWhiteBgRetouch) {
          finalImage = await whitenNearWhiteBackground(finalImage);
        }
        return finalImage;
      }
    }
    throw new Error("Không có ảnh.");  } catch (error: any) {
    throw error;
  }
};

// Bước cuối: Tạo Prompt và Tạo Ảnh
export const generateProductImage = async (
  settings: GenerationSettings,
  variantSeed: number,
  history?: import('../types').SuccessfulPrompt[],
  categoryGuidance?: string
): Promise<string> => {
  const ai = createAiClient();
  let finalPrompt = "";

  // Gợi ý từ lịch sử cục bộ (trình duyệt hiện tại) — cơ chế cũ, giữ để tương thích ngược
  const localHistoryNote = history && history.length > 0
    ? `
Note: Please align with the style of these previously successful concepts: ${history.map(h => h.imageSettings.concept || h.imageSettings.visualStyle).slice(-3).join(', ')}`
    : "";

  // Chỉ dẫn đúc kết theo dòng sản phẩm (server) — KHÔNG phải trích dẫn prompt
  // gốc, mà là chỉ dẫn ngắn gọn được tổng hợp từ các ảnh đã được đội ngũ
  // Elmich đánh giá "Rất tốt!" cho đúng dòng sản phẩm + phong cách này, xem
  // lib/categoryGuidance.ts::synthesizeCategoryGuidance
  const categoryGuidanceNote = categoryGuidance
    ? `
Chỉ dẫn bổ sung riêng cho dòng sản phẩm này (đúc kết từ các ảnh đã được đội ngũ Elmich duyệt "Rất tốt!" trước đây cho phong cách "${settings.visualStyle}" — áp dụng như định hướng chung, không phải văn mẫu để chép lại):
${categoryGuidance}`
    : "";

  const optimizedHistoryNote = `${localHistoryNote}${categoryGuidanceNote}`;
  
  const formatProps = (props: PropConfig[]) => {
    return props.map(p => {
      let desc = p.name;
      const details = [];
      if (p.size && p.size !== 'auto') details.push(`size: ${p.size}`);
      if (p.position && p.position !== 'auto') details.push(`position: ${p.position}`);
      if (p.rotation && p.rotation !== 'auto') details.push(`rotation: ${p.rotation}`);
      if (details.length > 0) desc += ` (${details.join(', ')})`;
      return desc;
    }).join(", ");
  };

  const formatCameraSettings = (camera: any) => {
    const angleDesc = camera.angle === 0 ? "eye-level shot" :
                      camera.angle > 0 ? `high angle shot (${camera.angle} degrees)` :
                      `low angle shot (${Math.abs(camera.angle)} degrees)`;
                      
    const macroDesc = camera.isMacro ? "macro photography, extreme close-up details" : "standard product framing";
    
    return `Shot on ${camera.focalLength}mm lens, aperture ${camera.aperture}, ISO ${camera.iso}. ${angleDesc}. ${macroDesc}. Professional studio lighting, sharp focus, hyper-detailed, photorealistic.`;
  };
  
  if (settings.visualStyle === "SCENE_STAGING") {
    const matDesc = settings.whiteBGMaterialsDescription || "";
    let materialInstruction = "";
    if (matDesc) {
      materialInstruction = `\nCRITICAL MATERIAL REQUIREMENT: ${matDesc}\nYou must explicitly describe these materials in the generated image, enforcing correct specular highlights, roughness, and physically based rendering (PBR) properties to match this description.`;
    }

    finalPrompt = `
Style Guide Requirements:
${designLifestyleConcept}

Staging professional: Add ${formatProps(settings.props)} into the real scene image following style "${settings.concept}". Keep original furniture.${materialInstruction} Camera & Lighting: ${formatCameraSettings(settings.camera)}. 8k, realistic.`;
    } else if (settings.visualStyle === "TRACING_ASSISTANT") {
    finalPrompt = `Professional vector tracing assistant prompt: 
    Convert this low-quality, blurry, or sketch logo/image into a clean, ultra-sharp 4K graphic suitable for vector tracing.
    Rules: 
    - Maintain the exact shape, proportions, and original concept of the logo/drawing.
    - Output must have completely flat, solid colors (or pure black and white if specified), with crisp and smooth edges.
    - Remove any noise, blur, compression artifacts, gradients, or shadows that would interfere with auto-tracing in Illustrator.
    - ${settings.techDescription ? "User specific requirements: " + settings.techDescription : "Style: clean vector graphic, solid colors, pure white background."}
    - Keep it minimalist and perfectly geometric.`;
  } else if (settings.visualStyle === "TECH_EFFECTS") {
    if (settings.techEffectType === "REMOVE_SIGNATURE") {
      finalPrompt = `Remove watermark/text from this image. Keep high quality, clear, bright.`;
    } else {
      finalPrompt = `
Style Guide Requirements:
${designTechEffects}

Ocean night cinemetic. Product ${settings.productName}. Text "${settings.techTitle}". ${settings.selectedTechConcept}. Neon reflections, Camera: ${formatCameraSettings(settings.camera)}. 8k.`;
    }
  } else if (settings.visualStyle === "PACKAGING_MOCKUP") {
    const prodName = settings.productName || "Elmich Packaging Box";
    const layout = settings.packagingMockupLayout || "SEPARATE_VIEWS";
    const handleType = settings.packagingHandleType || "PLASTIC_CLEAR";
    const substrate = settings.packagingPaperSubstrate || (settings.packagingMaterial === "CARTON_BW" ? "KRAFT_CORRUGATED" : "IVORY_DUPLEX_COATED");

    // 1. Perspective View & Composition determination
    let viewInstruction = "";
    let viewTitle = "";
    if (layout === "DUAL_FRONT_BACK") {
      viewTitle = "DUAL PACKAGING PRESENTATION (BỘ ĐÔI HỘP MẶT TRƯỚC VÀ MẶT SAU TRÊN CÙNG 1 ẢNH NỀN TRẮNG)";
      viewInstruction = `
COMPOSITION: Exactly TWO (2) identical 3D packaging boxes placed side-by-side on an absolute pure white commercial studio floor and backdrop (#FFFFFF).
- Left Box (3/4 Front Perspective): Rotated 30°-35° to prominently present the FRONT PANEL (hero product photo, prominent Elmich logo, model headline), the RIGHT SIDE PANEL receding into perspective, and the TOP LID with the handle.
- Right Box (3/4 Back Perspective): Rotated to prominently present the BACK PANEL (technical specifications table, barcodes, compliance marks, warranty badges), the LEFT SIDE PANEL, and the TOP LID with the handle.
- Visual Balance: Both boxes stand at identical scale and horizon line, parallel with balanced commercial spacing, demonstrating the complete front and back designs in a single unified commercial hero presentation.`;
    } else if (layout === "BACK_ONLY" || (layout === "SEPARATE_VIEWS" && variantSeed === 2)) {
      viewTitle = "BACK PERSPECTIVE 3D MOCKUP (MẶT SAU BAO BÌ - 3/4 REAR PERSPECTIVE)";
      viewInstruction = `
COMPOSITION: A single premium 3D packaging box rotated at a 3/4 rear perspective angle (35-degree horizontal rotation).
- Main Focus: The BACK PANEL is facing directly toward the camera, clearly displaying all technical parameters, specifications table, barcode, QR code, certifications, and compliance text in razor-sharp focus and 100% legibility.
- Visible Faces: Back Panel (primary focus), Side Panel receding into 3-point perspective, and Top Lid visible from an elevated camera angle (25 degrees elevation).
- The front panel is on the far hidden side in this rear perspective view.`;
    } else {
      // Default / FRONT_ONLY / SEPARATE_VIEWS with variantSeed === 1
      viewTitle = "FRONT PERSPECTIVE 3D MOCKUP (MẶT TRƯỚC BAO BÌ - 3/4 FRONT PERSPECTIVE)";
      viewInstruction = `
COMPOSITION: A single premium 3D packaging box rotated at a 3/4 front perspective angle (35-degree horizontal rotation).
- Main Focus: The FRONT PANEL is facing directly toward the camera, prominently displaying the main product photograph, brand logo "Elmich", product name, and main selling badges in razor-sharp focus.
- Visible Faces: Front Panel (primary focus), Right Side Panel receding into 3-point perspective, and Top Lid visible from an elevated camera angle (25 degrees elevation).
- The back panel is on the far hidden side in this front perspective view.`;
    }

    // 2. Plastic Handle Specification (Vietnamese standard)
    let handleInstruction = "";
    if (handleType === "PLASTIC_CLEAR") {
      handleInstruction = `
VIETNAMESE PACKAGING TRANSLUCENT PLASTIC HANDLE (QUAI NHỰA TRONG DẺO BÁN NGUYỆT CHUẨN VIỆT NAM):
- Handle Structure: A flexible, semi-circular curved arch handle (quai xách nhựa dẻo trong suốt) anchored into two standard die-cut rectangular slots positioned symmetrically on the top lid.
- Material Properties: Semi-clear, frosted translucent polyethylene/polypropylene material ('translucent milky-clear flexible molded plastic'). Captures delicate ambient light refraction, subtle white specular rim highlights along the curved ridge, and casts a soft subtle contact micro-shadow directly onto the top lid beneath the arched grip.
- Anchor Clips: Two flat rectangular T-ends or anchor studs securely clipped into the two die-cut slots on the top lid, flush against the cardboard surface.`;
    } else if (handleType === "PLASTIC_OPAQUE") {
      handleInstruction = `
MOLDED SOLID PLASTIC HANDLE:
- Handle Structure: An opaque white or Elmich brand-color molded plastic handle anchored into two rectangular slots on the top lid with clean mechanical finish and soft grip contours.`;
    } else if (handleType === "ROPE_RIBBON") {
      handleInstruction = `
PREMIUM WOVEN CORD HANDLE:
- Handle Structure: Braided textile cord handle with knotted ends inserted securely through top die-cut eyelets.`;
    } else {
      handleInstruction = `
STANDARD FOLDING LID WITHOUT HANDLE:
- Handle Structure: Clean standard folding box lid with flush seamless flaps, without any plastic handle.`;
    }

    // 3. Substrate & Paper Texture
    let substrateInstruction = "";
    if (substrate === "KRAFT_CORRUGATED") {
      substrateInstruction = `
PAPERBOARD SUBSTRATE: Industrial Kraft Corrugated Cardboard box (Thùng carton nâu xi măng nhám).
- Texture: Natural raw fibrous kraft paper texture with micro-fibers, crease lines showing exposed light-brown cardboard pulp inside folded seams. Printing: matte ink absorption, visible fluting micro-ridges.`;
    } else if (substrate === "MATTE_ART_PAPER") {
      substrateInstruction = `
PAPERBOARD SUBSTRATE: Premium Matte Art Paperboard (Giấy mỹ thuật phủ mờ cao cấp).
- Texture: Non-reflective velvety matte coating with deep color saturation and razor-sharp typographic edges.`;
    } else {
      substrateInstruction = `
PAPERBOARD SUBSTRATE: Premium Coated Ivory / Duplex Paperboard laminated over E-flute corrugated cardboard (Hộp bồi sóng E / Ivory bóng mịn chuẩn gia dụng Elmich).
- Texture: Smooth coated finish with elegant satin luster on thick multi-layer paperboard. Crisp folded edges showing realistic paperboard thickness (1.2mm - 1.5mm micro-radiused crease), catching clean, crisp studio softbox specular highlights along folded boundaries. Vibrant, rich corporate color reproduction.`;
    }

    // 4. Dieline Analysis & Cropped Face Details (if provided)
    let dielineContext = "";
    if (settings.dielineAnalysis) {
      dielineContext = `
RECOGNIZED DIELINE STRUCTURE & FOLDING MAPPING:
- Box Type: ${settings.dielineAnalysis.boxType || 'Standard Household Box'}
- Front Panel Content: ${settings.dielineAnalysis.frontPanelDescription || 'Hero product photo, Elmich branding, main model headline'}
- Back Panel Content: ${settings.dielineAnalysis.backPanelDescription || 'Detailed specifications table, barcode, QR code, legal marks'}
- Side Panels Content: ${settings.dielineAnalysis.sidePanelsDescription || 'Brand features, icons, bullet points'}
- Top Lid Content: ${settings.dielineAnalysis.topPanelDescription || 'Top lid flap with handle slots'}
- Folding Guidance: ${settings.dielineAnalysis.foldingGuidance || 'Fold strictly along all 4 vertical creases creating square box form'}
`;
    }

    let faceImagesContext = "";
    const hasCroppedFaces = !!(settings.packagingFaces.front || settings.packagingFaces.back);
    if (hasCroppedFaces) {
      faceImagesContext = `
EXPLICIT MAPPED 5-PANEL GRAPHIC INPUTS (CROPPED DIRECTLY ACCORDING TO PHYSICAL PROPORTIONS):
The attached input images contain the exact pre-cropped panels corresponding to the physical faces of the box:
- Image 1: The master 2D flat unfolded dieline layout reference.
- Subsequent Images: High-resolution crops of the Front, Back, Left, Right, and Top Lid panels.
Apply these exact pre-aligned graphics directly onto each respective surface of the 3D box model with 100% typographic and visual fidelity without distortion or mirroring.
`;
    }

    // 5. Overall prompt composition
    finalPrompt = `
Style Guide Requirements:
${designPackagingMockup}

3D PACKAGING MOCKUP RECONSTRUCTION & RENDERING TASK:
Product / Project Name: "${prodName}"
Target View: ${viewTitle}

Your mission is to reconstruct an ultra-photorealistic, high-end commercial 3D packaging mockup from the provided 2D flat unfolded dieline layout image (Image 1).

${viewInstruction}

${handleInstruction}

${substrateInstruction}

${dielineContext}

${faceImagesContext}

CRITICAL PACKAGING FOLDING & GRAPHIC FIDELITY RULES:
1. Precision 3D Folding: Accurately map the corresponding graphic artwork from the flat 2D layout (Image 1) onto each 3D box face (Front, Back, Sides, Top Lid).
2. Orientation of Top Lid: Any text, logos, or markings on the Top Lid MUST be oriented correctly upright and readable from the camera's perspective—never rendered upside down or mirrored.
3. Seams, Flaps, and Creases: The paper seams where flaps lock together must be visibly modeled with realistic paperboard thickness. Folds must show natural crease lines (softly rounded edge highlights) reflecting studio softbox light.
4. Typography & Artwork Fidelity: 100% fidelity to the source design. Logos ("Elmich"), typography, icons, specifications table, and barcodes must remain crisp, legible, and uncorrupted (no AI hallucination text or blurry artifacts).
5. Grounding & Studio Environment:
   - Environment: Strictly pure seamless white commercial studio backdrop (#FFFFFF). Zero colored tints or gray gradients.
   - Grounding: Crisp, dark contact drop shadows directly beneath the box edges, softly diffusing outward into pure white (#FFFFFF). The box MUST be firmly grounded on the studio floor, never floating.
   - Lighting: Commercial 3-point softbox studio lighting, perfectly balanced exposure, subtle specular highlights along box edges.

Output style: Premium commercial packaging mockup, hyper-detailed rendering, photorealistic 8k.
`;
  } else if (settings.visualStyle === "3D_TO_REAL_WHITE_BG") {
    const productName = settings.productName || "Product";
    const matDesc = settings.whiteBGMaterialsDescription || "";
    
    let stylePrompt = `Photorealistic commercial studio photography of ${productName}, transforming a 3D render into a hyper-realistic physical object.
- **Material properties:** ${matDesc || "Highly realistic materials, microscopic details, and authentic surface imperfections"}. Micro-textures applied to eliminate CGI look.
- **Environment:** Seamless pure white background (#FFFFFF).
- **Grounding:** Soft, realistic contact shadow under the product base.
- **Lighting & Camera:** High-key commercial studio lighting, large softbox, shot on 85mm lens, f/8, ultra-detailed, 8k.
${settings.whiteBGPriorityAdjustments ? `- **Priority user adjustments:** ${settings.whiteBGPriorityAdjustments}` : ""}
`;

    finalPrompt = `
Style Guide Requirements:
${render3DToPhoto}

${stylePrompt}

CRITICAL: Keep the exact shape and perspective of the original image. Only upgrade the realism, lighting, and material shaders.
DO NOT CROP THE PRODUCT: The entire product MUST remain 100% fully visible inside the frame.
    `;
  } else if (settings.visualStyle === "WHITE_BG_RETOUCH") {
    let stylePrompt = "";
    const productName = settings.productName || "Product";
    const selectedCats = settings.whiteBGSelectedCategories || [];
    const matDesc = settings.whiteBGMaterialsDescription || "";

    let materialDirectives = "";
    if (selectedCats.includes("METAL")) {
      materialDirectives += `
- Metallic Parts (Kim loại): STRICT PRESERVATION of the exact original metal type, color, and finish (polished chrome, brushed stainless steel, or aluminum) — do NOT invent a different finish. Fresnel Physics: strong, bright specular reflections along high-curvature profile edges, fading to soft diffuse values on surfaces perpendicular to the camera. Structured Specular Highlights: cylindrical bodies must show sharp, vertical longitudinal reflections that outline the 3D form. If brushed, preserve smooth anisotropic brush-line reflections. Ensure the metallic finish is perfectly uniform, clean, flawless, and pristine.`;
    }
    if (selectedCats.includes("PLASTIC")) {
      materialDirectives += `
- Plastic/Polymer Parts (Nhựa): Auto-detect plastic parts and keep their exact original color and finish (matte or gloss) — do NOT change matte to gloss or vice versa. Render perfectly clean, uniform surfaces. Do not bleed metallic highlights or chrome sheen onto plastic housings. Apply subtle subsurface scattering (<0.2mm light penetration) so the plastic reads as solid, food-safe-grade material with real thickness, not a thin paper-mache shell. Completely clean, uniform, smooth, and pristine.`;
    }
    if (selectedCats.includes("GLASS")) {
      materialDirectives += `
- Glass/Transparent Parts (Thủy tinh): Preserve exact original glass shape and thickness. Refraction Index (IOR) ≈ 1.5 for borosilicate glass — internal walls/contents must remain visible through the glass, with slight chromatic aberration at edges to simulate professional camera optics. Use subtle dark-field rim lighting (thin dark edge outline) so the transparent silhouette never dissolves into the pure white #FFFFFF background. Keep the glass entirely clean, uniform, and crystal clear.`;
    }
    if (selectedCats.includes("CERAMIC")) {
      materialDirectives += `
- Ceramic/Coated Parts (Gốm sứ/Chống dính): Render a perfectly smooth, flawless, and uniform glossy glaze or clean non-stick coating, keeping the exact original color. Ensure a pristine, homogeneous finish with soft, diffused light absorption, completely smooth, uniform, flawless, and pristine.`;
    }
    if (materialDirectives === "") {
      materialDirectives = "\n- Standard materials: Clean, realistic studio texture preservation, completely clean and pristine.";
    }

    stylePrompt = `High-detail, professional commercial studio product photography of the product "${productName}", meticulously isolated on a pure, solid white background (#FFFFFF).
    
MATERIAL SEPARATION & PROPERTY DIRECTIVES:
The product contains the following material compositions: [${selectedCats.join(', ')}].
${materialDirectives}

USER MATERIAL LOCATION & DETAIL DESCRIPTION:
"${matDesc || "Automated multi-material detection based on the input photograph."}"
-> Use this specific material mapping to assign glossiness, metalness, transparency, or roughness to different parts of the product. Keep original contours and text.

${settings.whiteBGPriorityAdjustments ? `PRIORITY USER ADJUSTMENTS (MUST APPLY / ƯU TIÊN SỐ 1):
"${settings.whiteBGPriorityAdjustments}"
-> You MUST execute these specific aesthetic and lighting adjustments exactly as described by the user.` : ""}

LIGHTING & STUDIO PRESENTATION:
- Light Source: Professional three-point studio lighting with high-end key and fill lights, displaying pristine product shape and beautiful gradients.
- Grounding: A very delicate, clean, and tight contact shadow must sit precisely underneath the base contact points. No floating, no artificial halo.
- Quality: Superb clarity, high contrast, clean noise-free colors, commercial catalog style, photorealistic.`;

    finalPrompt = `
Style Guide Requirements:
${designWhiteBGRetouch}

${stylePrompt}
 
STRICT PRESERVATION (MANDATORY): Keep the exact original product — no change in shape, angle, color, material composition, or texture pattern. Do NOT duplicate or add any object. Do NOT change composition or camera perspective. Absolutely do not change the original camera angle, perspective, shape, or texture/structure of the product. The product itself must remain exactly as it appears in the reference image.
DO NOT CROP THE PRODUCT: The entire product MUST remain 100% fully visible inside the frame. Do NOT cut off any edges, handles, lids, or parts of the product. If the requested aspect ratio is different from the original image, you MUST pad the extra space with the pure white background. The product should be centered and completely contained within the image boundaries without any cropping.

BACKGROUND SANITIZATION (MANDATORY & MAXIMUM PRIORITY / YÊU CẦU BẮT BUỘC):
- WIPE OUT THE OLD BACKGROUND: You must completely remove, erase, and replace 100% of the original background, old room environment, countertop, floor, walls, and reflections from the input image.
- Flawless, PURE #FFFFFF SOLID WHITE STUDIO BACKGROUND.
- The background is completely blank, plain, clean, pristine, and 100% empty white digital canvas from edge to edge.
- Every single background pixel at the top, bottom, left, right borders, and corners must be absolute, seamless flat pure white (#FFFFFF) (RGB: 255, 255, 255).
- ABSOLUTELY NO other objects, NO vertical pillars, NO vertical stripes, NO grey patches, NO shadows from the room, and NO environmental reflections are allowed to leak into the background.
- ABSOLUTELY NO gray areas, NO vignetting, NO gradients, NO shading, NO noise, NO dust, NO specks, NO spots, and NO dirty smudges are allowed anywhere in the image.
- NỀN TRẮNG PHẢI SẠCH TUYỆT ĐỐI: Bạn phải LOẠI BỎ HOÀN TOÀN phông nền cũ và thay thế bằng màu trắng tinh khiết hoàn hảo (#FFFFFF). Không được có bóng xám dơ, không có cột đứng, không có vết bẩn, không có hạt nhiễu (noise), không có hiệu ứng tối góc (vignette), không có chuyển màu (gradient). Toàn bộ vùng nền xung quanh sản phẩm phải là màu trắng tinh khiết hoàn hảo #FFFFFF từ tâm ra đến tận rìa và bốn góc ảnh.
- VERY TIGHT GROUND SHADOW ONLY: The only shadow allowed is a very tight, clean, localized contact shadow (ambient occlusion) directly beneath the physical touchpoints of the product. It must be extremely minimal and must rapidly fade to absolute pure white (#FFFFFF) within a few millimeters.
- KHÔNG CÓ BÓNG ĐỔ RỘNG: Tuyệt đối không vẽ bóng đổ lan rộng ra nền nhà, không tạo bóng mờ xám to làm bẩn nền. Bóng đổ phải cực kỳ gọn, nhỏ, sắc nét và ôm sát ngay dưới chân đế của sản phẩm rồi tan biến hoàn toàn vào nền trắng tinh #FFFFFF.

All product logos, text, and original product colors are strictly maintained exactly as they are in the original design.
Additional Instructions: ${settings.concept || 'None'}
Camera Setup: ${formatCameraSettings(settings.camera)}`;
  } else if (settings.visualStyle === "LINE_ART") {
    finalPrompt = `
Style Guide Requirements:
${designLineArt}

A minimalist, clean line art illustration of the product. Pure white background, solid black outlines. Simple netline style, architectural drawing, blueprint style but black on white. 

Strict preservation (VERY IMPORTANT): 
keep the product's exact shape, proportions, and perspective exactly as original.
do NOT change the camera angle or perspective.
do NOT change shape, structure, proportions.

Style constraints:
No shading, no shadows, no gradients, no colors, no 3D realistic effects, no textures. 
Only crisp, continuous, and precise black lines defining the outer shape and essential inner contours of the product. 
Flat 2D vector style. High clarity, simple schematic outline.

BACKGROUND SANITIZATION (MANDATORY): The background must be 100% flat, solid, pure, clean, and seamless white (#FFFFFF) from edge to edge. The background is completely plain, blank, empty, and uniform. All pixels from center to borders and corners are perfectly solid white.
    `;
  } else if (settings.visualStyle === "COLOR_CHANGE") {
    const changes = settings.colorChanges.map((c, i) => {
      let changeStr = `[RECOLOR TARGET ${i + 1}] Part / Area: "${c.partName}"`;
      if (c.region) {
        changeStr += `\n  - Spatial Bounding Region on Image 1: Bounding Box from Left: ${c.region.x}%, Top: ${c.region.y}% to Right: ${Math.round(c.region.x + c.region.width)}%, Bottom: ${Math.round(c.region.y + c.region.height)}% (Width: ${c.region.width}%, Height: ${c.region.height}%). Confine recoloring strictly within this spatial area.`;
      } else if (c.pin) {
        changeStr += `\n  - Spatial Pin Location on Image 1: Coordinates at approximately ${c.pin.x}% horizontally (X) and ${c.pin.y}% vertically (Y) from top-left.`;
      }
      if (c.targetRgb) {
        changeStr += `\n  - Exact Target Color: sRGB(${c.targetRgb.r}, ${c.targetRgb.g}, ${c.targetRgb.b}) / HEX ${c.targetHex || ''}`;
      } else if (c.targetHex) {
        changeStr += `\n  - Exact Target Color: HEX ${c.targetHex}`;
      } else if (c.pantoneCode) {
        changeStr += `\n  - Target Pantone Color: "${c.pantoneCode}"`;
      }
      if (c.finish) {
        const finishMap: Record<string, string> = {
          MATTE: 'Matte non-glossy fine-powder coating with uniform diffuse reflection and subtle micro-texture',
          GLOSSY: 'High-gloss lacquer finish with crisp specular reflections and clear-coat luster',
          METALLIC: 'Metallic pearlescent coat with microscopic metallic flecks and subtle directional sheen',
          SATIN: 'Smooth semi-matte satin luster with soft velvety light dissipation',
          INOX_POLISHED: 'Mirror-polished food-grade 304 stainless steel (Inox bóng gương / Chrome) with ultra-high reflectivity, crystal-clear specular highlights, razor-sharp metallic luster, and clean studio reflections without distortion',
          INOX_BRUSHED: 'Brushed food-grade 304 stainless steel with ultra-fine longitudinal brushed satin grain, subtle anisotropic metallic sheen, and authentic soft highlight dissipation'
        };
        changeStr += `\n  - Surface Finish: ${finishMap[c.finish] || c.finish}`;
      }
      if (c.description) {
        changeStr += `\n  - Area Boundaries & Specific Details: "${c.description}"`;
      }
      if (c.sampleImage) {
        changeStr += `\n  - Auxiliary Color Swatch: Reference color in attached sample image.`;
      }
      return changeStr;
    }).join('\n\n');

    finalPrompt = `
Style Guide Requirements:
${designColorEditing}

Product Selective Recoloring & Surface Finish Task:
Product Name: "${settings.productName || 'Elmich Household Product'}"

Your task is to recolor the specified targeted sections of the product in Image 1 according to exact RGB color codes and spatial coordinates, while rendering the product on a spotless pure white studio background with 100% complete product framing.

INPUT IMAGE DEFINITION:
- Image 1: The BASE / ORIGINAL product image. You MUST edit this exact product in place.
- All non-recolored components (e.g. brushed stainless steel Inox 304 trims, chrome rims, transparent glass parts, silicone seals, digital LED displays, and Elmich brand logos) MUST remain completely unchanged and pristine.

SPECIFIC RECOLORING INSTRUCTIONS:
${changes || "- Recolor the main product body with designated premium color, keeping accents intact."}

CRITICAL EXECUTION CONSTRAINTS:
1. Exact Color Fidelity: Render the exact target sRGB color specified without tint shift, desaturation, or over-saturation.
2. Geometry & Outline Preservation: Zero shape warping, zero silhouette distortion. Every edge, bevel, seam, and screw must align 100% with Image 1.
3. Texture & Highlight Preservation (Luma Integrity): Retain the realistic highlights, natural shadows, reflections, and ambient occlusion from Image 1. When applying Inox polished finish, render authentic chrome-like specular gleam and mirror clarity.
4. Color Bleed: Realistic soft color bounce (color bleed) on adjacent stainless steel and ground reflections.

BACKGROUND & ENVIRONMENT (STRICT MANDATORY):
- Seamless Pure White Studio Background (#FFFFFF): The product MUST be isolated on a 100% solid, pure, clean, spotless seamless white backdrop (#FFFFFF) from corner to corner. No room scenery, no kitchen background, no clutter, no gradient tint.
- Natural Soft Contact Shadow: Realistic soft dark-gray contact ambient occlusion drop shadow directly grounded beneath the product base/feet onto the pure white floor, ensuring the product is firmly seated and not floating.

FRAMING & COMPLETE PRODUCT VIEW (ZERO CROPPING - STRICT MANDATORY):
- 100% Full Product View: The generated output MUST show the entire complete product in frame. All parts (top lid, handle, steam knob, spout, side handles, buttons, digital display, base, and rubber feet) must be 100% fully visible.
- Zero Cutoff / No Cropping: Absolutely NO cutting off of any product edge, handle, or base.
- Generous Safe Margins: Maintain a comfortable 15% to 20% white space padding margin between the outer boundaries of the product and all 4 edges of the frame. Strictly avoid tight cropping or aggressive zoom-in.

Output style: Premium commercial catalog product photography, hyper-detailed, 8k resolution, photorealistic.
`;
  } else if (settings.visualStyle === "CONCEPT" || settings.visualStyle === "TECH_PS" || settings.visualStyle === "STUDIO") {
    
    let spaceInstruction = "";
    if (settings.emptySpacePosition && settings.emptySpacePosition.length > 0 && !settings.emptySpacePosition.includes('NONE' as any)) {
      const positions = settings.emptySpacePosition.map((p: any) => {
        if (p === 'TOP') return 'top (upper part)';
        if (p === 'BOTTOM') return 'bottom (lower part)';
        if (p === 'LEFT') return 'left side';
        if (p === 'RIGHT') return 'right side';
        return p;
      }).join(' and ');
      spaceInstruction = `Leave clear, unobstructed empty negative space on the ${positions} of the image for adding text/logos later.`;
    } else {
      spaceInstruction = "Center the subject normally.";
    }

    const isStudio = settings.visualStyle === "STUDIO";
    const mode = isStudio ? "minimalist high-end studio product shot" : "high-end commercial product photography shot";
    const propDetails = settings.props && settings.props.length > 0 ? settings.props.map(p => `${p.name}${p.amount ? ' (' + p.amount + ')' : ''}`).join(', ') : 'None';
    const placementDetails = settings.placement || "Centered";
    const cameraDetails = `${settings.camera?.angle || 'Front'}, ${settings.camera?.isMacro ? 'Macro Lens' : 'Standard Lens'}`;

    let selectedStyleGuide = "";
    if (settings.visualStyle === "CONCEPT") {
      selectedStyleGuide = designLifestyleConcept;
    } else if (settings.visualStyle === "STUDIO") {
      selectedStyleGuide = designStudioCreative;
    } else if (settings.visualStyle === "TECH_PS") {
      selectedStyleGuide = designTechEffects;
    }

    const matDesc = settings.whiteBGMaterialsDescription || "";
    let materialInstruction = "";
    if (matDesc) {
      materialInstruction = `
      CRITICAL MATERIAL REQUIREMENT: ${matDesc}
      You must explicitly describe these materials in the generated prompt, enforcing correct specular highlights, roughness, and physically based rendering (PBR) properties to match this description.`;
    }

    const thinkingPrompt = `
      Act as Elmich's Head of Creative, a senior commercial product photographer and expert prompt engineer. You must read and strictly adhere to the following three master styling manuals of Elmich AI Image Studio to write the absolute best prompt:
      
      === MASTER MANUAL 1: LIFESTYLE CONCEPT (BỐ CẢNH ĐỜI SỐNG ANH/CHỊ ĐÒI HỎI) ===
      ${designLifestyleConcept}
      
      === MASTER MANUAL 2: CREATIVE STUDIO PRO (CHỤP TRONG STUDIO/PHÔNG NỀN TRƠN) ===
      ${designStudioCreative}
      
      === MASTER MANUAL 3: TECH EFFECTS & VISUALS (HIỆU ỨNG CÔNG NGHỆ LOOPS VÀ PHYSICS) ===
      ${designTechEffects}
      
      =============================================================================

      Generate a highly detailed, descriptive, and professional image generation prompt (in English) for a ${mode}.
      Please apply the specific rules of the current selected style: "${settings.visualStyle}" (Main guide: ${settings.visualStyle === "CONCEPT" ? "LIFESTYLE" : settings.visualStyle === "STUDIO" ? "STUDIO" : "TECH EFFECTS"}), but cross-reference elements from the other manuals to guarantee absolute quality (e.g., maintain the premium material reflections, pristine geometry, absolute verticality, correct light bleed, and avoiding chaotic Sci-Fi graphics at all costs).
      
      Product: ${settings.productName}
      Creative Concept/Theme: ${settings.concept}
      Placement and Proportion: ${placementDetails}
      Props to include: ${propDetails}
      ${isStudio ? "Background: Plain paper background that is EXACTLY the same color as the product's primary color (tone-on-tone monochromatic look)." : ""}
      Empty Space Requirement: ${spaceInstruction}
      Composition: The product and props must be neatly arranged and fit entirely within the frame.
      Camera & Lighting Setup: ${cameraDetails}${materialInstruction}
      
      CORE PHOTOGRAPHY AND DESIGN PRINCIPLES (STRICTLY ENFORCE):
      1. Strict Geometry Preservation (Geometry Control Protocol): 
         - Axis Alignment: "Maintain absolute verticality for all cylindrical products. Ensure the base and lid are perfectly parallel to the horizon."
         - Logo Integrity: "Apply logo as a precise vector-based decal. No warping or distortion on curved surfaces. Center properly."
         - Scale Reference: "Scale 1:1 relative to standard environment. Ensure handle-to-body proportion follows engineering standards."
      2. PBR (Physically Based Rendering & Advanced Micro-surface Optics): 
         - Metal (Inox/Aluminum): "Use Anisotropic reflection with a blurriness factor of 0.05. Highlights must trace the contour of the object, not bloom uncontrollably." Apply Fresnel reflections.
         - Plastic: "Apply Micro-bump texture at 5% intensity to mimic high-grade food-safe plastic. Subtle Fresnel effect at the edges to show material thickness."
         - Glass: "Set Refraction Index (IOR) to 1.5. Ensure the internal walls of the container are visible through the glass, with slight chromatic aberration at the edges to simulate professional camera optics."
         - Ceramic/Stone: Grazing 45-degree light for micro-displacement/pores.
      3. Shadow Structure: Must include contact shadows (stark black at the base), soft gradient key shadows, and feathered extrusion shadows for handles.
      4. Lighting System: 3-Point Lighting System (Key Light, Fill Light, Rim Light).
      
      ASPECT RATIO SPECIFIC COMPOSITION DIRECTIVES:
      - Current Aspect Ratio: ${settings.aspectRatio}
      - For extremely wide aspect ratios (such as '4:1' or '16:9'), do NOT center a single tiny product in an empty void. Instead, design a breathtaking wide panoramic landscape/tabletop composition. Describe how the countertop, stone slabs, paper backdrop, or floor continuously extend horizontally from left to right across the ultra-wide frame. Place the main product strictly once, ideally offset to the left or right third (rule of thirds), and let the gorgeous ambient scenery or soft matching props (such as scattered ingredients, plants, glassware) flow elegantly along the horizontal axis, forming beautiful negative space.
      - For extremely tall aspect ratios (such as '1:4' or '9:16'), design a vertical cascading composition where elements stack elegantly vertically.
      
      STRICT AVOIDANCE (NEGATIVE PROMPT EQUIVS):
      - NO DUPLICATION: Under no circumstances should there be multiple copies, ghost shapes, blurred visual echoes, double images, or floating duplicate pieces of the main product. The main product must appear exactly ONCE in the entire image.
      - Avoid distorted logos, skewed geometry, non-functional hinges, floating parts.
      - Avoid over-saturated colors, unrealistic bloom, plastic-looking metal, blurry reflections.
      - Avoid inconsistent shadow direction, multiple light sources causing conflicting shadows.
      - Avoid low-resolution textures, pixelated edges on text/branding.
      
      Instructions for the prompt:
      - Describe the product's placement (MANDATORY: you must explicitly describe placing the product as described in "${placementDetails}"), lighting, shadows, and reflections in vivid technical detail based on the core principles.
      - Describe the background and environment based on the concept and color palette rules. Make sure the props (${propDetails}) are present.
      - ${isStudio ? "Ensure minimalist, clean, extremely neat layout." : "Follow the rule of thirds for composition. Use an elegant, harmonious color palette."}
      - Ensure the prompt emphasizes photorealism, 8k resolution, and high-end commercial aesthetic.
      - ONLY output the final prompt text (in English), no explanations.
    `;

    // Bước suy luận viết prompt: chạy qua createAiClient() nên tự đi theo
    // nhà cung cấp đang chọn — Gemini (gemini-2.5-pro) hoặc Meta (Muse Spark
    // qua MetaAdapter). Riêng phần VẼ ảnh sau đó mới rẽ sang endpoint images.
    const thinkingResponse = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: thinkingPrompt
    });
    trackGeminiUsage(thinkingResponse, "Suy luận Prompt ảnh", "gemini-2.5-pro");
    finalPrompt = thinkingResponse.text || "";
  } else if (settings.visualStyle === "TRACK_SOCKET_STAGING") {
    const socketDetails = settings.sockets?.map((s, idx) => {
      let detail = `- Loại ổ cắm ${idx + 1}: Số lượng ${s.quantity}`;
      if (s.applianceNote) detail += `, dùng cho: ${s.applianceNote}`;
      return detail;
    }).join('\n      ') || '';

    if (settings.trackSocketMode === 'REFERENCE') {
      finalPrompt = `
        Hình ảnh trực quan sản phẩm: Gắn các ổ cắm được cung cấp lên thanh ray.
        Thanh ray được gắn cố định trên tường.
        Các ổ cắm là các thành phần mô-đun có thể di chuyển dọc theo thanh ray và xoay để khóa/mở khóa.
        
        Cấu hình ổ cắm:
        ${socketDetails}
        
        Bối cảnh: Tái tạo lại chính xác bối cảnh, phong cách, ánh sáng và không gian từ ảnh mẫu (reference image) được cung cấp.
        
        HƯỚNG DẪN QUAN TRỌNG:
        1. Giữ nguyên thiết kế nội thất, màu sắc và bố cục của ảnh mẫu.
        2. Thêm hệ thống thanh ray và ổ cắm vào vị trí hợp lý trên tường trong ảnh mẫu.
        3. Đặt chính xác số lượng ổ cắm đã chỉ định lên thanh ray.
        4. Ít nhất một ổ cắm PHẢI có thiết bị cắm vào.
        5. Nếu ổ cắm có ghi chú "dùng cho", hãy hiển thị thiết bị đó đang được cắm vào.
        6. Hệ thống thanh ray và ổ cắm phải hòa hợp hoàn hảo với môi trường của ảnh mẫu.
        
        Phong cách nhiếp ảnh kiến trúc chuyên nghiệp, 8k, siêu thực, ánh sáng và bóng đổ hoàn hảo.
        Thông số máy ảnh: ${formatCameraSettings(settings.camera)}
      `;
    } else {
      finalPrompt = `
        Hình ảnh trực quan sản phẩm: Gắn các ổ cắm được cung cấp lên thanh ray.
        Thanh ray được gắn cố định trên tường, ưu tiên các vị trí lắp đặt cố định.
        Các ổ cắm là các thành phần mô-đun có thể di chuyển dọc theo thanh ray và xoay để khóa/mở khóa.
        
        Cấu hình ổ cắm:
        ${socketDetails}
        
        Bối cảnh: ${settings.location}. 
        Chi tiết môi trường: ${settings.concept || 'Nội thất hiện đại, sạch sẽ'}.
        
        HƯỚNG DẪN QUAN TRỌNG:
        1. Thanh ray phải được gắn trên tường hoặc bề mặt cố định phù hợp với bối cảnh.
        2. Đặt chính xác số lượng ổ cắm đã chỉ định lên thanh ray.
        3. Ít nhất một ổ cắm PHẢI có thiết bị cắm vào.
        4. Nếu ổ cắm có ghi chú "dùng cho", hãy hiển thị thiết bị đó đang được cắm vào.
        5. Hệ thống thanh ray và ổ cắm phải hòa hợp hoàn hảo với môi trường ${settings.location}.
        
        Phong cách nhiếp ảnh kiến trúc chuyên nghiệp, 8k, siêu thực, ánh sáng và bóng đổ hoàn hảo.
        Thông số máy ảnh: ${formatCameraSettings(settings.camera)}
      `;
    }
  }

  if (optimizedHistoryNote) {
    finalPrompt += optimizedHistoryNote;
  }

  const parts: any[] = [{ text: finalPrompt }];
  
  if (settings.visualStyle === "SCENE_STAGING") {
    if (settings.productImages[0]) {
      const paddedImg = await padImageToAspectRatio(settings.productImages[0], settings.aspectRatio || "1:1", "#FFFFFF");
      parts.push({ inlineData: { data: paddedImg.split(',')[1], mimeType: 'image/png' } });
    }
    if (settings.referenceImage) {
      const paddedRef = await padImageToAspectRatio(settings.referenceImage, settings.aspectRatio || "1:1", "#FFFFFF");
      parts.push({ inlineData: { data: paddedRef.split(',')[1], mimeType: 'image/png' } });
    }
  } else if (settings.visualStyle === "TRACK_SOCKET_STAGING") {
    if (settings.trackImage) parts.push({ inlineData: { data: settings.trackImage.split(',')[1], mimeType: 'image/png' } });
    settings.sockets?.forEach(s => {
      if (s.image) parts.push({ inlineData: { data: s.image.split(',')[1], mimeType: 'image/png' } });
    });
    if (settings.trackSocketMode === 'REFERENCE' && settings.referenceImage) {
      parts.push({ inlineData: { data: settings.referenceImage.split(',')[1], mimeType: 'image/png' } });
    }
  } else if (settings.visualStyle === "COLOR_CHANGE") {
    if (settings.productImages[0]) {
      const paddedImg = await padImageToAspectRatio(settings.productImages[0], settings.aspectRatio || "1:1", "#FFFFFF");
      parts.push({ inlineData: { data: paddedImg.split(',')[1], mimeType: 'image/png' } });
    }
    settings.colorChanges.forEach(c => {
      if (c.sampleImage) parts.push({ inlineData: { data: c.sampleImage.split(',')[1], mimeType: 'image/png' } });
    });
  } else if (settings.visualStyle === "PACKAGING_MOCKUP") {
    if (settings.packagingFaces.flat) {
      parts.push({ inlineData: { data: settings.packagingFaces.flat.split(',')[1], mimeType: 'image/png' } });
    }
    // Also attach cropped individual faces if available for 100% precision
    const faceKeys: (keyof typeof settings.packagingFaces)[] = ['front', 'back', 'left', 'right', 'top'];
    faceKeys.forEach(k => {
      const faceImg = settings.packagingFaces[k];
      if (faceImg && faceImg.startsWith('data:')) {
        parts.push({ inlineData: { data: faceImg.split(',')[1], mimeType: 'image/png' } });
      }
    });
  } else if (settings.referenceImage && (settings.visualStyle === "TRACING_ASSISTANT" || settings.visualStyle === "TECH_EFFECTS" || settings.visualStyle === "WHITE_BG_RETOUCH" || settings.visualStyle === "3D_TO_REAL_WHITE_BG" || settings.visualStyle === "CONCEPT" || settings.visualStyle === "LINE_ART")) {
    let finalRefImage = settings.referenceImage;
    if (settings.visualStyle === "TRACING_ASSISTANT" || settings.visualStyle === "WHITE_BG_RETOUCH" || settings.visualStyle === "3D_TO_REAL_WHITE_BG" || settings.visualStyle === "LINE_ART" || settings.visualStyle === "TECH_EFFECTS") {
      finalRefImage = await padImageToAspectRatio(finalRefImage, settings.aspectRatio || "1:1", "#FFFFFF");
    }
    parts.push({ inlineData: { data: finalRefImage.split(',')[1], mimeType: 'image/png' } });
  }
  
  const productImagesVisualStyles = ["CONCEPT", "TECH_PS", "STUDIO"];
  if (settings.productImages.length > 0 && productImagesVisualStyles.includes(settings.visualStyle)) {
    for (const img of settings.productImages) {
      let finalImg = img;
      finalImg = await padImageToAspectRatio(finalImg, settings.aspectRatio || "1:1", "#FFFFFF");
      parts.push({ inlineData: { data: finalImg.split(',')[1], mimeType: 'image/png' } });
    }
  }

  try {
    if (isMetaProvider()) {
      const metaImages = parts
        .filter((p: any) => p.inlineData)
        .map((p: any) => `data:${p.inlineData.mimeType};base64,${p.inlineData.data}`);
      const rawMeta = metaImages.length > 0
        ? await metaEditImage(finalPrompt, metaImages, { aspectRatio: settings.aspectRatio })
        : await metaGenerateImage(finalPrompt, { aspectRatio: settings.aspectRatio });
      let finalImage = await resizeImageToQuality(rawMeta, '2K');
      if (settings.visualStyle === "WHITE_BG_RETOUCH") {
        finalImage = await whitenNearWhiteBackground(finalImage);
      }
      return finalImage;
    }

    const modelName = settings.imageModel === 'PRO' ? 'gemini-3-pro-image' : 'gemini-3.1-flash-image';
    let imageConfig: any = { aspectRatio: settings.aspectRatio };

    // imageSize handling (API supports native 1K, 2K but we upscale to 4K manually if requested)
    imageConfig.imageSize = settings.imageSize === '4K' ? '2K' : settings.imageSize;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: { imageConfig }
    });
    if (!response.candidates?.[0]?.content?.parts) throw new Error("AI không phản hồi.");
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        trackImagenUsage(modelName, 1, `Tạo ảnh: ${settings.visualStyle || "N/A"}`, settings.imageSize);
        const base64Data = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        const isWhiteBgRetouch = settings.visualStyle === "WHITE_BG_RETOUCH";
        let finalImage = await resizeImageToQuality(base64Data, settings.imageSize as '1K' | '2K' | '4K');
        if (isWhiteBgRetouch) {
          finalImage = await whitenNearWhiteBackground(finalImage);
        }
        return finalImage;
      }
    }
    throw new Error("Không có ảnh.");
  } catch (error: any) { throw error; }
};

// Ghép 1 tin nhắn chat thành inlineData nếu là data URI ảnh hợp lệ.
const chatImageToInlineData = (dataUri?: string) => {
  if (!dataUri) return null;
  const match = dataUri.match(/^data:(image\/[a-z]+);base64,(.+)$/);
  return match ? { inlineData: { mimeType: match[1], data: match[2] } } : null;
};

/**
 * Tạo ảnh trong Chat, CÓ NGỮ CẢNH TOÀN BỘ ĐOẠN HỘI THOẠI (giống ChatGPT giữ
 * mạch khi đổi công cụ trong cùng 1 thread) — nhận nguyên mảng tin nhắn
 * (giống chatWithAI) thay vì chỉ 1 câu prompt đơn lẻ, để khi người dùng bàn
 * bạc bằng chữ rồi mới chuyển sang "Tạo ảnh AI", model vẫn thấy được toàn
 * bộ nội dung đã trao đổi VÀ mọi ảnh mẫu/ảnh đã tạo trước đó trong đoạn chat.
 */
export const generateImageForChat = async (
  messages: import('../types').ChatMessage[],
  modelName: string = 'gemini-3.1-flash-image',
  aspectRatio: string = "1:1",
  imageSize: string = '1K',
  categoryGuidance?: string
): Promise<string> => {
  const ai = createAiClient();
  try {
    if (isMetaProvider()) {
      const lastText = [...messages].reverse().find(m => m.text)?.text || 'Tạo ảnh sản phẩm Elmich';
      const contextText = messages.map(m => m.text).filter(Boolean).join('\n');
      const metaPrompt = `Elmich Brand Image Standards (bắt buộc tuân thủ):\n${chatAssistantHandbook}${categoryGuidance ? `\n\nChỉ dẫn bổ sung: ${categoryGuidance}` : ''}\n\nNgữ cảnh hội thoại:\n${contextText}\n\nYêu cầu tạo ảnh hiện tại: ${lastText}`;
      const metaImages = messages
        .flatMap(m => [m.uploadedImageUrl, m.imageUrl])
        .filter((u): u is string => !!u && u.startsWith('data:image/'));
      const rawMeta = metaImages.length > 0
        ? await metaEditImage(metaPrompt, metaImages, { aspectRatio })
        : await metaGenerateImage(metaPrompt, { aspectRatio });
      return await resizeImageToQuality(rawMeta, '2K');
    }

    const categoryGuidanceBlock = categoryGuidance
      ? `

Chỉ dẫn bổ sung riêng cho dòng sản phẩm này (đúc kết từ các ảnh đã được đội ngũ Elmich duyệt "Rất tốt!" trước đây — áp dụng như định hướng chung, không phải văn mẫu để chép lại):
${categoryGuidance}`
      : '';
    const contents = messages.map((msg, idx) => {
      const isLastMessage = idx === messages.length - 1;
      let text = msg.text || '';
      if (isLastMessage) {
        // Chỉ nhúng chuẩn thương hiệu vào lượt cuối (chỉ thị chốt trước khi
        // sinh ảnh) — các lượt trước giữ nguyên làm bối cảnh hội thoại thuần túy.
        text = `Elmich Brand Image Standards (bắt buộc tuân thủ):
${chatAssistantHandbook}${categoryGuidanceBlock}

===================================================

Yêu cầu cụ thể của người dùng (dựa trên toàn bộ ngữ cảnh cuộc trò chuyện phía trên, kể cả ảnh đã đề cập): ${text}`;
      }
      const parts: any[] = [];
      if (text) parts.push({ text });
      const uploaded = chatImageToInlineData(msg.uploadedImageUrl);
      if (uploaded) parts.push(uploaded);
      const generated = chatImageToInlineData(msg.imageUrl);
      if (generated) parts.push(generated);
      if (parts.length === 0) parts.push({ text: '' });
      return { role: msg.role, parts };
    });

    const response = await ai.models.generateContent({
      model: modelName,
      contents,
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
          imageSize: imageSize === '4K' ? '2K' : imageSize,
        }
      }
    });

    const resParts = response.candidates?.[0]?.content?.parts;
    if (resParts) {
      for (const part of resParts) {
        if (part.inlineData) {
          trackImagenUsage(modelName, 1, "Tạo ảnh trong Chat", imageSize);
          const base64Data = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          return await resizeImageToQuality(base64Data, imageSize as '1K' | '2K' | '4K');
        }
      }
    }
    throw new Error("Không có ảnh.");
  } catch (error: any) { throw error; }
};

export const chatWithAI = async (messages: import('../types').ChatMessage[], modelName: string = 'gemini-2.5-pro'): Promise<string> => {
  const ai = createAiClient();
  const contents = messages.map(msg => {
    const parts: any[] = [{ text: msg.text }];
    // Nhớ cả ảnh người dùng tải lên LẪN ảnh AI đã tạo ở các lượt trước, để
    // chuyển từ chế độ "Tạo ảnh AI" về "Chat & Tư vấn" không bị mất ngữ cảnh
    // hình ảnh đã trao đổi trong đoạn chat.
    const uploaded = chatImageToInlineData(msg.uploadedImageUrl);
    if (uploaded) parts.push(uploaded);
    const generated = chatImageToInlineData(msg.imageUrl);
    if (generated) parts.push(generated);
    return {
      role: msg.role,
      parts
    };
  });
  
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: {
        systemInstruction: CHAT_SYSTEM_INSTRUCTION,
      }
    });
    trackGeminiUsage(response, "Trò chuyện trợ lý", modelName);
    return response.text || "No response generated.";
  } catch (error) {
    console.error("Chat generation failed:", error);
    throw error;
  }
};

/**
 * Phân tích cấu trúc bế, đường cấn gập, các mặt bao bì và khe quai nhựa trong suốt
 * từ file thiết kế phẳng (2D unfolded dieline).
 */
export const analyzePackagingDieline = async (imageBase64: string): Promise<DielineStructureAnalysis> => {
  const ai = createAiClient();
  try {
    const match = imageBase64.match(/^data:(image\/[a-z]+);base64,(.+)$/);
    const parts: any[] = [{
      text: `Bạn là chuyên gia phân tích kỹ thuật bóc tách bản vẽ bế bao bì (Packaging Structural & Dieline Engineer) chuyên về sản phẩm gia dụng và quà tặng Việt Nam (Elmich).
Hãy kiểm tra bản vẽ thiết kế phẳng 2D (flat unfolded dieline layout) được cung cấp để nhận diện chính xác các đường cấn gập và các mặt của bao bì:

1. Nhận diện cấu trúc hộp & đường gập:
- Xác định loại bao bì (hộp có quai xách nhựa, hộp nắp cài, thùng carton sóng...).
- Nhận diện các đường cấn gập (crease/fold lines) và đường cắt bế (cut lines).
- Nhận diện các mặt chính:
  + Mặt trước (Front Panel): Tên sản phẩm, logo thương hiệu Elmich, hình ảnh đồ gia dụng chính.
  + Mặt sau (Back Panel): Bảng thông số kỹ thuật (công suất, dung tích, điện áp), xuất xứ, mã vạch/QR, hướng dẫn sử dụng.
  + Hai mặt hông (Left & Right Side Panels): Các tính năng nổi bật (icons, bullet points), hình ảnh phụ hoặc logo màu thương hiệu.
  + Nắp trên (Top Lid): Nắp gập phía trên, kiểm tra xem có khe dập chữ nhật (handle slots) để xỏ quai xách nhựa không.
  + Đáy (Bottom Panel): Đáy gài tự động (auto-lock bottom) hoặc đáy khóa chéo.

2. Kiểm tra quai xách nhựa:
- Kiểm tra xem mặt nắp trên có 2 khe dập chữ nhật để gắn quai nhựa trong suốt (translucent plastic handle) phổ biến trên bao bì gia dụng Việt Nam hay không.
- Đề xuất loại quai phù hợp ("PLASTIC_CLEAR", "PLASTIC_OPAQUE", "ROPE_RIBBON", hoặc "NONE").

Trả về ĐÚNG cấu trúc JSON sau:
{
  "boxType": "Hộp quai xách nắp gài / Hộp carton sóng E bồi giấy màu...",
  "frontPanelDescription": "Mặt trước nằm ở vị trí... chứa logo Elmich và hình ảnh nồi/ấm...",
  "backPanelDescription": "Mặt sau nằm ở vị trí... chứa thông số kỹ thuật, barcode...",
  "sidePanelsDescription": "2 mặt bên gồm các biểu tượng công nghệ và thông số phụ...",
  "topPanelDescription": "Mặt nắp gập trên cùng...",
  "hasHandleSlots": true,
  "detectedHandleType": "PLASTIC_CLEAR",
  "foldingGuidance": "Gập theo 4 đường cấn dọc tạo thân hộp chữ nhật, nắp trên gập 90 độ cài tai khóa, đáy khóa chéo. Quai nhựa trong suốt xỏ qua 2 khe nắp trên.",
  "detectedPanels": ["Mặt trước", "Mặt sau", "Mặt hông trái", "Mặt hông phải", "Nắp trên (có khe quai)"]
}`
    }];

    if (match) {
      parts.push({
        inlineData: {
          mimeType: match[1],
          data: match[2]
        }
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json"
      }
    });

    trackGeminiUsage(response, "Analyze Packaging Dieline");
    const parsed = JSON.parse(response.text || '{}');
    return parsed;
  } catch (error) {
    console.error("Error analyzing packaging dieline:", error);
    return {
      boxType: "Hộp gia dụng tiêu chuẩn",
      frontPanelDescription: "Mặt trước với hình ảnh sản phẩm và logo Elmich",
      backPanelDescription: "Mặt sau với thông số kỹ thuật và chứng chỉ",
      sidePanelsDescription: "Mặt bên với các tính năng nổi bật",
      topPanelDescription: "Mặt nắp hộp có khe xỏ quai nhựa",
      hasHandleSlots: true,
      detectedHandleType: "PLASTIC_CLEAR",
      foldingGuidance: "Gập 4 mặt thân hộp vuông vức theo đường cấn, nắp trên gài chắc chắn với quai nhựa trong suốt.",
      detectedPanels: ["Mặt trước", "Mặt sau", "Mặt hông", "Nắp trên"]
    };
  }
};

export const analyzePackagingContent = async (
  designFiles: {name: string, data: string}[],
  standardParams: {key: string, value: string}[]
): Promise<{params: any[]}> => {
  const ai = createAiClient();
  try {
    const prompt = `Bạn là chuyên gia kiểm duyệt nội dung bao bì (QA/QC). Bạn được cung cấp các tài liệu thiết kế. Mỗi tài liệu đều được đi kèm với tên file của nó.

Hãy so sánh nội dung văn bản có trên CÁC thiết kế (được cung cấp qua file đính kèm) với BẢNG THÔNG SỐ CHUẨN sau đây:

BẢNG THÔNG SỐ CHUẨN:
${JSON.stringify(standardParams.filter(p => p.value.trim() !== ''), null, 2)}

NHIỆM VỤ CỦA BẠN:
1. Đọc tất cả các chữ (văn bản) trên CÁC tài liệu thiết kế.
2. Đối chiếu từng thông số trong BẢNG THÔNG SỐ CHUẨN với nội dung bạn đọc được trên thiết kế.
LƯU Ý QUAN TRỌNG VÀ BẮT BUỘC:
- KIỂM TRA ĐỒNG NHẤT: Nếu một thông số xuất hiện ở nhiều nơi trên cùng một file thiết kế (ví dụ tên sản phẩm, công suất...), bạn PHẢI kiểm tra tất cả các vị trí đó. Chúng đều phải trùng khớp với nhau và trùng với tiêu chuẩn. Nếu có bất kỳ sự không đồng nhất nào (ví dụ: mặt trước ghi 500W, mặt sau ghi 600W), hãy tính là MATCH = false và ghi rõ cảnh báo trong phần 'notes'.
- Nếu Tên thông số là 'Mã vạch EAN13' và giá trị chuẩn có 12 số, thiết kế có 13 số thì chỉ cần khớp 12 số đầu là tính MATCH.\n- Đối với 'Đơn vị sản xuất' (Manufacturer) và 'Địa chỉ' (Address): NHỮNG THÔNG TIN NÀY CHẮC CHẮN CÓ TRÊN THIẾT KẾ. Chúng có thể nằm ở các phần như 'NSX', 'Nhà nhập khẩu', 'Sản xuất bởi', 'Nhập khẩu bởi', 'NK&PP', hoặc ở dòng 'Khác', và có thể được viết bằng tiếng Anh (ví dụ: 'Manufactured by...', 'Address...', 'Add:', 'Zhongshan...', 'Guangdong...', 'China', 'P.R.C') hoặc xen kẽ giữa các ngôn ngữ. Bạn PHẢI TÌM KỸ TẤT CẢ CÁC GÓC trên toàn bộ file và TRÍCH XUẤT toàn bộ dòng địa chỉ / tên công ty bằng tiếng Anh hoặc tiếng Trung/Việt trên bản vẽ để điền vào trường 'actual'. Dù giá trị chuẩn là tiếng Việt nhưng trên bao bì là tiếng Anh/Trung tương đương, hãy vẫn đánh giá là MATCH = true.\n- KHÔNG được lười biếng bỏ qua Đơn vị sản xuất và Địa chỉ.\n- Đối với 'Mã QR' (QR Code): Nếu trong BẢNG THÔNG SỐ CHUẨN có yêu cầu kiểm tra Mã QR, bạn PHẢI TỰ QUÉT MÃ QR CÓ TRONG HÌNH ẢNH thiết kế để đọc nội dung mã hóa bên trong nó (tuyệt đối không chỉ đọc dòng chữ in bên cạnh/bên dưới mã). Lấy nội dung giải mã gốc (raw text/URL) để điền vào 'actual' CHÍNH XÁC NHƯ NHỮNG GÌ BẠN QUÉT ĐƯỢC (bao gồm cả http://, https:// nếu có). Khi so sánh với giá trị chuẩn, nếu kết quả quét raw từ ảnh CHỨA giá trị chuẩn (có thể thừa 'http://', 'https://' ở đầu hoặc '/' ở cuối), thì coi như MATCH = true (ví dụ: raw là 'https://www.elmich.vn/san-pham/4021617/' khớp với chuẩn 'www.elmich.vn/san-pham/4021617'). TUYỆT ĐỐI KHÔNG tự ý suy diễn hay truy cập link thực tế.\n- Mọi nội dung trả về trong 'notes' LUÔN LUÔN phải viết bằng tiếng Việt.
- Trong phần 'notes' (ghi chú), đối với bất kỳ thông số nào, bạn PHẢI ghi rõ thông tin đó được tìm thấy (hoặc bị sai/thiếu) trên file thiết kế có TÊN FILE LÀ GÌ (dựa vào tên file được cung cấp ngay trước mỗi hình ảnh). Ví dụ: 'Trên file hop-mau.pdf: thông tin bị sai...'. Việc ghi rõ tên file là BẮT BUỘC để người dùng dễ kiểm tra và sửa.
3. KIỂM TRA TOÀN DIỆN VÀ CHI TIẾT TỪNG TÀI LIỆU: Với mỗi thông số trong BẢNG THÔNG SỐ CHUẨN, bạn phải kiểm tra và báo cáo kết quả RIÊNG BIỆT cho TỪNG file thiết kế được cung cấp.\n- 'match' tổng thể: true nếu khớp hoàn toàn trên TẤT CẢ các file có thông số đó, false nếu có ít nhất 1 file sai/khác biệt.\n- 'fileResults': mảng chứa kết quả chi tiết cho từng file thiết kế. Với mỗi file, ghi CHÍNH XÁC tên file (fileName) giống y hệt như đã được cung cấp (ví dụ: 'hop-mau.pdf', 'tem.png'), nội dung thực tế đọc được trên file đó (actual), kết quả đối chiếu với chuẩn (match: true/false), và ghi chú thật ngắn gọn (notes) nếu sai (ví dụ: 'Sai model', 'Thiếu điện áp'). Nếu file không chứa thông tin của thông số này (và điều đó là bình thường), ghi 'actual': 'Không có', 'match': true.\n\nTrả về ĐÚNG định dạng JSON sau:\n{\n  "params": [\n    { \n      "key": "...", \n      "expected": "...", \n      "match": true/false,\n      "fileResults": [\n        { "fileName": "...", "actual": "...", "match": true/false, "notes": "..." }\n      ]\n    }\n  ]\n}`;

    const parts: any[] = [
      { text: prompt },
    ];
    
    designFiles.forEach(file => {
      const commaIdx = file.data.indexOf(',');
      if (commaIdx !== -1) {
        const header = file.data.substring(0, commaIdx);
        const data = file.data.substring(commaIdx + 1);
        const mimeMatch = header.match(/data:([^;]+)/);
        if (mimeMatch && mimeMatch[1]) {
          parts.push({ text: `Tài liệu thiết kế, Tên file: ${file.name}` });
          parts.push({ inlineData: { mimeType: mimeMatch[1], data: data } });
        }
      }
    });

    if (parts.length === 1) throw new Error("Invalid files");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: {
        parts: parts
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            params: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  key: { type: Type.STRING },
                  expected: { type: Type.STRING },
                  match: { type: Type.BOOLEAN },
                  fileResults: {
                    type: Type.ARRAY,
                    items: {
                       type: Type.OBJECT,
                       properties: {
                          fileName: { type: Type.STRING },
                          actual: { type: Type.STRING },
                          match: { type: Type.BOOLEAN },
                          notes: { type: Type.STRING }
                       },
                       required: ["fileName", "actual", "match"]
                    }
                  }
                },
                required: ["key", "expected", "match", "fileResults"]
              }
            }
          }
        }
      }
    });

    trackGeminiUsage(response, "Kiểm tra bao bì", "gemini-2.5-pro");
    return JSON.parse(response.text || '{"params": []}');
  } catch (error) {
    console.error("Lỗi kiểm tra bao bì:", error);
    return { params: [] };
  }
};


export const extractStandardParamsWithAI = async (textData: string): Promise<{key: string, value: string}[]> => {
  const ai = createAiClient();
  try {
    const prompt = `Bạn là chuyên gia phân tích dữ liệu sản phẩm. Hãy trích xuất các thông số kỹ thuật quan trọng từ văn bản thô (thường được copy từ file Excel) dưới đây.
Văn bản thô:
${textData}

Hãy trích xuất và trả về MỘT mảng JSON các thông số sau ĐÚNG VỚI DANH SÁCH BÊN DƯỚI (chỉ bao gồm 16 thông số này):
1: Tên sản phẩm
2: Model
3: Mã sản phẩm
4: Dung tích
5: Công suất
6: Điện áp
7: Tần số
8: Khối lượng
9: Định lượng / hộp màu
10: Định lượng / thùng carton
11: Số Serial
12: Nhà sản xuất
13: Địa chỉ nhà sản xuất
14: Mã QR
15: Barcode 128
16: Barcode EAN13

LƯU Ý: 
- Nếu Mã QR không có sẵn, hãy tự tạo ra từ Mã sản phẩm theo định dạng: www.elmich.vn/san-pham/<mã sản phẩm viết thường>.
- Trả về danh sách đầy đủ 16 thông số trên, nếu thông số nào không có dữ liệu hãy để giá trị là "".

Định dạng JSON:
{
  "params": [
    { "key": "Tên thông số", "value": "Giá trị" }
  ]
}
`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            params: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  key: { type: Type.STRING },
                  value: { type: Type.STRING }
                },
                required: ["key", "value"]
              }
            }
          }
        }
      }
    });
    trackGeminiUsage(response, "Trích xuất thông số chuẩn", "gemini-2.5-pro");
    const res = JSON.parse(response.text || '{"params": []}');
    return res.params || [];
  } catch (error) {
    console.error("Lỗi trích xuất thông số:", error);
    return [];
  }
};

export const analyzeAndTranslatePackaging = async (imageBase64: string): Promise<{ regions: any[] }> => {
  const ai = createAiClient();
  try {
    const match = imageBase64.match(/^data:(image\/[a-z]+);base64,(.+)$/);
    if (!match) throw new Error("Ảnh không hợp lệ.");
    const parts: any[] = [
      {
        text: `Bạn là chuyên gia dịch thuật và bóc tách bố cục (OCR & Layout Analysis).
Nhiệm vụ: Tìm tất cả các cụm văn bản (text) bằng tiếng Anh trên ảnh, dịch sang tiếng Việt.
Trả về một JSON có cấu trúc sau:
{
  "regions": [
    {
      "box": [ymin, xmin, ymax, xmax], // Tọa độ chuẩn hóa từ 0 đến 1000
      "original": "English text",
      "translated": "Bản dịch tiếng Việt (phù hợp ngữ cảnh bao bì/sản phẩm)",
      "bgColor": "#HexColor", // Mã màu HEX ước lượng của phần nền bên dưới chữ này để tiện lấp đi (thường là màu nền của bao bì, ví dụ #FFFFFF cho nền trắng, #000000 cho nền đen). Hãy dự đoán chính xác nhất có thể.
      "textColor": "#HexColor" // Mã màu HEX của chữ (ví dụ #000000 cho chữ đen)
    }
  ]
}`
      },
      {
        inlineData: {
          mimeType: match[1],
          data: match[2]
        }
      }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
      }
    });

    if (response.text) {
      trackGeminiUsage(response, "Dịch và OCR bao bì", "gemini-2.5-pro");
      return JSON.parse(response.text);
    }
    throw new Error("Không có phản hồi");
  } catch (err) {
    console.error(err);
    throw err;
  }
};

// Phân tích phong cách ảnh tham khảo cho Canvas Workflow
export const analyzeReferenceImageStyle = async (imageBase64: string, referenceNote?: string): Promise<{ description: string }> => {
  const ai = createAiClient();
  try {
    const match = imageBase64.match(/^data:(image\/[a-z]+);base64,(.+)$/);
    const parts: any[] = [{
      text: `Bạn là Giám đốc Sáng tạo và chuyên gia phân tích mỹ thuật nhiếp ảnh thương mại Elmich.
Hãy quan sát kỹ bức ảnh tham khảo này và đưa ra bản mô tả phong cách chi tiết, tập trung vào:
1. Ánh sáng & Bầu không khí (hướng sáng, nhiệt độ màu, độ mềm/gắt của bóng đổ).
2. Tông màu & Bảng màu chủ đạo (Color Palette).
3. Bố cục, góc đặt và không gian âm (Negative Space).
4. Phong cách decor, đạo cụ và vật liệu nền.
${referenceNote ? `Ghi chú định hướng của người dùng: "${referenceNote}". Hãy đặc biệt nhấn mạnh các yếu tố này.` : ""}

Trả về một đoạn văn súc tích, chuyên nghiệp bằng tiếng Việt mô tả chính xác phong cách này để dùng làm chỉ dẫn tạo ảnh.`
    }];

    if (match) {
      parts.push({
        inlineData: {
          mimeType: match[1],
          data: match[2]
        }
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts }
    });

    trackGeminiUsage(response, "Phân tích ảnh tham khảo", "gemini-2.5-flash");
    return { description: response.text?.trim() || "Phong cách nhiếp ảnh thương mại cao cấp." };
  } catch (err: any) {
    console.error("analyzeReferenceImageStyle error:", err);
    throw err;
  }
};

export interface ExecuteAiNodeTaskParams {
  aiType: 'IMAGE' | 'CONTENT';
  contentSubtype?: string;
  customInstruction?: string;
  inputImages?: string[];
  referenceImage?: string | null;
  referenceImageNote?: string;
  referenceAiDescription?: string;
  productName?: string;
  productCode?: string;
  dimensions?: string;
  promptText?: string;
  priorityPrompt?: string;
  presetStyle?: string;
  presetStyleName?: string;
  markdownSkillGuidance?: string;
  markdownSkillTitle?: string;
  materialsDescription?: string;
  conceptPrompt?: string;
  inputText?: string;
  textModel?: 'gemini-2.5-flash' | 'gemini-2.5-pro';
  aspectRatio?: AspectRatio;
  imageSize?: ImageSize;
  imageModel?: ImageModelTier;
}

export interface ExecuteAiNodeTaskResult {
  resultImage?: string;
  resultText?: string;
  resultType: 'IMAGE' | 'TEXT';
}

export const executeAiNodeTask = async (params: ExecuteAiNodeTaskParams): Promise<ExecuteAiNodeTaskResult> => {
  const ai = createAiClient();
  const { aiType, contentSubtype, customInstruction, inputImages = [], referenceImage, promptText, conceptPrompt, productName, aspectRatio = '1:1', imageSize = '1K', imageModel = 'FLASH' } = params;

  if (aiType === 'IMAGE') {
    const finalPrompt = [
      promptText || conceptPrompt || `Professional commercial studio photograph of ${productName || 'product'}`,
      params.materialsDescription ? `Material specifications: ${params.materialsDescription}` : '',
      params.priorityPrompt ? `Priority instructions: ${params.priorityPrompt}` : '',
      params.markdownSkillGuidance ? `Style skill guidelines: ${params.markdownSkillGuidance}` : '',
      customInstruction ? `Special instructions: ${customInstruction}` : '',
    ].filter(Boolean).join('\n\n');

    const mockSettings = {
      productName: productName || 'Sản phẩm Elmich',
      productImages: inputImages,
      referenceImage: referenceImage || null,
      concept: finalPrompt,
      aspectRatio,
      imageSize,
      imageModel,
      visualStyle: (params.presetStyle as any) || 'CONCEPT',
      dimensions: { length: '200', width: '200', height: '200' },
      camera: { angle: 15, focalLength: 50, aperture: 'f/2.8', iso: '100', isMacro: false },
      props: [],
      emptySpacePosition: ['NONE'],
      techDescription: '',
      colorChanges: [],
      packagingMaterial: 'CARTON_DUPLEX',
      packagingDesignType: 'MINIMALIST',
      packagingFaces: {},
      techTitle: '',
      selectedTechConcept: '',
      productMaterial: 'MATTE',
    } as unknown as GenerationSettings;

    const imageResult = await generateProductImage(mockSettings, 1);

    return {
      resultImage: imageResult,
      resultType: 'IMAGE'
    };
  } else {
    // CONTENT Mode
    let systemTaskPrompt = '';
    if (contentSubtype === 'PROMPT_OPTIMIZE') {
      systemTaskPrompt = `Bạn là chuyên gia Prompt Engineer cho AI tạo ảnh sản phẩm Elmich. Hãy tối ưu hóa câu lệnh prompt sau đây để đạt chất lượng ảnh chân thực, sang trọng nhất:
Input: "${params.inputText || promptText || ''}"
${customInstruction ? `Chỉ dẫn bổ sung: ${customInstruction}` : ''}`;
    } else if (contentSubtype === 'PRODUCT_SPECS') {
      systemTaskPrompt = `Bạn là chuyên gia kỹ thuật sản phẩm gia dụng Elmich. Hãy tạo bảng thông số kỹ thuật và mô tả tính năng nổi bật cho sản phẩm: "${productName || 'Sản phẩm'}" (${params.dimensions || ''}).`;
    } else {
      systemTaskPrompt = `Bạn là chuyên gia đồ họa và truyền thông thương hiệu Elmich.
Nhiệm vụ: ${customInstruction || 'Phân tích và tối ưu nội dung đồ họa cho sản phẩm'}
Dữ liệu đầu vào: "${params.inputText || promptText || ''}"`;
    }

    const parts: any[] = [{ text: systemTaskPrompt }];
    if (inputImages.length > 0) {
      const match = inputImages[0].match(/^data:(image\/[a-z]+);base64,(.+)$/);
      if (match) parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
    }

    const selectedModel = params.textModel === 'gemini-2.5-pro' ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: { parts }
    });

    trackGeminiUsage(response, `AI Node Task (${selectedModel})`, selectedModel);
    return {
      resultText: response.text?.trim() || '',
      resultType: 'TEXT'
    };
  }
};
