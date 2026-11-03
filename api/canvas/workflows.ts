import {
  listServerWorkflows,
  saveServerWorkflow,
  deleteServerWorkflow,
} from "../../lib/workflowStore.js";

export default async function handler(req: any, res: any) {
  try {
    if (req.method === "GET") {
      const list = await listServerWorkflows();
      return res.status(200).json({ success: true, items: list });
    }

    if (req.method === "POST") {
      if (req.body?.action === 'delete' || req.query?.action === 'delete') {
        const id = (req.body?.id as string) || (req.query?.id as string);
        if (!id) {
          return res.status(400).json({ success: false, error: "Thiếu id quy trình." });
        }
        await deleteServerWorkflow(id);
        return res.status(200).json({ success: true });
      }
      const workflow = await saveServerWorkflow(req.body || {});
      return res.status(200).json({ success: true, workflow });
    }

    if (req.method === "DELETE") {
      const id = (req.query?.id as string) || (req.body?.id as string);
      if (!id) {
        return res.status(400).json({ success: false, error: "Thiếu id quy trình." });
      }
      await deleteServerWorkflow(id);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, error: "Method not allowed. Use GET, POST or DELETE." });
  } catch (error: any) {
    console.error("Error in /api/canvas/workflows:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}
