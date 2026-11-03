import { deleteServerWorkflow } from "../../../lib/workflowStore.js";

export default async function handler(req: any, res: any) {
  try {
    const id = (req.query?.id as string) || (req.body?.id as string);
    if (!id) {
      return res.status(400).json({ success: false, error: "Thiếu id quy trình." });
    }
    await deleteServerWorkflow(id);
    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Error in /api/canvas/workflows/delete:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}
