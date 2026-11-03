# ELMICH AI DESIGN STUDIO — SỔ TAY HƯỚNG DẪN & KỸ NĂNG (HANDBOOK & SKILLS)

> **Phiên bản:** 2.7 — cập nhật khớp với code thực tế (2026-09-12)
> **Đơn vị phát triển:** Elmich Vietnam — Bộ phận Thiết kế Đồ họa & Công nghệ Sáng tạo
> **Nền tảng:** React 19 + Vite + Express + Google Gemini Multimodal SDK (`@google/genai`)
>
> Tài liệu liên quan: [ARCHITECTURE.md](ARCHITECTURE.md) (chi tiết kỹ thuật,
> nợ kỹ thuật, rủi ro bảo mật), [SKILLS.md](SKILLS.md) (hệ thống skill file
> theo từng workflow), [GEMINI.md](GEMINI.md) (bảng model & mẫu prompt),
> [AGENTS.md](AGENTS.md) (quy tắc cho AI coding agent làm việc trên repo).

---

## MỤC LỤC

1. [TỔNG QUAN HỆ THỐNG & SỨ MỆNH](#1-tổng-quan-hệ-thống--sứ-mệnh)
2. [KIẾN TRÚC KỸ THUẬT (TÓM TẮT)](#2-kiến-trúc-kỹ-thuật-tóm-tắt)
3. [11 CÔNG CỤ CHUYÊN BIỆT CỦA STUDIO](#3-11-công-cụ-chuyên-biệt-của-studio)
4. [HỆ THỐNG SKILL FILE (PROMPT CHUẨN HÓA)](#4-hệ-thống-skill-file-prompt-chuẩn-hóa)
5. [KỸ NĂNG CHUYÊN SÂU: DỊCH BAO BÌ TỰ ĐỘNG CHO CONTENT](#5-kỹ-năng-chuyên-sâu-dịch-bao-bì-tự-động-cho-content)
6. [KỸ NĂNG CHUYÊN SÂU: KIỂM DUYỆT BAO BÌ ĐỐI CHIẾU EXCEL](#6-kỹ-năng-chuyên-sâu-kiểm-duyệt-bao-bì-đối-chiếu-excel)
7. [QUY TẮC PROMPT ENGINEERING CHUẨN ELMICH](#7-quy-tắc-prompt-engineering-chuẩn-elmich)
8. [DỰ TOÁN CHI PHÍ & TÍNH TOÁN TOKEN (ANALYTICS)](#8-dự-toán-chi-phí--tính-toán-token-analytics)
9. [TÍCH HỢP DOANH NGHIỆP: GOOGLE SHEETS & LỊCH SỬ DÙNG CHUNG](#9-tích-hợp-doanh-nghiệp-google-sheets--lịch-sử-dùng-chung)
10. [BẢO MẬT & GIỚI HẠN ĐÃ BIẾT](#10-bảo-mật--giới-hạn-đã-biết)
11. [HƯỚNG DẪN VẬN HÀNH & BẢO TRÌ (OPERATIONS)](#11-hướng-dẫn-vận-hành--bảo-trì-operations)

---

## 1. TỔNG QUAN HỆ THỐNG & SỨ MỆNH

**Elmich AI Design Studio** là nền tảng trí tuệ nhân tạo chuyên biệt được xây dựng riêng cho hệ sinh thái gia dụng, đồ bếp và thiết bị nhà thông minh của thương hiệu Elmich. Đây là một ứng dụng web nội bộ (single-page app), chạy hoàn toàn trên trình duyệt, gọi trực tiếp Google Gemini để phân tích và sinh ảnh.

### Mục tiêu cốt lõi:
- **Tối ưu tốc độ sản xuất:** Rút ngắn thời gian từ khâu lên ý tưởng thiết kế sản phẩm đến khi có hình ảnh truyền thông và bao bì từ hàng tuần xuống còn vài phút.
- **Chuẩn hóa chất lượng hình ảnh:** Tái hiện chính xác các vật liệu đặc thù của đồ gia dụng cao cấp: Inox 304 xước mờ, sơn tĩnh điện, men gốm chịu nhiệt, thủy tinh borosilicate cao cấp và lớp phủ chống dính Teflon/gốm sinh học.
- **Trao quyền cho đội ngũ Content & Marketing:** Cho phép nhân viên nội dung không chuyên về Photoshop/Illustrator có thể dịch bao bì tiếng Anh sang tiếng Việt, tạo mockup 3D, dựng bối cảnh gian bếp đẹp như tạp chí.
- **Tự động hóa QC/QA Bao bì:** Loại bỏ lỗi sai chính tả, sai thông số kỹ thuật (công suất, dung tích, kích thước, xuất xứ) giữa bản thiết kế đồ họa và file dữ liệu Excel của phòng R&D.

---

## 2. KIẾN TRÚC KỸ THUẬT (TÓM TẮT)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     TRÌNH DUYỆT (SPA — 1 trang duy nhất)                │
├─────────────────────────────────────────────────────────────────────────┤
│  React 19 + Tailwind CSS v4 + Motion — App.tsx (~1970 dòng, điều phối   │
│  state + dispatch) + 11 component workflow tách riêng trong             │
│  src/components/workflows/ + BarcodeGenerator, ChatView, HistoryView    │
│                                                                         │
│  Màn hình chính sau khi mở khóa: lưới icon vuông kiểu springboard       │
│  (AppHomeScreen.tsx) — không còn header/sidebar danh sách cố định,      │
│  mỗi công cụ + Trợ lý Chat AI + Lịch sử là 1 ô bấm để vào wizard riêng  │
│                                                                         │
│  services/geminiService.ts  ──▶  gọi TRỰC TIẾP Google Gemini API        │
│  (@google/genai chạy trong trình duyệt, KHÔNG qua backend của dự án)    │
│                                                                         │
│  Lưu cục bộ: localStorage (cờ nhỏ) + localforage/IndexedDB (ảnh, chat)  │
└────────────────────────────────────▲────────────────────────────────────┘
                                     │ chỉ 1 route: ghi log chi phí
┌────────────────────────────────────▼────────────────────────────────────┐
│         BACKEND (chỉ để ghi log — không tham gia luồng tạo ảnh)         │
│  server.ts (Express, cổng 3000, dùng khi tự host)  — hoặc —              │
│  api/sheets/report.ts (khi deploy Vercel)                               │
│    * POST /api/sheets/report  → Google Sheets (ĐANG DÙNG THẬT)         │
│    (tích hợp Lark Bitable đã bị GỠ BỎ HOÀN TOÀN — không còn code,       │
│     không còn route /api/lark/report)                                  │
└────────────────────────────────────▲────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│  Google Gemini — người dùng tự chọn tier trước khi tạo ảnh:              │
│    Flash: gemini-3.1-flash-image (mặc định) · gemini-2.5-flash (phân    │
│    tích/gợi ý prompt)                                                   │
│    Pro:   gemini-3-pro-image · gemini-2.5-pro (phân tích/dịch bao bì)   │
│  Google Sheets API (Service Account) · Firestore + Cloud Storage        │
│  (Lịch sử dùng chung — ảnh & chat, tùy chọn, xem mục 9)                 │
└─────────────────────────────────────────────────────────────────────────┘
```

Chi tiết đầy đủ (cây thư mục, state management, danh sách hàm service, 2 bản
backend song song, build/deploy, nợ kỹ thuật) xem tại **[ARCHITECTURE.md](ARCHITECTURE.md)**.

---

## 3. 11 CÔNG CỤ CHUYÊN BIỆT CỦA STUDIO

Màn hình chính (springboard) hiển thị đúng 11 ô công cụ theo thứ tự dưới đây,
cộng thêm thanh "Trợ lý Chat AI" (chế độ Chat & Tư vấn hoặc Tạo ảnh AI bằng
prompt tự do) và ô "Lịch sử" (xem lại ảnh/chat dùng chung cho cả team) — 2 mục
này không phải `VisualStyle` nên không nằm trong bảng:

| STT | Mã phân hệ (`VisualStyle`) | Tên hiển thị trên UI | Mục đích & Ứng dụng | Nơi cài đặt UI |
|---|---|---|---|---|
| **1** | `WHITE_BG_RETOUCH` | Ảnh nền trắng | Tách nền trắng tinh khiết chuẩn Shopee/Lazada/Tiki (#FFFFFF), tối ưu tương phản mép kim loại và độ trong suốt thủy tinh. | `src/components/workflows/WhiteBgRetouchWorkflow.tsx` |
| **2** | `STUDIO` | Ảnh studio nền trơn | Bố trí sản phẩm trên các bục bệ hình học (podium), ánh sáng kịch tính, phong cách tối giản châu Âu phục vụ banner quảng cáo. | `src/components/workflows/StudioWorkflow.tsx` |
| **3** | `CONCEPT` | Ảnh phối cảnh | Phối cảnh sản phẩm trong không gian sống (bếp hiện đại, bàn ăn sáng, phòng khách). Tùy biến ống kính camera và đạo cụ. | `src/components/workflows/ConceptWorkflow.tsx` |
| **4** | `COLOR_CHANGE` | Làm màu sản phẩm | Thử nghiệm các phiên bản màu sắc mới theo mã màu Pantone hoặc ảnh tham chiếu màu sắc thực tế trước khi đặt hàng sản xuất. | `src/components/workflows/ColorChangeWorkflow.tsx` |
| **5** | `BARCODE_QR_GENERATOR` | Tạo QR & Barcode | Sinh mã vạch chuẩn quốc tế Code 128, EAN-13 (tính check-digit tự động) và mã QR dẫn về link sản phẩm Elmich, xuất file SVG in ấn. **Không gọi AI.** | `src/components/BarcodeGenerator.tsx` |
| **6** | `TRACING_ASSISTANT` | Trợ lý Tracing | Làm sắc nét ảnh/logo mờ, phẳng màu, xóa nhiễu để hỗ trợ đồ lại vector trong Illustrator/Corel. | Inline `renderTracingAssistantWorkflow()` trong `App.tsx` |
| **7** | `3D_TO_REAL_WHITE_BG` | Ảnh 3D - Ảnh chụp | Biến bản vẽ phối cảnh 3D CAD/SolidWorks/3ds Max thô thành ảnh chụp studio chân thật với độ chân thực bề mặt cao. | `src/components/workflows/Render3DToPhotoWorkflow.tsx` |
| **8** | `LINE_ART` | Chuyển thành Line Art | Tạo sơ đồ cấu tạo linh kiện (exploded view diagram) phục vụ sách hướng dẫn sử dụng và kiểm định chất lượng. | `src/components/workflows/LineArtWorkflow.tsx` |
| **9** | `PACKAGING_MOCKUP` | Mockup bao bì | Giả lập hộp sản phẩm dạng 3D từ các mặt thiết kế phẳng (Front, Back, Left, Right, Top) trên phông trắng hoặc quầy kệ. | `src/components/workflows/PackagingMockupWorkflow.tsx` |
| **10** | `TRANSLATE_PACKAGING` | Dịch bao bì tự động | Dịch bao bì tiếng Anh sang tiếng Việt trong 1 chạm cho Content team, giữ nguyên dieline, xuất ảnh tức thì. | `src/components/workflows/TranslatePackagingWorkflow.tsx` |
| **11** | `PACKAGING_CHECK` | Kiểm tra bao bì | Soi lỗi sai lệch thông tin trên các file thiết kế bao bì dựa trên bảng tiêu chuẩn Excel của phòng R&D. Xuất báo cáo ĐẠT/KHÔNG ĐẠT. | `src/components/workflows/PackagingCheckWorkflow.tsx` |

> **10/11 workflow đã có component React riêng** trong
> `src/components/workflows/`, mỗi form được bố trí lưới 1 cột (mobile) /
> 2 cột (`xl:`) để giảm chiều cao cuộn. Chỉ còn `TRACING_ASSISTANT` vẫn dùng
> JSX inline trong `App.tsx` (~1970 dòng).
>
> **3 `VisualStyle` mồ côi — code còn tồn tại nhưng KHÔNG còn truy cập được
> từ UI** kể từ khi màn hình chính đổi sang lưới icon springboard (mảng
> `APP_TOOLS` trong `App.tsx` không còn liệt kê chúng):
> - `SCENE_STAGING` (Phối cảnh Thực tế) — `renderStagingWorkflow()` inline.
> - `TECH_PS` (Điểm mạnh Kỹ thuật) — `renderTechWorkflow()` inline.
> - `TRACK_SOCKET_STAGING` (Ray Ổ Cắm Đa Năng) — đã có component riêng
>   `src/components/workflows/TrackSocketWorkflow.tsx` (kể cả đã được tối ưu
>   layout 2 cột), nhưng chưa được gắn lại vào `APP_TOOLS`.
>
> Đây là nợ kỹ thuật cần quyết định: xóa hẳn 3 workflow này, hoặc thêm lại
> vào lưới công cụ ở màn hình chính — xem ARCHITECTURE.md mục 7.

---

## 4. HỆ THỐNG SKILL FILE (PROMPT CHUẨN HÓA)

Chất lượng ảnh đồng nhất giữa các lần tạo không đến từ việc "nhớ" của
Gemini, mà từ 8 file Markdown chuẩn hóa phong cách đặt ở gốc repo
(`Design_*.md`, `3DRender_To_Photo.md`), được nhúng thẳng vào prompt mỗi
lần gọi AI cho workflow tương ứng:

| Skill file | Áp dụng cho workflow |
|---|---|
| `Design_Lifestyle_Concept.md` | CONCEPT, SCENE_STAGING |
| `Design_Studio_Creative.md` | STUDIO |
| `Design_Tech_Effects.md` | TECH_PS, TECH_EFFECTS |
| `Design_Color_Editing.md` | COLOR_CHANGE |
| `Design_Packaging_Mockup.md` | PACKAGING_MOCKUP |
| `Design_WhiteBG_Retouch.md` | WHITE_BG_RETOUCH |
| `Design_Line_Art.md` | LINE_ART |
| `3DRender_To_Photo.md` | 3D_TO_REAL_WHITE_BG |
| `ChatAssistant_Handbook.md` | Trợ lý **Chat AI** (không thuộc danh sách công cụ ở mục 3 — dùng cho cả 2 chế độ Chat & Tư vấn / Tạo ảnh AI) |

Các công cụ còn lại (TRACING_ASSISTANT, BARCODE_QR_GENERATOR,
TRANSLATE_PACKAGING, PACKAGING_CHECK, cùng 3 workflow mồ côi SCENE_STAGING/
TECH_PS/TRACK_SOCKET_STAGING) dùng prompt inline ngắn, không có skill file
riêng.

**Trợ lý Chat AI** (`ChatView.tsx`) từ nay cũng có "cẩm nang" riêng —
`ChatAssistant_Handbook.md` — đóng vai trò Giám đốc Sáng tạo khi tư vấn
(`chatWithAI`), và chuẩn hóa vật liệu/ánh sáng Elmich cho mọi ảnh tạo tự do
qua chat (`generateImageForChat`), kể cả khi người dùng không đi qua wizard
nào của Studio. Cẩm nang này cố ý viết cô đọng hơn 8 skill file kia (không
nhúng cả 8 file vào mỗi tin nhắn chat) để tránh đội chi phí token — chi
tiết xem [SKILLS.md](SKILLS.md) mục 2.

**Lưu ý quan trọng khi chỉnh sửa skill file:** nội dung được đóng gói vào
bundle lúc `npm run build` (import kiểu `?raw`), **không đọc lại từ đĩa lúc
chạy** — sửa file xong phải build/deploy lại mới có hiệu lực. Toàn bộ cơ
chế, khuôn mẫu file, và hướng dẫn thêm skill mới được trình bày chi tiết
tại **[SKILLS.md](SKILLS.md)**.

---

## 5. KỸ NĂNG CHUYÊN SÂU: DỊCH BAO BÌ TỰ ĐỘNG CHO CONTENT

### Bối cảnh bài toán:
Các sản phẩm Elmich nhập khẩu hoặc OEM quốc tế thường có file thiết kế bao bì gốc hoàn toàn bằng tiếng Anh. Đội ngũ làm nội dung (Content, Marketing, E-commerce) không có bằng cấp đồ họa hay máy tính cài đặt Adobe Illustrator/Photoshop, nhưng cần ngay hình ảnh bao bì tiếng Việt để đăng tải bài viết, làm tài liệu giới thiệu sản phẩm và trình duyệt kinh doanh.

### Giải pháp kỹ thuật:
- Component: `TranslatePackagingWorkflow.tsx`, gọi hàm `editProductImage()`
  trong `geminiService.ts` (model `gemini-3.1-flash-image`, image-to-image).
- Prompt cố định:
  > *"Recreate this exact packaging design perfectly. Keep the exact same dieline (cut lines), background graphics, and colors. However, translate all the English text on the packaging into Vietnamese."*
- Giữ 100% đường bế cấn, vị trí logo Elmich và tông màu thương hiệu.
- Đầu ra mặc định là file ảnh chất lượng cao **1K (1024x1024 trở lên)**, sẵn sàng tải về trong 1 click.

---

## 6. KỸ NĂNG CHUYÊN SÂU: KIỂM DUYỆT BAO BÌ ĐỐI CHIẾU EXCEL

### Quy trình 3 bước tự động (`PackagingCheckWorkflow.tsx`):
1. **Bước 1: Nạp dữ liệu tiêu chuẩn (R&D Data):**
   - Tải file Excel (`.xlsx`, qua thư viện `xlsx`) hoặc dán trực tiếp bảng thông số kỹ thuật.
   - AI (`extractStandardParamsWithAI`) tự động trích xuất 16 trường thông tin trọng yếu: Tên sản phẩm, Model, Mã sản phẩm, Dung tích, Công suất, Điện áp, Tần số, Khối lượng, Định lượng hộp màu, Định lượng thùng carton, Số Serial, Nhà sản xuất, Địa chỉ, Mã QR, Barcode 128, Barcode EAN13.
2. **Bước 2: Tải lên các file thiết kế bao bì:**
   - Hỗ trợ tải nhiều file đồng thời: Hộp màu chính (Color Box), Hộp carton vận chuyển (Master Carton), Tem nhãn phụ tiếng Việt (Label).
3. **Bước 3: AI Quét OCR & Đối chiếu chéo (`analyzePackagingContent`):**
   - Phân tích văn bản trên ảnh thiết kế và quét mã QR/Barcode trực tiếp trong ảnh (không chỉ đọc chữ in kèm).
   - Lập bảng ma trận kết quả theo từng file: Hiển thị giá trị Chuẩn vs Giá trị thực tế.
   - Đánh dấu trạng thái: **ĐẠT** (xanh) hoặc **KHÔNG ĐẠT** (đỏ) kèm cảnh báo lỗi chi tiết, ghi rõ tên file chứa lỗi.
   - Xuất file báo cáo Excel hoàn chỉnh.

---

## 7. QUY TẮC PROMPT ENGINEERING CHUẨN ELMICH

Để đảm bảo kết quả hình ảnh luôn mang đẳng cấp thương hiệu Elmich Châu Âu, các quy tắc sau được áp dụng nghiêm ngặt (chi tiết mẫu prompt xem [GEMINI.md](GEMINI.md)):

### Quy tắc 1: Bảo toàn Nhận diện Vật liệu
- **Inox 304:** `"high-grade 304 food-contact stainless steel, seamless brushed satin finish with sharp, authentic specular highlight strips along the curvature"`.
- **Thủy tinh Borosilicate:** `"Crystal-clear high-borosilicate glass with light refraction, sharp caustics and subtle rim highlights"`.
- **Lớp chống dính:** `"Ultra-durable micro-granite non-stick textured surface, matte dark graphite tone"`.
- **Vân gỗ tay cầm:** `"Natural European beech wood handle with fine organic grain and warm matte varnish"`.

### Quy tắc 2: Thiết lập Ánh sáng & Quang học Studio
- Tránh ánh sáng quá phẳng hoặc bóng mờ nhạt.
- Ưu tiên hệ thống đèn 3 điểm: Key light góc 45 độ, Fill light mềm qua softbox tản sáng, Rim light viền sắc cạnh từ phía sau để tách sản phẩm khỏi nền.

### Quy tắc 3: Kiểm soát Không gian Trống (Negative Space)
- Trong các chế độ phục vụ quảng cáo và banner (`STUDIO`, `CONCEPT`, `TECH_PS`), hệ thống cung cấp tùy chọn vị trí để trống (`TOP`, `BOTTOM`, `LEFT`, `RIGHT`) để đội ngũ Marketing dễ dàng chèn tiêu đề, thông điệp truyền thông hoặc giá bán mà không bị đè lên sản phẩm.

---

## 8. DỰ TOÁN CHI PHÍ & TÍNH TOÁN TOKEN (ANALYTICS)

> **Lưu ý:** các con số dưới đây là **ước tính hiển thị cho người dùng**,
> tính bằng bảng giá hard-code trong `services/metricsService.ts` (khớp với
> https://ai.google.dev/gemini-api/docs/pricing), **không phải số liệu
> billing thật lấy từ Google Cloud**. Dùng hàm `calculateImagenCost()` cho
> phần tạo ảnh (tên hàm giữ từ thời còn dùng Imagen, nay tính giá theo đúng
> 2 model Gemini image bên dưới) và `calculateGeminiCost()` cho phần phân
> tích văn bản.

Từ khi có lựa chọn **Flash / Pro** trước mỗi lần tạo ảnh (mặc định Flash),
chi phí phụ thuộc vào tier người dùng chọn:

**Giá tạo ảnh theo model & độ phân giải (mỗi ảnh):**

| Model | 1K | 2K | 4K |
|---|---|---|---|
| **Flash** — `gemini-3.1-flash-image` (Nano Banana 2, mặc định) | $0.067 | $0.101 | $0.151 |
| **Pro** — `gemini-3-pro-image` (Nano Banana Pro) | $0.134 | $0.134 | $0.24 |

**Giá xử lý văn bản (phân tích ảnh, gợi ý prompt, dịch/kiểm bao bì) — theo 1 triệu token:**

| Model | Input | Output |
|---|---|---|
| **Flash** — `gemini-2.5-flash` / `gemini-3.1-flash` | $0.30 | $2.50 |
| **Pro** — `gemini-2.5-pro` / `gemini-3-pro` | $1.25 | $10.00 |

Model dùng cho từng tác vụ phân tích:

| Tác vụ | Model | Ghi chú |
|---|---|---|
| Gợi ý Concept, gợi ý đạo cụ, suy luận prompt trước khi tạo ảnh | `gemini-2.5-flash` | ~$0.001 – $0.003 / lần |
| Phân tích & dịch nội dung bao bì (OCR, đối chiếu Excel) | `gemini-2.5-pro` | ~$0.005 – $0.02 / lần, ưu tiên độ chính xác OCR |
| Tạo/sửa ảnh chính, Trợ lý Chat AI (chế độ tạo ảnh) | `gemini-3.1-flash-image` hoặc `gemini-3-pro-image` | Theo lựa chọn Flash/Pro của người dùng, xem bảng trên |

Chi phí mỗi lần tạo ảnh = giá tạo ảnh (theo model & độ phân giải) + phí phân
tích văn bản đi kèm (thường không đáng kể so với phí tạo ảnh). Toàn bộ được
cộng dồn và ghi log tự động vào Google Sheets dùng chung — xem mục 9.

---

## 9. TÍCH HỢP DOANH NGHIỆP: GOOGLE SHEETS & LỊCH SỬ DÙNG CHUNG

1. **Google Sheets Integration (`/api/sheets/report`) — ĐANG HOẠT ĐỘNG:**
   - Sử dụng Google Service Account xác thực tự động (`GOOGLE_SERVICE_ACCOUNT_JSON` hoặc cặp `GOOGLE_CLIENT_EMAIL`/`GOOGLE_PRIVATE_KEY`).
   - Được gọi từ hàm `reportToLark()` trong `metricsService.ts` (tên hàm giữ
     nguyên từ thời còn định dùng Lark — thực chất ghi vào Google Sheets,
     không liên quan Lark).
   - Ghi nhận: Mã sản phẩm, Tên sản phẩm, Số token, Chi phí ($), Ngày, Tên tác vụ.
2. **Lark Suite Bitable — ĐÃ GỠ BỎ HOÀN TOÀN (không còn dùng):** route
   `/api/lark/report` (cả ở `server.ts` lẫn `api/lark/report.ts`) đã bị xóa
   khỏi codebase vì không còn nhu cầu sử dụng. Nếu tài liệu cũ hoặc code
   review nào còn nhắc tới, đó là tham chiếu lỗi thời — không có route này
   nữa.
3. **Google Cloud Firestore + Cloud Storage (tab "Lịch sử") — ĐANG HOẠT ĐỘNG
   (khi đã cấu hình `GCS_BUCKET_NAME`):**
   - Dùng chung Service Account với mục 1, chỉ cấp thêm quyền IAM
     (`roles/datastore.user`, `roles/storage.objectAdmin`).
   - Ghi lại **ảnh kết quả** của mọi lần tạo/sửa ảnh, và **toàn bộ tin
     nhắn chat**, dùng chung cho cả team, xem được ở bất kỳ trình duyệt
     nào (không giới hạn 7 ngày như gallery cục bộ).
   - **Tự học từ phản hồi (theo từng dòng sản phẩm):** khi người dùng bấm
     "Rất tốt!" ở modal phản hồi sau khi tải ảnh về, đánh giá đó được lưu
     chung cho cả team (không chỉ riêng máy đang dùng) và hệ thống tự suy
     luận "dòng sản phẩm" (vd bình giữ nhiệt, nồi cơm điện) từ tên/mã sản
     phẩm. Khi đủ dữ liệu (từ 3 ảnh "tốt" trở lên cho cùng dòng sản phẩm +
     phong cách), hệ thống tự đúc kết thành 1 đoạn CHỈ DẪN ngắn gọn (không
     phải trích dẫn nguyên văn prompt cũ) để tham khảo cho các lần tạo ảnh
     sau — áp dụng cho cả 11 công cụ workflow lẫn khi tạo ảnh qua Trợ lý
     Chat. Càng nhiều người dùng bấm "Rất tốt!", chỉ dẫn càng sát. Đây là
     kỹ thuật đúc kết chỉ dẫn từ dữ liệu đã duyệt, không phải fine-tune mô
     hình. Chi tiết: ARCHITECTURE.md mục 8.5–8.5b.
   - **Tab "Trợ lý Chat" tự lấy lại lịch sử từ server khi cache trình duyệt
     trống** (trình duyệt mới, tab ẩn danh, hoặc cache đã quá 7 ngày) — sửa
     lỗi trước đó khiến chat cũ "biến mất" khi mở app ở máy khác dù dữ liệu
     vẫn còn trên server. Chi tiết: ARCHITECTURE.md mục 8.6.
   - **Bắt buộc cấu hình CORS cho bucket** khi provisioning (mục 8.1) — nếu
     bỏ qua bước này, ảnh sẽ không lưu được lên Lịch sử dù Firestore/Storage
     đã bật đúng, vì trình duyệt chặn request upload cross-origin.
   - Chi tiết thiết kế, các bước cấu hình GCP thủ công, và giới hạn đã
     biết: xem [ARCHITECTURE.md](ARCHITECTURE.md) mục 8.

---

## 10. BẢO MẬT & GIỚI HẠN ĐÃ BIẾT

Ghi lại minh bạch để người vận hành và đội kỹ thuật không hiểu nhầm mức độ
an toàn hiện tại của hệ thống:

- **`GEMINI_API_KEY` bị nhúng vào bundle JS gửi cho trình duyệt** (do
  `vite.config.ts` dùng `define` để inline giá trị thật của biến môi
  trường). Bất kỳ ai xem được file JS đã build đều lấy được key này. Đây là
  rủi ro thật, không chỉ là vấn đề tài liệu — xem ARCHITECTURE.md mục 5.
- **Màn hình khóa (`LockScreen.tsx`) chỉ là UI gate**, so khớp PIN
  `15012026`/`1111` hard-code trong code phía client — không phải cơ chế
  xác thực bảo mật, chỉ nhằm tránh người ngoài vô tình truy cập.
- **Không có tài khoản người dùng, không phân quyền** — mọi người dùng
  chung 1 PIN, dữ liệu (gallery, lịch sử chat) chỉ lưu cục bộ theo từng
  trình duyệt, không đồng bộ giữa các máy.
- **Không có bộ test tự động.** `npm run lint` chỉ chạy `tsc --noEmit`
  (kiểm tra kiểu, không phát hiện lỗi logic).
- **Route ghi Lịch sử (`POST /api/history/images`, `/api/history/chats`,
  `/api/history/rate-image`) không có xác thực riêng** ngoài việc chạy
  trên cùng domain với app — chấp nhận được cho công cụ nội bộ đã có PIN
  chặn ở tầng UI, nhưng không phải hàng rào bảo mật thật ở tầng API. Vì
  đánh giá "Rất tốt!" ảnh hưởng trực tiếp đến gợi ý cho cả team (mục 9.3),
  dữ liệu `rating` giả mạo có thể làm lệch chất lượng gợi ý (xem
  ARCHITECTURE.md mục 8.7).
- Danh sách đầy đủ nợ kỹ thuật (App.tsx monolith, code trùng lặp backend,
  hàm/route mồ côi...) xem ARCHITECTURE.md mục 7.

---

## 11. HƯỚNG DẪN VẬN HÀNH & BẢO TRÌ (OPERATIONS)

### Biến môi trường cần thiết (`.env`):
```env
# Gemini API Key (Bắt buộc — LƯU Ý: giá trị này sẽ bị nhúng vào bundle
# client khi build, xem mục 10)
GEMINI_API_KEY=your_gemini_api_key_here

# Tích hợp Google Sheets (Tùy chọn, chỉ dùng ở backend)
GOOGLE_SHEET_ID=your_spreadsheet_id
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

# Lịch sử dùng chung — Ảnh & Chat (Tùy chọn, xem ARCHITECTURE.md mục 8 để
# biết các bước cấu hình Firestore/Storage/IAM trên GCP Console trước khi
# thêm biến này)
GCS_BUCKET_NAME=your-bucket-name
```

### Lệnh chạy và đóng gói hệ thống:
```bash
# Cài đặt thư viện phụ thuộc
npm install

# Khởi động máy chủ phát triển (Cổng 3000)
npm run dev

# Kiểm tra kiểu dữ liệu (không có test suite/ESLint trong dự án)
npm run lint

# Đóng gói sản phẩm xuất xưởng (build client + bundle server.ts)
npm run build

# Chạy bản build sản xuất (tự host, không phải Vercel)
npm start
```

Nếu deploy lên Vercel, dự án dùng `vercel.json` để route `/api/*` sang các
file trong thư mục `api/` thay vì `server.ts` — xem ARCHITECTURE.md mục 4
để biết vì sao 2 bản logic này cần được sửa đồng thời.

---
*Tài liệu được biên soạn và cập nhật bởi Elmich AI Studio Core Team.*
