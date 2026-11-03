// Xây dựng dần "chỉ dẫn theo dòng sản phẩm" (category guidance) từ các ảnh đã
// được đội ngũ Elmich đánh giá "Rất tốt!" — KHÔNG trích dẫn lại prompt gốc,
// mà đúc kết thành chỉ dẫn ngắn gọn (chất liệu, ánh sáng, bố cục, góc máy...)
// để AI tham khảo cho đúng dòng sản phẩm ở các lần tạo ảnh sau, cả trong 11
// workflow lẫn khi tạo ảnh qua Chat. Xem ARCHITECTURE.md mục 8.5 (cơ chế cũ
// bị thay thế) và kế hoạch triển khai đi kèm.
import { GoogleGenAI, Type } from "@google/genai";
import { getFirestore } from "./googleCloud.js";

const MIN_SAMPLES_TO_SYNTHESIZE = 3;
const MAX_SAMPLES_FOR_SYNTHESIS = 15;
const GOOD_RATINGS_SCAN_LIMIT = 50;

const SUGGESTED_CATEGORIES = [
  "binh_giu_nhiet", "noi_com_dien", "bep_tu", "bep_hong_ngoai", "quat_dien",
  "may_xay", "am_dun_nuoc", "noi_chien_khong_dau", "ban_ui", "may_hut_bui",
  "lo_vi_song", "o_cam_track_socket",
];

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

export interface InferCategoryParams {
  productName?: string;
  productCode?: string;
  visualStyle?: string;
  freeText?: string;
}

/**
 * Suy luận "phân lớp/dòng sản phẩm" từ productName/productCode (hoặc freeText
 * khi gọi từ Chat, nơi chưa có field sản phẩm có cấu trúc). Trả về 1 slug
 * chuẩn hoá, neo theo danh sách dòng gia dụng phổ biến của Elmich để hạn chế
 * việc cùng 1 dòng sản phẩm bị AI tách thành nhiều category khác nhau do câu
 * chữ khác nhau giữa các lần gọi.
 */
export async function inferProductCategory({ productName, productCode, freeText }: InferCategoryParams): Promise<string | null> {
  const signal = [productName, productCode, freeText].filter(Boolean).join(" — ").trim();
  if (!signal) return null;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: {
        parts: [{
          text: `Bạn phân loại sản phẩm gia dụng Elmich vào 1 "dòng sản phẩm" (category) dựa trên thông tin sau: "${signal}".

Danh sách dòng sản phẩm gợi ý (ưu tiên chọn đúng 1 trong các slug này nếu phù hợp):
${SUGGESTED_CATEGORIES.join(", ")}

Nếu không có slug nào phù hợp, hãy tự đặt 1 slug mới ngắn gọn theo đúng định dạng: chữ thường, không dấu, nối bằng dấu gạch dưới, tối đa 4 từ (vd "may_say_toc").
Chỉ trả về DUY NHẤT slug, không giải thích, không có câu chữ khác.`
        }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: { type: Type.OBJECT, properties: { category: { type: Type.STRING } }, required: ["category"] },
      },
    });
    const parsed = JSON.parse(response.text || "{}");
    const slug = slugify(String(parsed.category || ""));
    return slug || null;
  } catch (err: any) {
    console.error("Không suy luận được productCategory (bỏ qua):", err.message);
    return null;
  }
}

interface GuidanceSample {
  prompt?: string;
  productName?: string;
  concept?: string;
}

/**
 * Tổng hợp tối đa MAX_SAMPLES_FOR_SYNTHESIS mẫu "tốt" thành 1 đoạn chỉ dẫn
 * ngắn gọn dạng gạch đầu dòng — KHÔNG trích nguyên văn prompt gốc.
 */
async function synthesizeCategoryGuidance(visualStyle: string, productCategory: string, samples: GuidanceSample[]): Promise<string | null> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const samplesText = samples
      .map((s, i) => `${i + 1}. Sản phẩm: ${s.productName || "?"}${s.concept ? ` | Concept: ${s.concept}` : ""}\nPrompt: ${(s.prompt || "").slice(0, 500)}`)
      .join("\n\n");

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: {
        parts: [{
          text: `Dưới đây là ${samples.length} ảnh sản phẩm dòng "${productCategory}" (phong cách "${visualStyle}") đã được đội ngũ Elmich đánh giá "Rất tốt!":

${samplesText}

Hãy đúc kết thành 1 đoạn CHỈ DẪN NGẮN GỌN dạng gạch đầu dòng (5-8 gạch đầu dòng) mô tả các đặc điểm CHUNG lặp lại ở các ảnh trên mà đội ngũ ưa thích cho đúng dòng sản phẩm này — vd: cách xử lý chất liệu bề mặt, ánh sáng, bố cục/góc máy, tông màu, điều nên/không nên. TUYỆT ĐỐI KHÔNG chép lại nguyên văn bất kỳ prompt nào ở trên, không nhắc tên sản phẩm cụ thể — chỉ viết chỉ dẫn khái quát áp dụng được cho cả dòng sản phẩm. Viết bằng tiếng Việt.`
        }]
      },
    });
    return (response.text || "").trim() || null;
  } catch (err: any) {
    console.error("Không tổng hợp được category guidance (bỏ qua):", err.message);
    return null;
  }
}

function guidanceDocId(visualStyle: string, productCategory: string): string {
  return `${visualStyle}::${productCategory}`;
}

/**
 * Lấy tối đa GOOD_RATINGS_SCAN_LIMIT bản ghi "good" gần nhất rồi lọc theo
 * visualStyle + productCategory ở tầng JS — dùng lại đúng trick đã có ở
 * listApprovedPrompts (mục 8.5 ARCHITECTURE.md) để không cần thêm composite
 * index Firestore nào ngoài (rating + timestamp) đã có sẵn.
 */
async function listGoodSamplesForCategory(visualStyle: string, productCategory: string): Promise<GuidanceSample[]> {
  const db = getFirestore();
  if (!db) return [];

  const snapshot = await db
    .collection("imageHistory")
    .where("rating", "==", "good")
    .orderBy("timestamp", "desc")
    .limit(GOOD_RATINGS_SCAN_LIMIT)
    .get();

  return snapshot.docs
    .map((doc) => doc.data())
    .filter((data) => data.visualStyle === visualStyle && data.productCategory === productCategory)
    .slice(0, MAX_SAMPLES_FOR_SYNTHESIS)
    .map((data) => ({ prompt: data.prompt, productName: data.productName, concept: data.concept }));
}

/**
 * Gọi sau khi 1 ảnh mới được rating "Rất tốt!" và đã gắn productCategory —
 * nếu đã đủ ngưỡng mẫu tối thiểu, tổng hợp lại TOÀN BỘ guidance cho đúng cặp
 * (visualStyle, productCategory) từ tập mẫu mới nhất (ghi đè, không nối
 * chuỗi tích luỹ, để tránh phình to/trôi nội dung theo thời gian).
 */
export async function rebuildCategoryGuidanceIfEligible(visualStyle?: string, productCategory?: string | null): Promise<void> {
  if (!visualStyle || !productCategory) return;
  const db = getFirestore();
  if (!db) return;

  const samples = await listGoodSamplesForCategory(visualStyle, productCategory);
  if (samples.length < MIN_SAMPLES_TO_SYNTHESIZE) return;

  const guidanceText = await synthesizeCategoryGuidance(visualStyle, productCategory, samples);
  if (!guidanceText) return;

  await db.collection("categoryGuidance").doc(guidanceDocId(visualStyle, productCategory)).set({
    visualStyle,
    productCategory,
    guidanceText,
    sourceCount: samples.length,
    updatedAt: Date.now(),
  });
}

export interface CategoryGuidanceResult {
  category: string | null;
  guidanceText: string | null;
}

/**
 * Tra cứu guidance cho 1 lượt tạo ảnh mới: suy luận category từ thông tin
 * sản phẩm hiện tại (hoặc freeText khi gọi từ Chat), rồi đọc thẳng doc theo
 * id — không cần query, không cần index.
 */
export async function getCategoryGuidanceFor(params: InferCategoryParams & { visualStyle: string }): Promise<CategoryGuidanceResult> {
  const category = await inferProductCategory(params);
  if (!category) return { category: null, guidanceText: null };

  const db = getFirestore();
  if (!db) return { category, guidanceText: null };

  const doc = await db.collection("categoryGuidance").doc(guidanceDocId(params.visualStyle, category)).get();
  if (!doc.exists) return { category, guidanceText: null };

  const data = doc.data();
  return { category, guidanceText: (data?.guidanceText as string) || null };
}
