import { rateImageRecord } from "../../lib/historyStore.js";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed. Use POST." });
  }
  try {
    const { id, rating } = req.body || {};
    if (rating !== "good" && rating !== "bad") {
      return res.status(200).json({ success: false, error: "rating phải là 'good' hoặc 'bad'." });
    }
    const result = await rateImageRecord({ id, rating });
    return res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    console.error("Error in /api/history/rate-image:", error.message);
    return res.status(200).json({ success: false, error: error.message });
  }
}
