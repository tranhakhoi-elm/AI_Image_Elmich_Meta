import { createUploadUrl } from "../../lib/historyStore.js";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed. Use POST." });
  }

  try {
    const { folder, contentType } = req.body || {};
    if (folder !== "images" && folder !== "chat") {
      return res.status(400).json({ success: false, error: "folder phải là 'images' hoặc 'chat'." });
    }
    const result = await createUploadUrl({ folder, contentType: contentType || "image/png" });
    return res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    console.error("Error creating history upload URL:", error.message);
    return res.status(200).json({ success: false, error: error.message });
  }
}
