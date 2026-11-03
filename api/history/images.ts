import { saveImageRecord, listImageRecords, deleteImageRecord } from "../../lib/historyStore.js";

export default async function handler(req: any, res: any) {
  try {
    if (req.method === "POST") {
      const record = await saveImageRecord(req.body || {});
      return res.status(200).json({ success: true, record });
    }

    if (req.method === "GET") {
      const limit = Math.min(parseInt(req.query?.limit as string, 10) || 30, 100);
      const cursor = (req.query?.cursor as string) || undefined;
      const result = await listImageRecords({ limit, cursor });
      return res.status(200).json({ success: true, ...result });
    }

    if (req.method === "DELETE") {
      const id = (req.query?.id as string) || undefined;
      const result = await deleteImageRecord(id as string);
      return res.status(200).json({ success: true, ...result });
    }

    return res.status(405).json({ success: false, error: "Method not allowed. Use GET, POST or DELETE." });
  } catch (error: any) {
    console.error("Error in /api/history/images:", error.message);
    return res.status(200).json({ success: false, error: error.message, items: [] });
  }
}
