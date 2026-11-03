export interface TokenUsageReport {
  productCode: string;
  productName: string;
  tokenCount: number;
  costUSD: number;
}

// Keep an in-memory or localStorage cache for current session totals
export function updateSessionStats(tokens: number, costUSD: number) {
  try {
    const sessionTokens = parseInt(sessionStorage.getItem('elmich_session_tokens') || '0', 10);
    const sessionCost = parseFloat(sessionStorage.getItem('elmich_session_cost') || '0');
    
    sessionStorage.setItem('elmich_session_tokens', (sessionTokens + tokens).toString());
    sessionStorage.setItem('elmich_session_cost', (sessionCost + costUSD).toString());
  } catch (e) {
    console.error("Failed to update session stats:", e);
  }
}

export function calculateGeminiCost(modelName: string, promptTokens: number, candidatesTokens: number): { tokens: number; costUSD: number } {
  // Bảng giá Gemini text — cập nhật theo https://ai.google.dev/gemini-api/docs/pricing
  // (Standard tier, ≤200K token/prompt — mọi prompt trong app đều nằm trong ngưỡng này):
  // - gemini-3.8-flash / flash models: $0.30 / 1M input (text/image/video), $2.50 / 1M output.
  // - gemini-3.1-pro-preview (và các bản "pro" khác): $1.25 / 1M input, $10.00 / 1M output.
  let inputPricePerM = 0.30;
  let outputPricePerM = 2.50;

  if (modelName.includes("pro")) {
    inputPricePerM = 1.25;
    outputPricePerM = 10.00;
  }

  const costUSD = (promptTokens * inputPricePerM / 1000000) + (candidatesTokens * outputPricePerM / 1000000);
  return {
    tokens: promptTokens + candidatesTokens,
    costUSD: Math.round(costUSD * 100000) / 100000
  };
}

// Giá xuất ảnh theo độ phân giải (Standard tier) — cập nhật theo
// https://ai.google.dev/gemini-api/docs/pricing:
// - gemini-3.1-flash-image (Nano Banana 2): output ảnh $60/1M token.
//   1K (1120 token) = $0.067/ảnh, 2K (1680 token) = $0.101/ảnh, 4K (2520 token) = $0.151/ảnh.
// - gemini-3-pro-image (Nano Banana Pro): output ảnh $120/1M token.
//   1K/2K (1120 token) = $0.134/ảnh, 4K (2000 token) = $0.24/ảnh.
const FLASH_IMAGE_PRICE_PER_IMAGE: Record<string, number> = { '1K': 0.067, '2K': 0.101, '4K': 0.151 };
const PRO_IMAGE_PRICE_PER_IMAGE: Record<string, number> = { '1K': 0.134, '2K': 0.134, '4K': 0.24 };

export function calculateImagenCost(modelName: string, numImages: number = 1, imageSize?: string): { tokens: number; costUSD: number } {
  const priceTable = modelName.includes("pro") ? PRO_IMAGE_PRICE_PER_IMAGE : FLASH_IMAGE_PRICE_PER_IMAGE;
  const perImageUSD = priceTable[imageSize || '1K'] ?? priceTable['1K'];

  const costUSD = perImageUSD * numImages;
  return {
    tokens: 0,
    costUSD: Math.round(costUSD * 1000) / 1000
  };
}

export async function reportToLark(productCode: string, productName: string, tokenCount: number, costUSD: number, taskName: string = "Không xác định") {
  // Always update session statistics locally first
  updateSessionStats(tokenCount, costUSD);

  try {
    // Chỉ lấy Ngày Tháng Năm (Định dạng DD/MM/YYYY)
    const now = new Date();
    const dateOnlyString = now.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }); 
    // Trả về dd/mm/yyyy

    const payload = {
      values: [
        [
          productCode || "N/A",
          productName || "Không xác định",
          tokenCount,
          costUSD,
          dateOnlyString,
          taskName
        ]
      ]
    };

    const response = await fetch("/api/sheets/report", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (data.error) {
       console.error("Error from Google Sheets:", data.error);
       return { success: false, error: data.error };
    }
    return { success: true, data };
  } catch (error) {
    console.error("Error pushing metrics to Google Sheets:", error);
    return { success: false, error };
  }
}
