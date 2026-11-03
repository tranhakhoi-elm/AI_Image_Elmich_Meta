import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import {
  createUploadUrl,
  saveImageRecord,
  listImageRecords,
  deleteImageRecord,
  saveChatSession,
  listChatSessions,
  deleteChatSession,
  rateImageRecord,
} from "./lib/historyStore.js";
import { getCategoryGuidanceFor } from "./lib/categoryGuidance.js";
import {
  listServerWorkflows,
  saveServerWorkflow,
  deleteServerWorkflow,
} from "./lib/workflowStore.js";
import { GoogleGenAI } from "@google/genai";

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

const app = express();
const PORT = 3000;

// Set high limits for file upload data URLs (images)
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Google Sheets integration API using Service Account
import { google } from "googleapis";

app.post("/api/sheets/report", async (req: any, res: any) => {
  const { values } = req.body;
  
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) {
    return res.status(200).json({ success: false, error: "GOOGLE_SHEET_ID is missing in environment variables." });
  }

  let auth: any;

  try {
    // PREFERRED WAY: Read the entire JSON file content from a single env variable
    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    
    if (serviceAccountJson) {
      let credentials;
      try {
        credentials = JSON.parse(serviceAccountJson);
      } catch (parseError: any) {
        return res.status(200).json({
          success: false,
          error: "GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON. Vercel sometimes breaks formatting. Try removing newlines before pasting, or check for missing quotes. Detail: " + parseError.message
        });
      }
      
      auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    } else {
      // FALLBACK WAY: Parse from separate email and private_key variables
      const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
      let privateKey = process.env.GOOGLE_PRIVATE_KEY || '';
      
      if (!clientEmail || !privateKey) {
         return res.status(200).json({ 
           success: false, 
           error: "Google Sheets credentials (GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY) are missing." 
         });
      }

      // Cleanup fallback key (in case of copy-paste formatting issues)
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.replace(/^"|"$/g, '');
      }
      privateKey = privateKey.replace(/\\n/g, '\n');

      auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    }

    const sheets = google.sheets({ version: 'v4', auth });
    
    // Dynamically fetch the name of the first sheet to avoid "Unable to parse range: Sheet1" errors
    // (e.g. if the user's Google Sheets is in Vietnamese, it defaults to "Trang tính1")
    let targetRange = 'Sheet1!A:A';
    try {
      const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
      if (meta.data.sheets && meta.data.sheets.length > 0) {
        const sheetTitle = meta.data.sheets[0].properties?.title || 'Sheet1';
        targetRange = `${sheetTitle}!A:A`;
      }
    } catch (metaError: any) {
      console.warn("Could not fetch spreadsheet metadata. Using default 'Sheet1'.", metaError.message);
    }
    
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: targetRange,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: values
      }
    });

    res.json({ success: true, data: response.data });
  } catch (error: any) {
    console.error("Error reporting to Google Sheets:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Lịch sử dùng chung (ảnh đã tạo & chat) — lưu qua Firestore + Cloud Storage,
// dùng chung Service Account với tích hợp Google Sheets ở trên.
// Xem lib/historyStore.ts và ARCHITECTURE.md để biết chi tiết thiết kế.
app.post("/api/history/upload-url", async (req: any, res: any) => {
  try {
    const { folder, contentType } = req.body || {};
    if (folder !== "images" && folder !== "chat") {
      return res.status(400).json({ success: false, error: "folder phải là 'images' hoặc 'chat'." });
    }
    const result = await createUploadUrl({ folder, contentType: contentType || "image/png" });
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Error creating history upload URL:", error.message);
    res.status(200).json({ success: false, error: error.message });
  }
});

app.post("/api/history/images", async (req: any, res: any) => {
  try {
    const record = await saveImageRecord(req.body || {});
    res.json({ success: true, record });
  } catch (error: any) {
    console.error("Error saving image history record:", error.message);
    res.status(200).json({ success: false, error: error.message });
  }
});

app.get("/api/history/images", async (req: any, res: any) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 30, 100);
    const cursor = (req.query.cursor as string) || undefined;
    const result = await listImageRecords({ limit, cursor });
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Error listing image history:", error.message);
    res.status(200).json({ success: false, error: error.message, items: [] });
  }
});

app.post("/api/history/chats", async (req: any, res: any) => {
  try {
    const result = await saveChatSession(req.body || {});
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Error saving chat history:", error.message);
    res.status(200).json({ success: false, error: error.message });
  }
});

app.get("/api/history/chats", async (req: any, res: any) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 30, 100);
    const cursor = (req.query.cursor as string) || undefined;
    const result = await listChatSessions({ limit, cursor });
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Error listing chat history:", error.message);
    res.status(200).json({ success: false, error: error.message, items: [] });
  }
});

// Đánh giá 1 ảnh đã tạo ("Rất tốt!" / "Không hẳn") — dùng để định hướng các
// lần tạo ảnh sau (xem lib/categoryGuidance.ts + generateProductImage).
app.post("/api/history/rate-image", async (req: any, res: any) => {
  try {
    const { id, rating } = req.body || {};
    if (rating !== "good" && rating !== "bad") {
      return res.status(200).json({ success: false, error: "rating phải là 'good' hoặc 'bad'." });
    }
    const result = await rateImageRecord({ id, rating });
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Error rating image history record:", error.message);
    res.status(200).json({ success: false, error: error.message });
  }
});

app.delete("/api/history/images", async (req: any, res: any) => {
  try {
    const id = (req.query.id as string) || undefined;
    const result = await deleteImageRecord(id as string);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Error deleting image history record:", error.message);
    res.status(200).json({ success: false, error: error.message });
  }
});

app.delete("/api/history/chats", async (req: any, res: any) => {
  try {
    const id = (req.query.id as string) || undefined;
    const result = await deleteChatSession(id as string);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Error deleting chat session:", error.message);
    res.status(200).json({ success: false, error: error.message });
  }
});

app.get("/api/history/category-guidance", async (req: any, res: any) => {
  try {
    const visualStyle = (req.query.visualStyle as string) || "";
    if (!visualStyle) {
      return res.status(200).json({ success: false, error: "Thiếu visualStyle." });
    }
    const productName = (req.query.productName as string) || undefined;
    const productCode = (req.query.productCode as string) || undefined;
    const freeText = (req.query.text as string) || undefined;
    const result = await getCategoryGuidanceFor({ visualStyle, productName, productCode, freeText });
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Error getting category guidance:", error.message);
    res.status(200).json({ success: false, error: error.message, category: null, guidanceText: null });
  }
});

// Canvas Workflows API - Lưu trữ quy trình lên server hệ thống (Git / File system / Firestore)
app.get("/api/canvas/workflows", async (req: any, res: any) => {
  try {
    const list = await listServerWorkflows();
    res.json({ success: true, items: list });
  } catch (error: any) {
    console.error("Error listing canvas workflows:", error.message);
    res.status(200).json({ success: false, error: error.message, items: [] });
  }
});

app.post("/api/canvas/workflows", async (req: any, res: any) => {
  try {
    if (req.body?.action === 'delete' && req.body?.id) {
      await deleteServerWorkflow(req.body.id);
      return res.json({ success: true });
    }
    const workflow = await saveServerWorkflow(req.body || {});
    res.json({ success: true, workflow });
  } catch (error: any) {
    console.error("Error saving canvas workflow:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Dedicated POST fallback delete route for environments where DELETE method is restricted
app.post("/api/canvas/workflows/delete", async (req: any, res: any) => {
  try {
    const id = (req.query?.id as string) || (req.body?.id as string);
    if (!id) {
      return res.status(400).json({ success: false, error: "Thiếu id quy trình." });
    }
    await deleteServerWorkflow(id);
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting canvas workflow via POST fallback:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete("/api/canvas/workflows", async (req: any, res: any) => {
  try {
    const id = (req.query.id as string) || (req.body?.id as string);
    if (!id) {
      return res.status(400).json({ success: false, error: "Thiếu id quy trình." });
    }
    await deleteServerWorkflow(id);
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting canvas workflow:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Server-side Gemini API proxy (bảo mật khóa API & tránh lỗi quyền 403 trình duyệt)
let geminiClientInstance: GoogleGenAI | null = null;
const getGeminiClient = () => {
  if (!geminiClientInstance) {
    geminiClientInstance = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClientInstance;
};

app.post("/api/gemini/generate-content", async (req: any, res: any) => {
  try {
    const { model, contents, config } = req.body;
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: model || "gemini-3.8-flash",
      contents,
      config,
    });
    res.json({ success: true, response });
  } catch (error: any) {
    console.error("Gemini server API error:", error?.message || error);
    const status = error?.status || (error?.message?.includes('403') ? 403 : 500);
    res.status(status).json({
      success: false,
      error: error?.message || "Lỗi xử lý Gemini",
      status: error?.status,
    });
  }
});

// Server-side Meta Model API proxy (Muse Image 1.0) — khóa KHÔNG nhúng vào
// bundle client: lấy từ header `x-meta-api-key` (người dùng nhập trong app)
// hoặc biến môi trường META_MODEL_API_KEY phía server.
app.post("/api/meta/images", async (req: any, res: any) => {
  try {
    const apiKey = req.headers["x-meta-api-key"] || process.env.META_MODEL_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error:
          "Chưa cấu hình Meta Model API key. Nhập key trong app (nút Meta AI ở góc phải) hoặc đặt biến môi trường META_MODEL_API_KEY trên server.",
      });
    }
    const { mode, prompt, images, size, output_format } = req.body || {};
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ success: false, error: "Thiếu prompt." });
    }
    const isEdit = mode === "edit";
    if (isEdit && (!Array.isArray(images) || images.length === 0)) {
      return res.status(400).json({ success: false, error: "Chế độ sửa ảnh cần ít nhất 1 ảnh tham chiếu." });
    }

    const payload: any = {
      model: "muse-image-1.0",
      prompt,
      output_format: output_format || "png",
    };
    if (size) payload.size = size;
    if (isEdit) {
      payload.images = images.slice(0, 10).map((u: string) => ({ image_url: u }));
    }

    const metaRes = await fetch(
      `https://api.meta.ai/v1/images/${isEdit ? "edits" : "generations"}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
        // Muse Image là model tự suy luận nên có thể chạy lâu — trần 240s
        // để trả lỗi rõ ràng thay vì treo kết nối.
        signal: AbortSignal.timeout(240_000),
      }
    );
    const data: any = await metaRes.json().catch(() => null);
    const b64 = data?.data?.[0]?.b64_json;
    const url = data?.data?.[0]?.url;
    if (!metaRes.ok || (!b64 && !url)) {
      const message =
        data?.error?.message ||
        (typeof data?.error === "string" ? data.error : null) ||
        `Meta Model API trả lỗi HTTP ${metaRes.status}`;
      return res.status(metaRes.status || 502).json({ success: false, error: message });
    }
    const image = b64
      ? `data:image/${output_format || "png"};base64,${b64}`
      : url;
    return res.json({ success: true, image });
  } catch (error: any) {
    console.error("Meta server API error:", error?.message || error);
    return res
      .status(502)
      .json({ success: false, error: error?.message || "Không gọi được Meta Model API" });
  }
});

// Vite middleware for development or serving built static files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: any, res: any) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
