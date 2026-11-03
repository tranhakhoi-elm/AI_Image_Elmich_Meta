// ============================================================================
// MetaAdapter — lớp dịch để TOÀN BỘ phần chữ/suy luận của app (vốn viết cho
// Google GenAI SDK) chạy được trên Meta Model API mà không phải sửa từng
// hàm: adapter nhận đúng tham số `models.generateContent({ model, contents,
// config })` kiểu Gemini và dịch sang Chat Completions (OpenAI-compatible)
// của Meta, model `muse-spark-1.3`, qua proxy /api/meta/chat.
//
// Điểm khác biệt Gemini → Meta đã được xử lý tại đây:
// - contents (string | { parts } | mảng { role, parts }) → messages.
// - part inlineData (ảnh base64) → image_url dạng data URI (Muse Spark
//   hiểu ảnh đầu vào).
// - config.systemInstruction → message role "system".
// - config.responseMimeType "application/json" + responseSchema (cú pháp
//   Type của Google) → response_format json_schema (JSON Schema chuẩn).
//   Nếu Meta từ chối json_schema, tự lùi về json_object rồi về không ép
//   định dạng (các hàm trong app đều tự parse JSON từ text trả về).
// - Mọi model chữ của Gemini (flash/pro...) → muse-spark-1.3.
// - Chi phí: adapter tự báo cáo về Lark theo BẢNG GIÁ META và KHÔNG trả
//   usageMetadata, để trackGeminiUsage phía app không tính trùng theo giá
//   Gemini.
// - Model ẢNH không đi qua đây: các hàm ảnh đã rẽ sang endpoint images
//   (metaService) trước khi tới generateContent.
// ============================================================================

import { reportToLark, calculateMetaTextCost } from './metricsService';

export const META_TEXT_MODEL = 'muse-spark-1.3';

const TYPE_MAP: Record<string, string> = {
  OBJECT: 'object',
  STRING: 'string',
  NUMBER: 'number',
  INTEGER: 'integer',
  BOOLEAN: 'boolean',
  ARRAY: 'array',
};

/** Dịch responseSchema kiểu Google (Type.OBJECT...) sang JSON Schema. */
const translateSchema = (schema: any): any => {
  if (Array.isArray(schema)) return schema.map(translateSchema);
  if (!schema || typeof schema !== 'object') return schema;
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(schema)) {
    if (key === 'type' && typeof value === 'string') {
      out.type = TYPE_MAP[value.toUpperCase()] || value.toLowerCase();
    } else if (key === 'properties' && value && typeof value === 'object') {
      out.properties = Object.fromEntries(
        Object.entries(value as Record<string, any>).map(([k, v]) => [k, translateSchema(v)])
      );
    } else if (key === 'items') {
      out.items = translateSchema(value);
    } else if (['required', 'enum', 'description', 'format', 'additionalProperties', 'anyOf', 'oneOf', 'allOf'].includes(key)) {
      out[key] = key === 'anyOf' || key === 'oneOf' || key === 'allOf' ? translateSchema(value) : value;
    }
    // Bỏ qua các khóa riêng của Google không thuộc JSON Schema chuẩn.
  }
  return out;
};

const partToContentItem = (part: any): any => {
  if (!part) return null;
  if (typeof part === 'string') return { type: 'text', text: part };
  if (part.text !== undefined) return { type: 'text', text: String(part.text) };
  if (part.inlineData?.data) {
    return {
      type: 'image_url',
      image_url: { url: `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}` },
    };
  }
  return null;
};

const partsToContent = (parts: any[]): string | any[] => {
  const items = (parts || []).map(partToContentItem).filter(Boolean);
  if (items.length === 1 && items[0].type === 'text') return items[0].text;
  return items;
};

const contentsToMessages = (contents: any, config: any): any[] => {
  const messages: any[] = [];

  const systemInstruction = config?.systemInstruction;
  if (systemInstruction) {
    const text =
      typeof systemInstruction === 'string'
        ? systemInstruction
        : (systemInstruction.parts || []).map((p: any) => p?.text || '').join('\n');
    if (text) messages.push({ role: 'system', content: text });
  }

  if (typeof contents === 'string') {
    messages.push({ role: 'user', content: contents });
  } else if (Array.isArray(contents)) {
    for (const item of contents) {
      if (typeof item === 'string') {
        messages.push({ role: 'user', content: item });
      } else if (item?.parts) {
        const role = item.role === 'model' || item.role === 'assistant' ? 'assistant' : 'user';
        messages.push({ role, content: partsToContent(item.parts) });
      } else if (item?.text) {
        messages.push({ role: 'user', content: String(item.text) });
      }
    }
  } else if (contents?.parts) {
    messages.push({ role: 'user', content: partsToContent(contents.parts) });
  } else if (contents?.text) {
    messages.push({ role: 'user', content: String(contents.text) });
  }

  return messages;
};

const reportMetaUsage = (usage: any) => {
  try {
    if (!usage) return;
    const { tokens, costUSD } = calculateMetaTextCost(
      usage.prompt_tokens || 0,
      usage.completion_tokens || 0
    );
    if (tokens === 0) return;
    const productCode = localStorage.getItem('elmich_ai_product_code') || 'N/A';
    const productName = localStorage.getItem('elmich_ai_product_name') || 'Nhiệm vụ AI';
    reportToLark(productCode, productName, tokens, costUSD, 'AI Meta (Muse Spark)');
  } catch (error) {
    console.error('Failed to track Meta usage:', error);
  }
};

const callMetaChat = async (body: Record<string, any>): Promise<any> => {
  const res = await fetch('/api/meta/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json: any = await res.json().catch(() => null);
  if (!res.ok) {
    const err: any = new Error(
      json?.error || `Meta Model API lỗi (HTTP ${res.status}). Kiểm tra API key và số dư.`
    );
    err.status = res.status;
    throw err;
  }
  return json;
};

const metaGenerateContent = async (params: {
  model?: string;
  contents: any;
  config?: any;
}): Promise<any> => {
  const { model, contents, config } = params || ({} as any);

  if (model && /image/i.test(model)) {
    throw new Error(
      `Model ảnh "${model}" không chạy qua kênh chữ của Meta — luồng ảnh dùng endpoint images riêng (metaService).`
    );
  }

  const messages = contentsToMessages(contents, config);
  if (messages.length === 0) throw new Error('Không có nội dung gửi cho Meta.');

  const baseBody: Record<string, any> = { model: META_TEXT_MODEL, messages };
  if (config?.temperature !== undefined) baseBody.temperature = config.temperature;
  if (config?.topP !== undefined) baseBody.top_p = config.topP;
  if (config?.maxOutputTokens !== undefined) baseBody.max_tokens = config.maxOutputTokens;

  // Chuỗi lùi định dạng JSON: json_schema → json_object → không ép.
  const formatVariants: (Record<string, any> | undefined)[] = [];
  if (config?.responseMimeType === 'application/json') {
    if (config?.responseSchema) {
      formatVariants.push({
        type: 'json_schema',
        json_schema: {
          name: 'structured_response',
          schema: translateSchema(config.responseSchema),
          strict: false,
        },
      });
    }
    formatVariants.push({ type: 'json_object' });
  }
  formatVariants.push(undefined);

  let lastError: any = null;
  for (const responseFormat of formatVariants) {
    try {
      const body = { ...baseBody };
      if (responseFormat) body.response_format = responseFormat;
      const data = await callMetaChat(body);
      const message = data?.choices?.[0]?.message;
      const text =
        typeof message?.content === 'string'
          ? message.content
          : Array.isArray(message?.content)
            ? message.content.map((c: any) => c?.text || '').join('')
            : '';
      reportMetaUsage(data?.usage);
      return {
        text,
        candidates: [{ content: { role: 'model', parts: [{ text }] } }],
        // Cố ý không trả usageMetadata: chi phí đã báo cáo theo giá Meta ở
        // trên; trả thêm sẽ khiến trackGeminiUsage tính trùng theo giá Gemini.
        usageMetadata: undefined,
      };
    } catch (error: any) {
      lastError = error;
      // Chỉ lùi định dạng khi lỗi nhiều khả năng do response_format (HTTP 400).
      if (error?.status !== 400) throw error;
    }
  }
  throw lastError || new Error('Meta Model API không phản hồi.');
};

/** Client giả lập GoogleGenAI ở đúng bề mặt app đang dùng: models.generateContent. */
export const createMetaAiClient = () => ({
  models: {
    generateContent: metaGenerateContent,
  },
});
