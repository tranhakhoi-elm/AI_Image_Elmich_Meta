// Vercel route — Meta Model API proxy cho phần CHỮ/SUY LUẬN (Muse Spark qua
// Chat Completions), bản song song của route POST /api/meta/chat trong
// server.ts. Dùng bởi services/metaAdapter.ts ở phía client.
// Khóa lấy từ header `x-meta-api-key` hoặc biến môi trường META_MODEL_API_KEY.
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Phương thức không hỗ trợ' });
  }

  try {
    const apiKey = req.headers['x-meta-api-key'] || process.env.META_MODEL_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error:
          'Chưa cấu hình biến môi trường META_MODEL_API_KEY trên server. Vào Vercel → Settings → Environment Variables, thêm biến này rồi deploy lại.',
      });
    }
    const { model, messages, response_format, temperature, top_p, max_tokens } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, error: 'Thiếu messages.' });
    }
    const payload: any = { model: model || 'muse-spark-1.3', messages };
    if (response_format) payload.response_format = response_format;
    if (temperature !== undefined) payload.temperature = temperature;
    if (top_p !== undefined) payload.top_p = top_p;
    if (max_tokens !== undefined) payload.max_tokens = max_tokens;

    const metaRes = await fetch('https://api.meta.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(240_000),
    });
    const data: any = await metaRes.json().catch(() => null);
    if (!metaRes.ok) {
      const message =
        data?.error?.message ||
        (typeof data?.error === 'string' ? data.error : null) ||
        `Meta Model API trả lỗi HTTP ${metaRes.status}`;
      return res.status(metaRes.status || 502).json({ success: false, error: message });
    }
    return res.json(data);
  } catch (error: any) {
    console.error('Vercel Meta chat API error:', error?.message || error);
    return res
      .status(502)
      .json({ success: false, error: error?.message || 'Không gọi được Meta Model API' });
  }
}
