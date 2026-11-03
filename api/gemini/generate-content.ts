import { GoogleGenAI } from '@google/genai';

let geminiClientInstance: GoogleGenAI | null = null;
const getGeminiClient = () => {
  if (!geminiClientInstance) {
    geminiClientInstance = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClientInstance;
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Phương thức không hỗ trợ' });
  }

  try {
    const { model, contents, config } = req.body || {};
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: model || 'gemini-3.8-flash',
      contents,
      config,
    });
    return res.json({ success: true, response });
  } catch (error: any) {
    console.error('Vercel Gemini API error:', error?.message || error);
    const status = error?.status || (error?.message?.includes('403') ? 403 : 500);
    return res.status(status).json({
      success: false,
      error: error?.message || 'Lỗi xử lý Gemini',
      status: error?.status,
    });
  }
}

