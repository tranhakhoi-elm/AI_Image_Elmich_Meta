// Client-side helper cho tính năng "Lịch sử dùng chung" (server-side).
// Mọi hàm ở đây được thiết kế để KHÔNG BAO GIỜ làm gián đoạn luồng chính
// (tạo ảnh / chat) — lỗi mạng hay backend chưa cấu hình chỉ log ra console.
import { ChatMessage, ChatSession } from '../types';

export interface ImageHistoryRecord {
  id: string;
  productName?: string;
  productCode?: string;
  visualStyle?: string;
  prompt?: string;
  aspectRatio?: string;
  imageSize?: string;
  variant?: number;
  costUSD?: number;
  tokens?: number;
  timestamp: number;
  imageUrl: string | null;
  rating?: 'good' | 'bad';
}

export interface ChatHistoryMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  imageUrl?: string;
  uploadedImageUrl?: string;
}

export interface ChatHistorySession {
  id: string;
  title: string;
  timestamp: number;
  messages: ChatHistoryMessage[];
}

interface HistoryListResponse<T> {
  success: boolean;
  items?: T[];
  nextCursor?: string | null;
  error?: string;
}

async function dataUriToBlob(dataUri: string): Promise<Blob> {
  const response = await fetch(dataUri);
  return response.blob();
}

/**
 * Xin 1 signed URL rồi upload thẳng ảnh (base64 data URI) lên Cloud Storage,
 * KHÔNG đi qua body của route backend — tránh giới hạn dung lượng request
 * của Vercel Serverless Functions khi ảnh 2K/4K khá nặng.
 */
export async function uploadToHistoryStorage(dataUri: string, folder: 'images' | 'chat'): Promise<string> {
  const blob = await dataUriToBlob(dataUri);
  const contentType = blob.type || 'image/png';

  const urlRes = await fetch('/api/history/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder, contentType }),
  });
  const urlData = await urlRes.json();
  if (!urlData.success) throw new Error(urlData.error || 'Không lấy được upload URL.');

  const putRes = await fetch(urlData.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: blob,
  });
  if (!putRes.ok) throw new Error(`Upload ảnh lên Storage thất bại (HTTP ${putRes.status}).`);

  return urlData.path as string;
}

export interface LogImageParams {
  id: string; // trùng với GeneratedImage.id trong gallery cục bộ — dùng làm doc id trên server để có thể "đánh giá" (rate) đúng ảnh này sau này
  url: string; // base64 data URI của ảnh kết quả
  prompt?: string;
  productName?: string;
  productCode?: string;
  visualStyle?: string;
  aspectRatio?: string;
  imageSize?: string;
  variant?: number;
  costUSD?: number;
  tokens?: number;
  timestamp?: number;
}

/** Ghi 1 ảnh vừa tạo/sửa vào lịch sử dùng chung. Bắn-và-quên, không throw ra ngoài. */
export async function logGeneratedImage(params: LogImageParams): Promise<void> {
  try {
    if (!params.url || !params.url.startsWith('data:')) return;
    const gcsPath = await uploadToHistoryStorage(params.url, 'images');
    const res = await fetch('/api/history/images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...params, url: undefined, gcsPath }),
    });
    const data = await res.json();
    if (!data.success) {
      console.warn('Ghi lịch sử ảnh thất bại (bỏ qua):', data.error);
    }
  } catch (err) {
    console.error('Không ghi được lịch sử ảnh (bỏ qua, không ảnh hưởng luồng chính):', err);
  }
}

// Cache theo id tin nhắn trong phiên tab hiện tại, tránh upload lại ảnh của
// các tin nhắn cũ mỗi lần phiên chat có tin nhắn mới.
const chatImageUploadCache = new Map<string, { imageGcsPath?: string; uploadedImageGcsPath?: string }>();

async function messageToRecord(msg: ChatMessage) {
  const cached = chatImageUploadCache.get(msg.id);
  if (cached) {
    return { id: msg.id, role: msg.role, text: msg.text, ...cached };
  }

  const entry: { imageGcsPath?: string; uploadedImageGcsPath?: string } = {};
  if (msg.imageUrl?.startsWith('data:')) {
    try {
      entry.imageGcsPath = await uploadToHistoryStorage(msg.imageUrl, 'chat');
    } catch (err) {
      console.error('Không upload được ảnh AI trong chat:', err);
    }
  }
  if (msg.uploadedImageUrl?.startsWith('data:')) {
    try {
      entry.uploadedImageGcsPath = await uploadToHistoryStorage(msg.uploadedImageUrl, 'chat');
    } catch (err) {
      console.error('Không upload được ảnh người dùng tải lên trong chat:', err);
    }
  }

  chatImageUploadCache.set(msg.id, entry);
  return { id: msg.id, role: msg.role, text: msg.text, ...entry };
}

/** Ghi/đè lại 1 phiên chat vào lịch sử dùng chung. Bắn-và-quên, không throw ra ngoài. */
export async function logChatSession(session: ChatSession): Promise<void> {
  try {
    const messages = await Promise.all(session.messages.map(messageToRecord));
    const res = await fetch('/api/history/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: session.id, title: session.title, timestamp: session.timestamp, messages }),
    });
    const data = await res.json();
    if (!data.success) {
      console.warn('Ghi lịch sử chat thất bại (bỏ qua):', data.error);
    }
  } catch (err) {
    console.error('Không ghi được lịch sử chat (bỏ qua, không ảnh hưởng luồng chính):', err);
  }
}

/**
 * Gắn đánh giá "Rất tốt!" / "Không hẳn" vào 1 ảnh đã ghi lịch sử (đúng id
 * đã dùng khi gọi logGeneratedImage). Bắn-và-quên, không throw ra ngoài —
 * lỗi ở đây không được phép làm hỏng trải nghiệm tải ảnh của người dùng.
 */
export async function rateGeneratedImage(id: string, rating: 'good' | 'bad'): Promise<void> {
  try {
    if (!id) return;
    const res = await fetch('/api/history/rate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, rating }),
    });
    const data = await res.json();
    if (!data.success) {
      console.warn('Không lưu được đánh giá ảnh (bỏ qua):', data.error);
    }
  } catch (err) {
    console.error('Không gửi được đánh giá ảnh (bỏ qua, không ảnh hưởng luồng chính):', err);
  }
}

export interface CategoryGuidanceResult {
  category: string | null;
  guidanceText: string | null;
}

/**
 * Lấy chỉ dẫn đã được đúc kết cho đúng dòng sản phẩm (không phải trích dẫn
 * prompt gốc) — dùng làm định hướng bổ sung cho generateProductImage() /
 * generateImageForChat(). Luôn trả về object rỗng thay vì throw nếu backend
 * chưa cấu hình hoặc lỗi mạng.
 */
export async function fetchCategoryGuidance(params: { visualStyle: string; productName?: string; productCode?: string; text?: string }): Promise<CategoryGuidanceResult> {
  try {
    const query = new URLSearchParams({ visualStyle: params.visualStyle });
    if (params.productName) query.set('productName', params.productName);
    if (params.productCode) query.set('productCode', params.productCode);
    if (params.text) query.set('text', params.text);
    const res = await fetch(`/api/history/category-guidance?${query.toString()}`);
    const data = await res.json();
    if (!data.success) return { category: null, guidanceText: null };
    return { category: data.category ?? null, guidanceText: data.guidanceText ?? null };
  } catch (err) {
    console.error('Không tải được category guidance (bỏ qua):', err);
    return { category: null, guidanceText: null };
  }
}

/** Xóa 1 ảnh khỏi Lịch sử dùng chung. Trả về true/false, không throw. */
export async function deleteGeneratedImage(id: string): Promise<boolean> {
  try {
    if (!id) return false;
    const res = await fetch(`/api/history/images?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    const data = await res.json();
    return !!data.success;
  } catch (err) {
    console.error('Không xóa được ảnh khỏi Lịch sử dùng chung:', err);
    return false;
  }
}

/** Xóa 1 phiên chat khỏi Lịch sử dùng chung. Trả về true/false, không throw. */
export async function deleteChatHistorySession(id: string): Promise<boolean> {
  try {
    if (!id) return false;
    const res = await fetch(`/api/history/chats?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    const data = await res.json();
    return !!data.success;
  } catch (err) {
    console.error('Không xóa được đoạn chat khỏi Lịch sử dùng chung:', err);
    return false;
  }
}

export async function fetchImageHistory(cursor?: string, limit = 30): Promise<HistoryListResponse<ImageHistoryRecord>> {
  try {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set('cursor', cursor);
    const res = await fetch(`/api/history/images?${params.toString()}`);
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Lỗi kết nối máy chủ.' };
  }
}

export async function fetchChatHistory(cursor?: string, limit = 30): Promise<HistoryListResponse<ChatHistorySession>> {
  try {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set('cursor', cursor);
    const res = await fetch(`/api/history/chats?${params.toString()}`);
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Lỗi kết nối máy chủ.' };
  }
}
