import { getCategoryGuidanceFor } from "../../lib/categoryGuidance.js";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed. Use GET." });
  }
  try {
    const visualStyle = (req.query?.visualStyle as string) || "";
    if (!visualStyle) {
      return res.status(200).json({ success: false, error: "Thiếu visualStyle." });
    }
    const productName = (req.query?.productName as string) || undefined;
    const productCode = (req.query?.productCode as string) || undefined;
    const freeText = (req.query?.text as string) || undefined;
    const result = await getCategoryGuidanceFor({ visualStyle, productName, productCode, freeText });
    return res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    console.error("Error in /api/history/category-guidance:", error.message);
    return res.status(200).json({ success: false, error: error.message, category: null, guidanceText: null });
  }
}
