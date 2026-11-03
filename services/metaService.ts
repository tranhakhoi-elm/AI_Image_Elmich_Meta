// ============================================================================
// Meta Model API (Muse Image 1.0) — nhà cung cấp tạo ảnh thay thế cho Gemini.
//
// Kiến trúc: trình duyệt KHÔNG gọi thẳng api.meta.ai (tránh CORS + lộ khóa),
// mà gọi proxy cùng origin `/api/meta/images` (xem server.ts và
// api/meta/images.ts). Proxy lấy khóa DUY NHẤT từ biến môi trường server
// META_MODEL_API_KEY (khai báo trên Vercel) — app không nhập/lưu key ở
// phía người dùng.
//
// Endpoint phía Meta (OpenAI-compatible, https://api.meta.ai/v1):
//   - POST /images/generations  { model, prompt, size?, output_format? }
//   - POST /images/edits        { model, prompt, images: [{ image_url }], ... }
//   Trả về { data: [{ b64_json }] } — ảnh cố định ~2,5MP, `size` chỉ là gợi ý
//   tỉ lệ khung hình chứ không phải kích thước pixel chính xác.
// ============================================================================

import { reportToLark, calculateMetaImageCost } from './metricsService';

export type AiProvider = 'GEMINI' | 'META';

const PROVIDER_STORAGE_KEY = 'elmich_ai_provider';

export const META_IMAGE_MODEL = 'muse-image-1.0';

/** Nhà cung cấp đang dùng. App chạy META-ONLY (toàn bộ AI qua Meta Model
 * API) nên hàm này luôn trả 'META' — mã nguồn Gemini vẫn giữ trong
 * geminiService/aiClient để khôi phục khi cần: chỉ cần trả lại logic đọc
 * localStorage ở đây và mở lại lựa chọn trong ProviderSettings. */
export const getAiProvider = (): AiProvider => 'META';

export const setAiProvider = (provider: AiProvider) => {
  try {
    localStorage.setItem(PROVIDER_STORAGE_KEY, provider);
  } catch {
    /* bỏ qua khi localStorage không khả dụng */
  }
};

export const isMetaProvider = (): boolean => getAiProvider() === 'META';

/**
 * Đổi tỉ lệ khung hình của app ("9:16", "16:9", "1:1"...) sang tham số `size`
 * kiểu "WxH" cho Meta. Cạnh dài nhất giữ ở 1536, làm tròn bội số 16.
 */
export const metaSizeFromAspectRatio = (aspectRatio?: string): string => {
  if (!aspectRatio) return '1024x1024';
  const [w, h] = aspectRatio.split(':').map(Number);
  if (!w || !h) return '1024x1024';
  const LONG_EDGE = 1536;
  const round16 = (v: number) => Math.max(256, Math.round(v / 16) * 16);
  if (w === h) return '1024x1024';
  if (w > h) return `${LONG_EDGE}x${round16((LONG_EDGE * h) / w)}`;
  return `${round16((LONG_EDGE * w) / h)}x${LONG_EDGE}`;
};

interface MetaImageOptions {
  aspectRatio?: string;
  outputFormat?: 'png' | 'jpeg' | 'webp';
}

/**
 * Thu nhỏ data URI ảnh trước khi gửi qua proxy nếu quá lớn: Vercel giới hạn
 * thân request của serverless function ở ~4,5MB — ảnh gốc studio (5–15MB)
 * gửi thẳng sẽ bị chặn ở cửa (HTTP 413) trước khi tới Meta, trong khi luồng
 * Gemini cũ gọi thẳng từ trình duyệt nên không vướng giới hạn này. Ngưỡng
 * an toàn ~2,8MB ký tự base64; ảnh thu về cạnh dài tối đa 2048px, JPEG nền
 * trắng (đủ chi tiết cho phân tích chất liệu lẫn ảnh tham chiếu tạo ảnh,
 * vì ảnh Meta trả về vốn chỉ ~2,5MP).
 */
export const shrinkDataUriForUpload = async (
  dataUri: string,
  maxChars = 2_800_000
): Promise<string> => {
  if (
    typeof dataUri !== 'string' ||
    !dataUri.startsWith('data:image/') ||
    dataUri.length <= maxChars ||
    typeof document === 'undefined'
  ) {
    return dataUri;
  }
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = dataUri;
    });
    const MAX_EDGE = 2048;
    const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return dataUri;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const shrunk = canvas.toDataURL('image/jpeg', 0.85);
    return shrunk.length < dataUri.length ? shrunk : dataUri;
  } catch {
    return dataUri;
  }
};

const callMetaProxy = async (body: Record<string, any>): Promise<string> => {
  const res = await fetch('/api/meta/images', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json: any = await res.json().catch(() => null);
  if (!res.ok || !json?.success || !json?.image) {
    throw new Error(
      json?.error ||
        `Meta Model API lỗi (HTTP ${res.status}). Kiểm tra lại API key và số dư tài khoản Meta.`
    );
  }
  // Báo cáo chi phí theo giá Meta ($0.01/ảnh) — các hàm ảnh phía app không
  // gọi trackImagenUsage ở nhánh Meta nên báo cáo ngay tại đây.
  try {
    const { costUSD } = calculateMetaImageCost(1);
    const productCode = localStorage.getItem('elmich_ai_product_code') || 'N/A';
    const productName = localStorage.getItem('elmich_ai_product_name') || 'Tạo ảnh AI';
    reportToLark(productCode, productName, 0, costUSD, 'Tạo ảnh Meta (Muse Image)');
  } catch {
    /* báo cáo chi phí lỗi không được làm hỏng luồng tạo ảnh */
  }
  return json.image as string; // data URL hoàn chỉnh
};

/** Tạo ảnh từ prompt thuần (không ảnh tham chiếu) bằng muse-image-1.0. */
export const metaGenerateImage = async (
  prompt: string,
  options: MetaImageOptions = {}
): Promise<string> => {
  return callMetaProxy({
    mode: 'generate',
    prompt,
    size: metaSizeFromAspectRatio(options.aspectRatio),
    output_format: options.outputFormat || 'png',
  });
};

/**
 * Tạo/sửa ảnh từ 1+ ảnh tham chiếu (data URI) + prompt bằng muse-image-1.0.
 * Đây là đường chính cho workflow one-shot của app: ảnh sản phẩm + prompt.
 */
export const metaEditImage = async (
  prompt: string,
  images: string[],
  options: MetaImageOptions = {}
): Promise<string> => {
  const valid = (images || []).filter(
    (img) => typeof img === 'string' && img.startsWith('data:image/')
  );
  if (valid.length === 0) {
    return metaGenerateImage(prompt, options);
  }
  const shrunk = await Promise.all(
    valid.slice(0, 10).map((img) => shrinkDataUriForUpload(img))
  );
  return callMetaProxy({
    mode: 'edit',
    prompt,
    images: shrunk,
    size: metaSizeFromAspectRatio(options.aspectRatio),
    output_format: options.outputFormat || 'png',
  });
};
