// ============================================================================
// Meta Model API (Muse Image 1.0) — nhà cung cấp tạo ảnh thay thế cho Gemini.
//
// Kiến trúc: trình duyệt KHÔNG gọi thẳng api.meta.ai (tránh CORS + lộ khóa),
// mà gọi proxy cùng origin `/api/meta/images` (xem server.ts và
// api/meta/images.ts). Proxy gắn khóa theo thứ tự ưu tiên:
//   1) Header `x-meta-api-key` — khóa người dùng nhập trong app (lưu localStorage)
//   2) Biến môi trường server META_MODEL_API_KEY
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
const META_KEY_STORAGE_KEY = 'elmich_meta_api_key';

export const META_IMAGE_MODEL = 'muse-image-1.0';

/** Nhà cung cấp đang chọn. Mặc định META (theo yêu cầu chuyển sang Meta để test). */
export const getAiProvider = (): AiProvider => {
  try {
    return localStorage.getItem(PROVIDER_STORAGE_KEY) === 'GEMINI' ? 'GEMINI' : 'META';
  } catch {
    return 'META';
  }
};

export const setAiProvider = (provider: AiProvider) => {
  try {
    localStorage.setItem(PROVIDER_STORAGE_KEY, provider);
  } catch {
    /* bỏ qua khi localStorage không khả dụng */
  }
};

export const isMetaProvider = (): boolean => getAiProvider() === 'META';

export const getMetaApiKey = (): string => {
  try {
    return localStorage.getItem(META_KEY_STORAGE_KEY) || '';
  } catch {
    return '';
  }
};

export const setMetaApiKey = (key: string) => {
  try {
    if (key) localStorage.setItem(META_KEY_STORAGE_KEY, key);
    else localStorage.removeItem(META_KEY_STORAGE_KEY);
  } catch {
    /* bỏ qua khi localStorage không khả dụng */
  }
};

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

const callMetaProxy = async (body: Record<string, any>): Promise<string> => {
  const key = getMetaApiKey();
  const res = await fetch('/api/meta/images', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(key ? { 'x-meta-api-key': key } : {}),
    },
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
  return callMetaProxy({
    mode: 'edit',
    prompt,
    images: valid.slice(0, 10),
    size: metaSizeFromAspectRatio(options.aspectRatio),
    output_format: options.outputFormat || 'png',
  });
};
