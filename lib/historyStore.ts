// Logic nghiệp vụ cho tính năng "Lịch sử dùng chung" (ảnh đã tạo + chat).
// Thuần server-side, không phụ thuộc Express/Vercel — server.ts và các file
// trong api/history/ đều gọi thẳng các hàm ở đây.
import { randomUUID } from "crypto";
import { getFirestore, getBucket } from "./googleCloud.js";
import { inferProductCategory, rebuildCategoryGuidanceIfEligible } from "./categoryGuidance.js";

export const HISTORY_NOT_CONFIGURED_ERROR =
  "Tính năng Lịch sử chưa được cấu hình (thiếu GOOGLE_SERVICE_ACCOUNT_JSON hoặc GCS_BUCKET_NAME trên server).";

const READ_URL_EXPIRY_MS = 6 * 60 * 60 * 1000; // 6 giờ
const UPLOAD_URL_EXPIRY_MS = 15 * 60 * 1000; // 15 phút

function extensionForContentType(contentType: string): string {
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  if (contentType === "image/jpeg" || contentType === "image/jpg") return "jpg";
  return "bin";
}

function datePrefix(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}/${mm}/${dd}`;
}

export interface CreateUploadUrlParams {
  folder: "images" | "chat";
  contentType: string;
}

/** Sinh 1 signed URL (PUT) để client upload thẳng ảnh lên Cloud Storage. */
export async function createUploadUrl({ folder, contentType }: CreateUploadUrlParams) {
  const bucket = getBucket();
  if (!bucket) throw new Error(HISTORY_NOT_CONFIGURED_ERROR);

  const path = `${folder}/${datePrefix()}/${randomUUID()}.${extensionForContentType(contentType)}`;

  const [uploadUrl] = await bucket.file(path).getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + UPLOAD_URL_EXPIRY_MS,
    contentType,
  });

  return { path, uploadUrl };
}

async function signReadUrl(bucket: NonNullable<ReturnType<typeof getBucket>>, gcsPath: string): Promise<string | null> {
  if (!gcsPath) return null;
  try {
    const [url] = await bucket.file(gcsPath).getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + READ_URL_EXPIRY_MS,
    });
    return url;
  } catch (err: any) {
    console.error(`Không tạo được signed URL cho ${gcsPath}:`, err.message);
    return null;
  }
}

export interface ImageRecordInput {
  id?: string;
  gcsPath: string;
  productName?: string;
  productCode?: string;
  visualStyle?: string;
  prompt?: string;
  aspectRatio?: string;
  imageSize?: string;
  variant?: number;
  costUSD?: number;
  tokens?: number;
  timestamp?: number;
}

export async function saveImageRecord(input: ImageRecordInput) {
  const db = getFirestore();
  if (!db) throw new Error(HISTORY_NOT_CONFIGURED_ERROR);
  if (!input.gcsPath) throw new Error("Thiếu gcsPath — ảnh phải được upload lên Storage trước.");

  // Dùng id do client cung cấp (trùng với GeneratedImage.id trong gallery cục bộ)
  // nếu có, để sau này có thể "đánh giá" (rate) đúng bản ghi này. Nếu không có
  // (ví dụ lời gọi cũ hơn), tự sinh 1 id mới.
  const id = input.id || randomUUID();
  const record = {
    productName: input.productName || "",
    productCode: input.productCode || "",
    visualStyle: input.visualStyle || "",
    prompt: input.prompt || "",
    aspectRatio: input.aspectRatio || "",
    imageSize: input.imageSize || "",
    variant: input.variant || 1,
    costUSD: input.costUSD || 0,
    tokens: input.tokens || 0,
    gcsPath: input.gcsPath,
    timestamp: input.timestamp || Date.now(),
  };
  await db.collection("imageHistory").doc(id).set(record);
  return { id, ...record };
}

/** Xóa 1 ảnh khỏi Lịch sử dùng chung (chỉ xóa document Firestore, không xóa
 * file trong Cloud Storage — chấp nhận rác object mồ côi trong bucket để
 * giữ thao tác xóa nhanh/đơn giản; dọn bucket định kỳ là việc vận hành). */
export async function deleteImageRecord(id: string): Promise<{ id: string }> {
  const db = getFirestore();
  if (!db) throw new Error(HISTORY_NOT_CONFIGURED_ERROR);
  if (!id) throw new Error("Thiếu id của ảnh cần xóa.");
  await db.collection("imageHistory").doc(id).delete();
  return { id };
}

/** Xóa 1 phiên chat khỏi Lịch sử dùng chung (cùng lưu ý về rác GCS như trên). */
export async function deleteChatSession(id: string): Promise<{ id: string }> {
  const db = getFirestore();
  if (!db) throw new Error(HISTORY_NOT_CONFIGURED_ERROR);
  if (!id) throw new Error("Thiếu id của phiên chat cần xóa.");
  await db.collection("chatHistory").doc(id).delete();
  return { id };
}

export interface RateImageParams {
  id: string;
  rating: "good" | "bad";
}

/**
 * Gắn đánh giá của người dùng ("Rất tốt!" / "Không hẳn") vào 1 bản ghi ảnh
 * đã lưu. Khi rating là "good": suy luận thêm productCategory (dòng sản
 * phẩm) từ productName/productCode đã lưu sẵn trên bản ghi, rồi tổng hợp lại
 * category guidance cho đúng cặp (visualStyle, productCategory) nếu đã đủ
 * mẫu — xem lib/categoryGuidance.ts.
 */
export async function rateImageRecord({ id, rating }: RateImageParams) {
  const db = getFirestore();
  if (!db) throw new Error(HISTORY_NOT_CONFIGURED_ERROR);
  if (!id) throw new Error("Thiếu id của ảnh cần đánh giá.");

  const docRef = db.collection("imageHistory").doc(id);
  const update: Record<string, unknown> = { rating, ratedAt: Date.now() };

  if (rating === "good") {
    const doc = await docRef.get();
    const data = doc.data();
    if (data) {
      const productCategory = await inferProductCategory({
        productName: data.productName,
        productCode: data.productCode,
        visualStyle: data.visualStyle,
      });
      if (productCategory) {
        update.productCategory = productCategory;
        await docRef.set(update, { merge: true });
        await rebuildCategoryGuidanceIfEligible(data.visualStyle, productCategory);
        return { id, rating };
      }
    }
  }

  await docRef.set(update, { merge: true });
  return { id, rating };
}

export interface ListParams {
  limit?: number;
  cursor?: string;
}

export async function listImageRecords({ limit = 30, cursor }: ListParams = {}) {
  const db = getFirestore();
  const bucket = getBucket();
  if (!db || !bucket) throw new Error(HISTORY_NOT_CONFIGURED_ERROR);

  const collection = db.collection("imageHistory");
  let query = collection.orderBy("timestamp", "desc").limit(limit);
  if (cursor) {
    const cursorDoc = await collection.doc(cursor).get();
    if (cursorDoc.exists) query = query.startAfter(cursorDoc);
  }

  const snapshot = await query.get();
  const items = await Promise.all(
    snapshot.docs.map(async (doc) => {
      const data = doc.data() as Omit<ImageRecordInput, "timestamp"> & { timestamp: number };
      const imageUrl = await signReadUrl(bucket, data.gcsPath);
      return { id: doc.id, ...data, imageUrl };
    })
  );

  const nextCursor = snapshot.docs.length === limit ? snapshot.docs[snapshot.docs.length - 1].id : null;
  return { items, nextCursor };
}

export interface ChatMessageRecord {
  id: string;
  role: "user" | "model";
  text: string;
  imageGcsPath?: string;
  uploadedImageGcsPath?: string;
}

export interface ChatSessionInput {
  id: string;
  title: string;
  timestamp: number;
  messages: ChatMessageRecord[];
}

export async function saveChatSession(session: ChatSessionInput) {
  const db = getFirestore();
  if (!db) throw new Error(HISTORY_NOT_CONFIGURED_ERROR);
  if (!session?.id) throw new Error("Thiếu id của phiên chat.");

  await db
    .collection("chatHistory")
    .doc(session.id)
    .set({
      title: session.title || "Đoạn chat",
      timestamp: session.timestamp || Date.now(),
      messages: session.messages || [],
    });

  return { id: session.id };
}

export async function listChatSessions({ limit = 30, cursor }: ListParams = {}) {
  const db = getFirestore();
  const bucket = getBucket();
  if (!db || !bucket) throw new Error(HISTORY_NOT_CONFIGURED_ERROR);

  const collection = db.collection("chatHistory");
  let query = collection.orderBy("timestamp", "desc").limit(limit);
  if (cursor) {
    const cursorDoc = await collection.doc(cursor).get();
    if (cursorDoc.exists) query = query.startAfter(cursorDoc);
  }

  const snapshot = await query.get();
  const items = await Promise.all(
    snapshot.docs.map(async (doc) => {
      const data = doc.data() as { title: string; timestamp: number; messages: ChatMessageRecord[] };
      const messages = await Promise.all(
        (data.messages || []).map(async (msg) => ({
          id: msg.id,
          role: msg.role,
          text: msg.text,
          imageUrl: msg.imageGcsPath ? await signReadUrl(bucket, msg.imageGcsPath) : undefined,
          uploadedImageUrl: msg.uploadedImageGcsPath ? await signReadUrl(bucket, msg.uploadedImageGcsPath) : undefined,
        }))
      );
      return { id: doc.id, title: data.title, timestamp: data.timestamp, messages };
    })
  );

  const nextCursor = snapshot.docs.length === limit ? snapshot.docs[snapshot.docs.length - 1].id : null;
  return { items, nextCursor };
}
