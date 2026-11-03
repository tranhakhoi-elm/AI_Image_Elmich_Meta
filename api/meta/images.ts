// Vercel route — Meta Model API proxy (Muse Image 1.0), bản song song của
// route POST /api/meta/images trong server.ts (khi tự host bằng Express).
// Khóa lấy từ header `x-meta-api-key` (người dùng nhập trong app) hoặc
// biến môi trường META_MODEL_API_KEY trên Vercel.

// Gắn gợi ý tiếng Việt cho lỗi billing/subscription của Muse Image: model
// ảnh TỪ CHỐI key dạng subscription dù key đó vẫn dùng được cho chữ/suy
// luận — chỉ nhận key pay-as-you-go đã bật billing (xác nhận từ tài liệu
// Meta và các bản tích hợp độc lập đã chạy thật).
const withBillingHint = (message) => {
  if (/subscription|billing|pay-as-you-go|not available/i.test(message)) {
    return (
      message +
      " — Gợi ý: Muse Image chỉ nhận API key dạng TRẢ-THEO-LƯỢT (pay-as-you-go) đã bật Billing tại dev.meta.ai. Key dạng subscription vẫn dùng được cho chữ/phân tích nhưng sẽ bị từ chối khi tạo ảnh. Hãy tạo key mới ở mục API keys sau khi đã thêm phương thức thanh toán, rồi dán thay key cũ trong app."
    );
  }
  return message;
};

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
    const { mode, prompt, images, size, output_format } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ success: false, error: 'Thiếu prompt.' });
    }
    const isEdit = mode === 'edit';
    if (isEdit && (!Array.isArray(images) || images.length === 0)) {
      return res
        .status(400)
        .json({ success: false, error: 'Chế độ sửa ảnh cần ít nhất 1 ảnh tham chiếu.' });
    }

    const payload: any = {
      model: 'muse-image-1.0',
      prompt,
      output_format: output_format || 'png',
    };
    if (size) payload.size = size;
    if (isEdit) {
      payload.images = images.slice(0, 10).map((u: string) => ({ image_url: u }));
    }

    const metaRes = await fetch(
      `https://api.meta.ai/v1/images/${isEdit ? 'edits' : 'generations'}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
        // Muse Image là model tự suy luận nên có thể chạy lâu — trần 240s.
        signal: AbortSignal.timeout(240_000),
      }
    );
    const data: any = await metaRes.json().catch(() => null);
    const b64 = data?.data?.[0]?.b64_json;
    const url = data?.data?.[0]?.url;
    if (!metaRes.ok || (!b64 && !url)) {
      const message =
        data?.error?.message ||
        (typeof data?.error === 'string' ? data.error : null) ||
        `Meta Model API trả lỗi HTTP ${metaRes.status}`;
      return res.status(metaRes.status || 502).json({ success: false, error: withBillingHint(message) });
    }
    const image = b64 ? `data:image/${output_format || 'png'};base64,${b64}` : url;
    return res.json({ success: true, image });
  } catch (error: any) {
    console.error('Vercel Meta API error:', error?.message || error);
    return res
      .status(502)
      .json({ success: false, error: error?.message || 'Không gọi được Meta Model API' });
  }
}
