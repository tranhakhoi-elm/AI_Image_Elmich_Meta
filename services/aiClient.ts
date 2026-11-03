// ============================================================================
// aiClient — nhà máy tạo client AI theo nhà cung cấp đang chọn:
// - GEMINI: GoogleGenAI thật (hành vi gốc của app).
// - META: MetaAdapter (metaAdapter.ts) — cùng bề mặt models.generateContent
//   nhưng dịch sang Meta Model API (Muse Spark cho chữ/suy luận; ảnh đi
//   đường riêng qua metaService).
// Mọi hàm trong geminiService.ts và lib/categoryGuidance.ts tạo client qua
// đây thay vì `new GoogleGenAI(...)` trực tiếp.
// ============================================================================

import { GoogleGenAI } from '@google/genai';
import { isMetaProvider } from './metaService';
import { createMetaAiClient } from './metaAdapter';

let metaClientInstance: any = null;

export const createAiClient = (): any => {
  if (isMetaProvider()) {
    if (!metaClientInstance) metaClientInstance = createMetaAiClient();
    return metaClientInstance;
  }
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};
