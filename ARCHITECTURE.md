# ARCHITECTURE.MD — KIẾN TRÚC KỸ THUẬT CHI TIẾT (AI IMAGE ELMICH)

> Tài liệu này mô tả **đúng thực trạng code hiện tại** (không phải trạng thái lý tưởng). Nơi nào code đi ngược lại nguyên tắc đã đề ra trong [AGENTS.md](AGENTS.md), tài liệu này ghi rõ để người đọc (người hoặc AI agent) không bị bất ngờ.
>
> Đọc kèm: [HANDBOOK.md](HANDBOOK.md) (góc nhìn nghiệp vụ/vận hành), [SKILLS.md](SKILLS.md) (hệ thống "skill" prompt theo từng workflow), [GEMINI.md](GEMINI.md) (chi tiết model & prompt).

---

## 1. Sơ đồ tổng thể

```
┌───────────────────────────────────────────────────────────────────────────┐
│ BROWSER (SPA — không có server-side rendering)                            │
│                                                                           │
│  index.html → index.tsx → <App/> (App.tsx, ~2850 dòng, 1 component duy nhất)│
│                                                                           │
│  App.tsx nắm TOÀN BỘ state của ứng dụng (~80+ useState) và tự render      │
│  UI cho phần lớn 15 workflow bằng if/else theo `VisualStyle`.             │
│  4 workflow được tách thành component riêng:                             │
│    - BarcodeGenerator.tsx (không gọi AI, thuần JS lib)                   │
│    - workflows/PackagingCheckWorkflow.tsx                                │
│    - workflows/TranslatePackagingWorkflow.tsx                           │
│    - chat/ChatView.tsx                                                  │
│                                                                           │
│  App.tsx  ──gọi trực tiếp──▶  services/geminiService.ts                  │
│                                     │                                     │
│                                     ├─▶ @google/genai SDK (client-side!)  │
│                                     │   new GoogleGenAI({ apiKey:         │
│                                     │     process.env.GEMINI_API_KEY })   │
│                                     │   → gọi thẳng Google Gemini API     │
│                                     │     từ trình duyệt, KHÔNG qua       │
│                                     │     backend của dự án.              │
│                                     │                                     │
│                                     └─▶ services/metricsService.ts        │
│                                           └─▶ fetch('/api/sheets/report') │
│                                                                           │
│  Lưu trữ cục bộ trong trình duyệt:                                        │
│    - localStorage: cờ nhỏ (tên/mã SP hiện tại, lịch sử prompt thành công) │
│    - localforage (IndexedDB): gallery ảnh & lịch sử chat (dữ liệu nặng)   │
└───────────────────────────────────▲───────────────────────────────────────┘
                                     │ HTTP JSON (chỉ 2 route)
┌───────────────────────────────────┴───────────────────────────────────────┐
│ BACKEND — TỒN TẠI SONG SONG 2 BẢN GIỐNG NHAU CHO 2 MÔI TRƯỜNG DEPLOY      │
│                                                                           │
│  A) Tự host / npm run dev|start → server.ts (Express, cổng 3000)         │
│     - POST /api/sheets/report                                           │
│     - POST /api/lark/report   (tồn tại nhưng KHÔNG được gọi từ frontend) │
│     - Vite middleware (dev) hoặc serve static dist/ (prod)               │
│                                                                           │
│  B) Deploy Vercel → api/sheets/report.ts, api/lark/report.ts             │
│     (Vercel Serverless Functions, logic giống hệt bản trong server.ts,   │
│      COPY TAY — sửa 1 bên phải nhớ sửa bên kia)                          │
└───────────────────────────────────▲───────────────────────────────────────┘
                                     │
┌───────────────────────────────────┴───────────────────────────────────────┐
│ DỊCH VỤ NGOÀI                                                             │
│  - Google Sheets API (Service Account) — đích thực sự của reportToLark() │
│  - Lark Suite Bitable API — có code sẵn sàng nhưng chưa được kích hoạt   │
│  - Google Gemini API (gemini-2.5-flash/pro, gemini-3.1-flash-image)      │
└───────────────────────────────────────────────────────────────────────────┘
```

Điểm khác biệt quan trọng nhất so với một kiến trúc "chuẩn": **không có backend cho AI**. Toàn bộ việc gọi Gemini (phân tích ảnh, sinh prompt, sinh ảnh) chạy trực tiếp trong trình duyệt người dùng. Backend Express/Vercel chỉ tồn tại để ghi log chi phí/token ra Google Sheets.

---

## 2. Lớp Frontend

### 2.1. Cây thư mục thực tế

```
App.tsx                          # "God component" — state + UI cho 11/15 workflow
constants.tsx                    # Hằng số tĩnh (địa điểm, tiêu cự, tone màu...)
types.ts                         # Toàn bộ type/interface dùng chung
index.tsx                        # Bootstrap React
index.css                        # Tailwind entry

services/
  geminiService.ts                # Toàn bộ lời gọi Gemini + build prompt (~1430 dòng)
  metricsService.ts                # Ước tính chi phí + gửi log Google Sheets

src/
  utils/imageUtils.ts             # resizeImage, fileToBase64
  components/
    BarcodeGenerator.tsx          # Workflow 13 — độc lập, không gọi AI
    workflows/
      PackagingCheckWorkflow.tsx  # Workflow 15
      TranslatePackagingWorkflow.tsx # Workflow 14
    chat/ChatView.tsx             # Chế độ "Trợ lý Chat AI"
    common/
      Header.tsx, HandbookModal.tsx, GalleryRail.tsx,
      LoadingModal.tsx, LockScreen.tsx
```

**11 workflow còn lại** (CONCEPT, SCENE_STAGING, TECH_PS, COLOR_CHANGE,
PACKAGING_MOCKUP, TECH_EFFECTS, WHITE_BG_RETOUCH, 3D_TO_REAL_WHITE_BG,
TRACING_ASSISTANT, LINE_ART, STUDIO, TRACK_SOCKET_STAGING) **không có component
riêng** — toàn bộ UI wizard (các bước `xxxStep`), state, và handler của chúng
nằm trực tiếp trong `App.tsx`. Đây là lý do file này dài gần 2.900 dòng và là
nợ kỹ thuật lớn nhất của dự án (xem mục 7).

### 2.2. Quản lý state

`App.tsx` không dùng Redux/Zustand/Context — toàn bộ là `useState` cục bộ
trong 1 component (~80+ state), bao gồm:
- Trạng thái chung: `appState` (READY/GENERATING/ANALYZING), `viewMode`
  (`studio` | `chat`), `isLocked`, `isSidebarVisible`...
- Một biến step riêng cho **mỗi** workflow dạng wizard: `conceptStep`,
  `techStep`, `packagingStep`, `techEffectStep`, `packagingCheckStep`,
  `render3DStep`, `whiteBgStep`, `colorChangeStep`, `stagingStep`,
  `studioStep`, `trackSocketStep`...
- `state` (settings đang soạn) kiểu `GenerationSettings` (xem `types.ts`) —
  đây là "form" trung tâm chứa toàn bộ tham số của workflow đang chọn
  (productImages, camera, props, aspectRatio, các field riêng theo từng
  mode...).
- `gallery: GeneratedImage[]` và `chatSessions: ChatSession[]` — đồng bộ vào
  IndexedDB qua `localforage` mỗi khi thay đổi (side-effect trong
  `useEffect`, dynamic `import('localforage')`).

Điều hướng giữa các workflow là **điều kiện render theo `state.visualStyle`**
(kiểu union `VisualStyle` trong `types.ts`), không dùng router — toàn bộ ứng
dụng chỉ có 1 "trang".

### 2.3. Lưu trữ cục bộ (Client Storage)

| Cơ chế | Key | Nội dung | Vì sao dùng cơ chế này |
|---|---|---|---|
| `localStorage` | `elmich_ai_successful_prompts` | Lịch sử các concept/prompt đã tạo ảnh thành công (dùng để "gợi ý theo lịch sử" trong `generateProductImage`) | Dữ liệu nhỏ, dạng text |
| `localStorage` | `elmich_ai_product_name`, `elmich_ai_product_code` | Tên/mã sản phẩm đang thao tác | Dùng làm nhãn khi ghi log chi phí sang Google Sheets |
| `localStorage` (session) | `elmich_session_tokens`, `elmich_session_cost` | Tổng token/chi phí ước tính trong phiên (thực chất dùng `sessionStorage`, xem `metricsService.ts`) | Hiển thị nhanh, mất khi đóng tab |
| `localforage` (IndexedDB) | `elmich_ai_gallery` | Toàn bộ `GeneratedImage[]` — ảnh base64 + settings đã dùng | Ảnh base64 rất nặng, `localStorage` sẽ vỡ hạn mức 5–10MB |
| `localforage` (IndexedDB) | `elmich_ai_chat_sessions` | Toàn bộ lịch sử chat, gồm cả ảnh đính kèm | Cùng lý do — chat có thể chứa nhiều ảnh |

Không có backend lưu trữ nào cho ảnh/chat — **toàn bộ dữ liệu là cục bộ theo
trình duyệt của từng người dùng**, không đồng bộ giữa các máy/nhân viên.

### 2.4. "Đăng nhập"

`LockScreen.tsx` chỉ là một màn hình chặn UI phía client, so sánh PIN nhập
vào với 2 chuỗi hard-code `"15012026"` hoặc `"1111"` ngay trong bundle JS.
**Đây không phải cơ chế xác thực bảo mật thật** — bất kỳ ai xem source bundle
đã build đều thấy được PIN. Vai trò thực tế của nó là ngăn người dùng vãng
lai vô tình bấm vào ứng dụng nội bộ, không phải kiểm soát truy cập.

---

## 3. Lớp Service — `services/geminiService.ts`

Đây là nơi duy nhất gọi Google Gemini. Mỗi lời gọi tự khởi tạo
`new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })` — không có client
dùng chung, không có retry/backoff tập trung.

### 3.1. Bảng hàm export

| Hàm | Model | Dùng bởi | Việc chính |
|---|---|---|---|
| `analyzeProductMaterials` | gemini-2.5-flash | App.tsx (một số bước phân tích chất liệu) | Phân loại chất liệu (METAL/PLASTIC/GLASS/CERAMIC) từ ảnh |
| `getAiSuggestions` | gemini-2.5-flash | App.tsx (đường cũ, ít dùng) | Gợi ý concept/location/props chung chung |
| `analyzeConceptAndCamera` | gemini-2.5-flash | CONCEPT | Đọc `Design_Lifestyle_Concept.md`, trả 5 concept + camera đề xuất |
| `analyzeTechConceptAndCamera` | gemini-2.5-flash | TECH_PS | Đọc `Design_Tech_Effects.md`, trả 5 concept + camera |
| `suggestPropsForConcept` | gemini-2.5-**pro** | CONCEPT/STUDIO | Gợi ý 10 đạo cụ + placement dựa trên concept đã chọn |
| `suggestTechVisuals` | gemini-2.5-flash | TECH_PS | Gợi ý placement + hiệu ứng đồ họa |
| `suggestTechConcepts` | gemini-2.5-flash | TECH_EFFECTS (SEA_TECH_GENERATION) | Đọc `Design_Tech_Effects.md`, trả 3 concept hiệu ứng biển đêm |
| `analyzeStagingScene` | gemini-2.5-flash | SCENE_STAGING | Gợi ý 10 vật trang trí thêm vào ảnh phòng có sẵn |
| `analyzeStudioConcept` | gemini-2.5-flash | STUDIO | Đọc `Design_Studio_Creative.md`, trả 5 concept + camera |
| `editProductImage` | gemini-3.1-flash-image | TRANSLATE_PACKAGING, chỉnh sửa ảnh trong gallery | Sửa ảnh theo 1 prompt tự do (image-to-image) |
| `generateProductImage` | gemini-2.5-pro (bước "suy luận" cho 3 mode) + gemini-3.1-flash-image | **Toàn bộ 11 workflow tạo ảnh** | Build prompt cuối cùng theo `visualStyle` rồi sinh ảnh — xem mục 3.2 |
| `generateImageForChat` | gemini-3.1-flash-image | ChatView (chế độ "Tạo ảnh AI") | Sinh/sửa ảnh tự do trong khung chat |
| `chatWithAI` | gemini-2.5-pro | ChatView (chế độ "Chat & Tư vấn") | Hội thoại nhiều lượt, có system instruction tiếng Việt |
| `analyzePackagingContent` | gemini-2.5-flash | PackagingCheckWorkflow | Đối chiếu OCR nhiều file thiết kế với bảng thông số chuẩn |
| `extractStandardParamsWithAI` | gemini-2.5-flash | PackagingCheckWorkflow | Trích 16 thông số chuẩn từ text Excel dán vào |
| `analyzeAndTranslatePackaging` | gemini-2.5-flash | **Không có nơi nào gọi hàm này** (dead code) | Trả layout vùng text + bản dịch theo tọa độ — dự kiến dùng cho một luồng dịch "overlay text" chưa hoàn thiện |

> `TranslatePackagingWorkflow.tsx` (workflow đang chạy thật) dùng
> `editProductImage()` với 1 prompt cố định để Gemini **vẽ lại toàn bộ ảnh**
> bằng tiếng Việt, chứ không dùng `analyzeAndTranslatePackaging()`.

### 3.2. Hai kiểu dựng prompt trong `generateProductImage`

- **Kiểu A — Template trực tiếp** (SCENE_STAGING, TRACING_ASSISTANT,
  TECH_EFFECTS, PACKAGING_MOCKUP, 3D_TO_REAL_WHITE_BG, WHITE_BG_RETOUCH,
  LINE_ART, COLOR_CHANGE, TRACK_SOCKET_STAGING): ghép chuỗi JS trực tiếp,
  nhúng nguyên văn nội dung skill file liên quan (mục 4), gọi thẳng
  `gemini-3.1-flash-image` 1 lần.
- **Kiểu B — "Suy luận" 2 bước** (CONCEPT, TECH_PS, STUDIO): gọi
  `gemini-2.5-pro` trước với một "thinking prompt" nhúng **cả 3** skill file
  (Lifestyle + Studio + Tech Effects) cùng lúc để Gemini tự viết ra một prompt
  tiếng Anh chi tiết, sau đó mới đưa prompt đó + ảnh sản phẩm vào
  `gemini-3.1-flash-image`. Cách này tốn thêm 1 lời gọi Pro (đắt hơn) nhưng
  cho chất lượng prompt tốt hơn.

### 3.3. Xử lý ảnh phía client trước khi gửi AI

- `padImageToAspectRatio()` — chèn nền trắng để ép ảnh về đúng tỷ lệ khung
  hình mong muốn trước khi gửi cho Gemini (tránh Gemini tự crop/méo sản
  phẩm).
- `resizeImageToQuality()` — resize/canvas lại ảnh **kết quả trả về** cho
  đúng 1K/2K (4K thực tế bị giới hạn ở 2K native rồi upscale bằng canvas,
  xem `imageConfig.imageSize = settings.imageSize === '4K' ? '2K' : ...`).
- `src/utils/imageUtils.ts::resizeImage()` — resize ảnh **đầu vào** người
  dùng tải lên (mặc định tối đa 1024px) trước khi gửi phân tích, để giảm
  băng thông/token.

### 3.4. `metricsService.ts` — ước tính chi phí

- `calculateGeminiCost()` / `calculateImagenCost()`: bảng giá **hard-code
  trong code**, chỉ là ước tính gần đúng để hiển thị cho người dùng, không
  phải số liệu billing thật từ Google Cloud.
- `reportToLark()`: **tên hàm gây hiểu nhầm** — hàm này thực chất
  `fetch('/api/sheets/report')`, tức là ghi vào **Google Sheets**, không
  liên quan đến Lark. Route `/api/lark/report` có tồn tại ở backend (cả 2
  bản) nhưng không có chỗ nào trong frontend gọi tới nó.

---

## 4. Lớp Backend

Hai bản triển khai **giống hệt nhau về logic** cho cùng 2 endpoint, phục vụ
2 kịch bản deploy khác nhau:

| | `server.ts` | `api/sheets/report.ts`, `api/lark/report.ts` |
|---|---|---|
| Dùng khi | `npm run dev` / tự host (`npm start`) | Deploy lên Vercel (`vercel.json` rewrite `/api/*` → các file này) |
| Kiểu | Express app, lắng nghe cổng 3000, host `0.0.0.0` | Vercel Serverless Function (`export default handler`) |
| Vai trò khác | Kiêm Vite middleware (dev) hoặc serve `dist/` tĩnh (prod) | Không phục vụ static — Vercel tự làm việc đó qua build output |

**Rủi ro bảo trì:** logic xác thực Google Service Account / Lark App
Secret được viết trùng lặp ở 2 nơi. Sửa lỗi hay đổi luồng auth phải nhớ sửa
cả hai, nếu không 2 môi trường deploy sẽ lệch hành vi.

Không có endpoint nào cho AI (`/api/generate-image` không tồn tại trong
code, dù tài liệu cũ có nhắc tới) — mọi lời gọi Gemini đi thẳng từ trình
duyệt như mô tả ở mục 3.

---

## 5. Biến môi trường & lộ khóa API (quan trọng)

`vite.config.ts` có đoạn:

```ts
define: {
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
  'process.env': {}
}
```

Điều này khiến **giá trị thật của `GEMINI_API_KEY` được nhúng cứng vào file
JS build ra**, gửi cho mọi trình duyệt tải trang. Bất kỳ ai mở DevTools /
tải file bundle đều có thể lấy được API key này và gọi Gemini bằng chi phí
của Elmich.

> Đây là điểm **mâu thuẫn với chính nguyên tắc bảo mật đã nêu trong
> [AGENTS.md](AGENTS.md)** (bản cũ ghi "khóa được quản lý server-side, không
> đưa vào client bundle"). Thực tế code hiện tại KHÔNG như vậy đối với
> `GEMINI_API_KEY`. Chỉ có `GOOGLE_SERVICE_ACCOUNT_JSON`, `GOOGLE_SHEET_ID`,
> `LARK_APP_ID/SECRET` là thực sự chỉ nằm ở server (dùng trong
> `server.ts`/`api/*.ts`, không import vào code frontend).
>
> Vì phạm vi công việc hiện tại là **chỉ cập nhật tài liệu, không sửa code**,
> mục này được ghi lại như một rủi ro đã biết cần đội kỹ thuật cân nhắc xử lý
> (ví dụ: chuyển toàn bộ lời gọi Gemini qua một route backend proxy) ở một
> lần thay đổi code riêng, có kiểm thử đầy đủ.

---

## 6. Build & Deploy

```bash
npm run dev     # tsx server.ts → Express + Vite middleware, cổng 3000
npm run build   # vite build (bundle client) + esbuild server.ts → dist/server.cjs
npm start       # node dist/server.cjs (phục vụ dist/ tĩnh + 2 API route)
npm run lint    # tsc --noEmit (chỉ type-check, không có ESLint/test runner)
```

- Không có bộ test tự động nào trong repo (không có thư mục `__tests__`,
  không có Jest/Vitest trong `package.json`).
- Có cả `package-lock.json` (npm) và `bun.lock` (Bun) trong repo — nghĩa là
  từng có ít nhất 2 công cụ quản lý gói được dùng tại các thời điểm khác
  nhau; nên thống nhất 1 công cụ để tránh lệch phiên bản dependency.
- `metadata.json` và `firebase-applet-config.json` là tàn dư từ việc dự án
  được khởi tạo qua Google AI Studio — không có đoạn code nào trong repo
  import hay tham chiếu tới `firebase-applet-config.json`.

---

## 7. Nợ kỹ thuật đã biết (Known Technical Debt)

Ghi lại để bất kỳ ai (người hoặc AI agent) chạm vào code đều biết trước,
tránh ngỡ ngàng hoặc vô tình "sửa cho giống tài liệu cũ" theo hướng sai:

1. **`App.tsx` ~2.850 dòng** — vi phạm trực tiếp nguyên tắc "không nhồi code
   vào App.tsx" trong AGENTS.md. 11/15 workflow chưa được tách component.
2. **`geminiService.ts` ~1.430 dòng** — toàn bộ prompt engineering của mọi
   workflow dồn vào 1 file, khó review từng phần độc lập.
3. **Trùng lặp backend** giữa `server.ts` và `api/*.ts` (mục 4).
4. **`reportToLark()` đặt tên sai** — thực chất gọi Google Sheets, không
   phải Lark (mục 3.4).
5. **`/api/lark/report` không được gọi** từ bất kỳ đâu trong frontend — code
   backend cho Lark tồn tại nhưng chưa được kích hoạt trong luồng thực tế.
6. **`analyzeAndTranslatePackaging()` không được gọi** — hàm mồ côi, luồng
   dịch bao bì thật dùng `editProductImage()` với prompt khác hẳn.
7. **`AIModel` (`types.ts`) khai báo `imagen-3.0-fast-generate-001` /
   `imagen-3.0-generate-002`** nhưng không nơi nào trong code thực sự gọi
   Imagen — mọi nơi đều hard-code `gemini-3.1-flash-image`.
8. **`GEMINI_API_KEY` bị nhúng vào client bundle** (mục 5) — rủi ro bảo mật
   thật, không chỉ là vấn đề tài liệu.
9. **LockScreen chỉ là UI gate**, không phải xác thực (mục 2.4).
10. **Không có test tự động** và tồn tại song song 2 lockfile (`npm` +
    `bun`).

Các mục 1–3 người dùng đã quyết định **không refactor trong lần làm việc
này** (chỉ cập nhật tài liệu) — xem lại khi có thời gian dành riêng cho việc
tái cấu trúc, kèm kiểm thử thủ công đầy đủ cho từng workflow sau khi tách.

---

## 8. Lịch sử dùng chung (Ảnh đã tạo & Chat) — bổ sung sau bản 2.6

Để khắc phục việc gallery/chat chỉ sống trong IndexedDB của từng trình
duyệt (mục 2.3) và tự xóa sau 7 ngày, hệ thống có thêm 1 nhánh lưu trữ
**dùng chung cho cả team, không phụ thuộc thiết bị/trình duyệt**, dùng
chung Service Account đang có (mở rộng quyền, không tạo secret mới).

### 8.1. Hạ tầng thêm

- **Cloud Firestore** (Native mode, cùng GCP project với tích hợp Sheets) —
  lưu metadata dạng document, hỗ trợ query + phân trang theo `timestamp`.
- **Cloud Storage** (1 bucket riêng, **private**, không public-read) — lưu
  file ảnh thật (ảnh kết quả sinh ra + ảnh trong chat).
- Biến môi trường mới: `GCS_BUCKET_NAME`. Không cần secret mới —
  `GOOGLE_SERVICE_ACCOUNT_JSON` hiện có được cấp thêm 2 quyền IAM:
  `roles/datastore.user` và `roles/storage.objectAdmin` (giới hạn ở bucket
  mới). Việc bật Firestore API, tạo bucket, và cấp quyền IAM là thao tác
  **thủ công trên GCP Console**, không thể tự động hóa từ môi trường code.
- Thêm 1 composite index Firestore (`imageHistory`: `rating` + `timestamp
  desc`) cho tính năng gợi ý tự học ở mục 8.5 — Firestore tự đưa link tạo
  index (1 click) trong thông báo lỗi ở lần đầu chạy query nếu bạn chưa tạo
  trước, không bắt buộc phải làm ngay từ đầu.
- **CORS cho bucket — ĐÃ CẤU HÌNH (2026-09-11).** Client upload ảnh **thẳng
  từ trình duyệt** lên Cloud Storage bằng signed URL (mục 8.3) — đây là
  request cross-origin (origin của app khác với `storage.googleapis.com`).
  Không có CORS policy thì trình duyệt sẽ CHẶN request này (lỗi chỉ hiện
  trong Console, bị nuốt âm thầm bởi thiết kế fail-soft) — hậu quả: ảnh
  không bao giờ lưu được lên Lịch sử dù Firestore/Storage đã đúng.
  - Project: `buyer-api-491308`, bucket: `gs://elmich-ai-history`
    (Firestore Native `asia-southeast1`, Service Account
    `firebase-adminsdk-fbsvc@buyer-api-491308.iam.gserviceaccount.com` đã
    có sẵn `roles/datastore.user` + `roles/storage.objectAdmin`).
  - Policy hiện tại: `origin: ["*"]` (mọi domain), method `PUT`, header
    `Content-Type`, `maxAgeSeconds: 3600`. Dùng `"*"` thay vì domain cụ thể
    vì Vercel sinh domain preview ngẫu nhiên mỗi lần deploy và GCS CORS
    không hỗ trợ wildcard dạng `*.vercel.app` — lớp bảo vệ thật sự vẫn là
    signed URL có thời hạn (mục 8.3–8.4), CORS chỉ quyết định trang nào
    được phép đọc response, không phải ai được phép truy cập. Nếu sau này
    có 1 domain production cố định, nên thu hẹp lại bằng lệnh dưới.
  - Lệnh đã chạy (dùng lại khi cần đổi domain hoặc bucket khác):
    ```bash
    gsutil cors set cors.json gs://elmich-ai-history
    gsutil cors get gs://elmich-ai-history   # xác nhận lại
    ```
  - **Quan sát bảo mật (chưa xử lý, cần bạn quyết định):** service account
    trên đang có thêm `roles/owner` ở project `buyer-api-491308` (rộng hơn
    nhiều so với 2 quyền thực sự cần dùng) — rủi ro nếu
    `GOOGLE_SERVICE_ACCOUNT_JSON` bị lộ thì kẻ tấn công có toàn quyền trên
    cả project, không chỉ Firestore/Storage. Đây là cấu hình có sẵn từ
    trước (không phải do tính năng Lịch sử tạo ra), nên không tự ý thu hẹp
    — có thể ảnh hưởng tích hợp khác (Firebase/Sheets) đang dùng chung
    service account này.

### 8.2. Module & route mới

- `lib/googleCloud.ts` — parse `GOOGLE_SERVICE_ACCOUNT_JSON` dùng chung
  (gom về 1 chỗ thay vì lặp lại như route Sheets/Lark), export
  `getFirestore()` / `getBucket()`.
- `lib/historyStore.ts` — toàn bộ logic nghiệp vụ (`createUploadUrl`,
  `saveImageRecord`, `listImageRecords`, `saveChatSession`,
  `listChatSessions`), được cả `server.ts` và `api/history/*.ts` import
  chung — đây là ví dụ đầu tiên trong repo tránh lặp code giữa 2 môi
  trường deploy, khác với cách `/api/sheets` và `/api/lark` đang bị trùng.
- 5 route: `POST/GET /api/history/upload-url`, `/api/history/images`,
  `/api/history/chats` — xem chi tiết payload trong chính các file route.
- Tất cả đều **fail-soft**: thiếu `GCS_BUCKET_NAME`/Firestore → trả
  `{success:false, error:"..."}` HTTP 200, không làm vỡ luồng sinh ảnh/chat.

### 8.3. Vì sao dùng "signed upload URL" thay vì gửi ảnh qua body API

Ảnh 2K/4K dạng base64 khá nặng (vài MB). Gửi thẳng qua body của Vercel
Serverless Function dễ vượt giới hạn dung lượng request mặc định của nền
tảng đó. Giải pháp: client xin 1 signed URL (`POST /api/history/upload-url`),
rồi `PUT` thẳng file lên Cloud Storage — route backend không bao giờ phải
nhận nguyên ảnh trong body. Điều này cũng khiến `server.ts` (Express, vốn
đã set `limit:'100mb'`) và bản Vercel hoạt động **giống hệt nhau**, không
cần cấu hình riêng cho từng môi trường.

### 8.4. Link ảnh là signed URL có thời hạn (~6 giờ)

Theo lựa chọn bảo mật của người dùng: bucket ở chế độ private, mỗi lần gọi
`GET /api/history/images` hoặc `/api/history/chats`, backend tự sinh signed
URL đọc mới cho từng ảnh. Nghĩa là: (1) không thể dán link ảnh từ trang
Lịch sử vào tài liệu khác để xem vĩnh viễn — phải mở lại từ trang Lịch sử;
(2) nếu người dùng mở tab Lịch sử rồi để rất lâu không thao tác, ảnh có
thể hết hạn hiển thị — bấm "Làm mới" để lấy link mới.

### 8.4b. Hợp nhất với nhánh AI Studio (xóa, cross-nav, mobile drawer)

Song song với thread này, một phiên làm việc khác trong **Google AI Studio
Build mode** (môi trường cloud riêng, đồng bộ qua GitHub repo
`tranhakhoi-elm/AI_Image_Elmich`) cũng độc lập triển khai tính năng Lịch sử
dùng chung, với thiết kế backend khác (upload base64 qua server thay vì
signed URL, bucket public thay vì private, tên collection Firestore khác,
in-memory fallback khi chưa cấu hình Firestore). Hai nhánh đã được **hợp
nhất thủ công** (đọc trực tiếp cả 2 bản, không dùng `git merge` tự động vì
không có lịch sử chung — xem README/quy trình commit): giữ kiến trúc
signed-URL + bucket private của nhánh này (đã được người dùng chọn có chủ
đích vì lý do bảo mật), đồng thời mang qua các tính năng UI có giá trị từ
AI Studio:

- **Xóa ảnh/đoạn chat khỏi Lịch sử dùng chung**: `DELETE /api/history/images?id=`,
  `DELETE /api/history/chats?id=` (dùng query string thay vì path param
  `:id` để route giống hệt nhau ở cả `server.ts` và `api/history/*.ts`,
  tránh phải thêm quy ước dynamic route kiểu `[id].ts` mới cho riêng
  Vercel). Chỉ xóa document Firestore, **không xóa file trong Cloud
  Storage** — chấp nhận rác object mồ côi để thao tác xóa đơn giản/nhanh;
  dọn bucket định kỳ là việc vận hành riêng.
- **Mở lại 1 đoạn chat cũ ngay trong Trợ lý Chat** từ tab Lịch sử (nút "Mở
  trong Trợ lý Chat") — `HistoryView` nhận prop `onOpenChat`, `App.tsx` xử
  lý bằng cách nạp session đó vào `chatSessions` (thêm mới hoặc ghi đè nếu
  đã có) rồi chuyển `viewMode` sang `'chat'`.
- **Ảnh tạo qua chế độ "Tạo ảnh AI" trong Chat cũng được đồng bộ vào tab
  "Lịch sử" > "Ảnh đã tạo"** dùng chung của Studio (`ChatView.tsx` gọi thêm
  `logGeneratedImage` khi sinh ảnh trong chat), không chỉ log vào lịch sử
  hội thoại.
- **Menu drawer trượt cho di động** trong `ChatView.tsx` (`isMobileSidebarOpen`)
  — sidebar danh sách chat chuyển sang overlay trượt trên màn hình nhỏ thay
  vì bị ẩn hoàn toàn.
- **Tìm kiếm + lọc theo workflow + copy prompt** trong `HistoryView.tsx`.
- `handleDeleteSession` (xóa nhanh 1 đoạn chat từ sidebar Chat) giờ cũng
  gọi xóa phía server — trước đây chỉ xóa cục bộ, khiến đoạn chat có thể
  "sống lại" nhờ cơ chế fallback tải từ server ở mục 8.5 nếu cache cục bộ
  trống trở lại.

**Lưu ý khi thao tác với repo GitHub:** bản clone của nhánh AI Studio có 1
thư mục con `ai-image-elmich/` chứa bản sao lồng toàn bộ project — nhiều
khả năng là lỗi thao tác (export/commit nhầm) chứ không chủ đích. Chưa xóa
trong lần hợp nhất này; cần người dùng xác nhận trước khi dọn.

### 8.5. Vòng phản hồi tự học từ lịch sử đã duyệt ("Rất tốt!" → chỉ dẫn theo dòng sản phẩm)

Mở rộng cơ chế cũ (`SuccessfulPrompt` cục bộ trong `App.tsx`, chỉ sống
trong `localStorage` của 1 trình duyệt) thành cơ chế **dùng chung cho cả
team**, dựa trên collection `imageHistory` đã có ở mục 8.1–8.2. Bản đầu
tiên của cơ chế này (`listApprovedPrompts`/`fetchApprovedPromptHints`) trích
dẫn nguyên văn tối đa 3 prompt đã duyệt vào prompt lần sau — đã bị **thay
thế hoàn toàn** bởi cơ chế "category guidance" dưới đây vì trích dẫn nguyên
văn prompt cũ không phải điều mong muốn (dễ khiến AI lặp lại y hệt sản phẩm
cũ thay vì học phong cách chung).

- `logGeneratedImage()` (client) gửi kèm `id` — trùng với `GeneratedImage.id`
  trong gallery cục bộ — để `saveImageRecord()` dùng làm doc id trên
  Firestore thay vì tự sinh UUID, để sau này có thể "đánh giá" đúng bản ghi
  này.
- Khi người dùng bấm "Rất tốt!" ở modal phản hồi (`App.tsx`, sau khi tải
  ảnh về), `rateImageRecord()` (`lib/historyStore.ts`) suy luận thêm
  **`productCategory`** (dòng sản phẩm, vd `binh_giu_nhiet`, `noi_com_dien`)
  từ `productName`/`productCode` đã lưu sẵn trên bản ghi, bằng
  `inferProductCategory()` (`lib/categoryGuidance.ts`, gọi Gemini text
  `gemini-2.5-flash`, neo theo 1 danh sách dòng gia dụng phổ biến của Elmich
  để hạn chế cùng 1 dòng sản phẩm bị tách thành nhiều category do câu chữ
  khác nhau), rồi gọi `rebuildCategoryGuidanceIfEligible()` để tổng hợp lại
  guidance cho đúng cặp (`visualStyle`, `productCategory`) — xem chi tiết ở
  mục 8.5b.
- **Đây là lời gọi Gemini TEXT model đầu tiên chạy ở phía server** (mọi lời
  gọi `GoogleGenAI` khác trong dự án đều ở client, `services/geminiService.ts`).
  Dùng lại `GEMINI_API_KEY` đã có sẵn trong `.env`/biến môi trường server
  (nạp qua `dotenv.config()` trong `server.ts`), không cần thêm cấu hình
  riêng.
- Đây **không phải fine-tuning mô hình** — Gemini image model không hỗ trợ
  fine-tune theo hướng này cho use case của dự án. Đây là kỹ thuật đúc kết
  chỉ dẫn phong cách từ dữ liệu lịch sử đã được con người duyệt, rẻ và
  không cần hạ tầng ML riêng.
- Áp dụng cho cả 11 workflow (`generateProductImage`) **lẫn** ảnh tạo qua
  Chat (`generateImageForChat`) — với Chat, category được suy luận từ nội
  dung tin nhắn cuối của người dùng (`freeText`) thay vì `productName` có
  cấu trúc, vì Chat log ảnh với `productName: 'Trợ lý Chat AI'` (placeholder,
  không phải tên sản phẩm thật).
- **Chat hiện chỉ tiêu thụ guidance, chưa đóng góp ngược lại** — `ChatView.tsx`
  chưa có UI đánh giá ảnh "Rất tốt!"/"Không hẳn" như modal ở `App.tsx`, nên
  ảnh tạo qua Chat không thể trở thành nguồn mẫu cho guidance (nợ kỹ thuật/
  phạm vi cố ý để ngỏ cho phase sau).

### 8.5b. Category guidance — cấu trúc dữ liệu & đường đi tổng hợp

Toàn bộ logic nằm ở `lib/categoryGuidance.ts` (không phải trong
`lib/historyStore.ts`, để tách rõ 2 mối quan tâm: lưu trữ lịch sử thô vs.
đúc kết tri thức):

- Collection Firestore mới `categoryGuidance`, doc id =
  `${visualStyle}::${productCategorySlug}` — tra cứu **O(1) theo id**, không
  cần composite index mới (khác với `imageHistory` cần index
  `rating` + `timestamp`).
- `listGoodSamplesForCategory()`: dùng lại đúng trick đã có ở
  `listApprovedPrompts` cũ (query `imageHistory` where `rating == "good"`
  order by `timestamp desc` limit 50, lọc `visualStyle` + `productCategory`
  ở tầng JS) — tái sử dụng composite index đã có sẵn, không cần index riêng
  cho category.
- `synthesizeCategoryGuidance()`: chỉ chạy khi đã có ít nhất 3 mẫu "good"
  cho đúng cặp (visualStyle, category) — gọi Gemini text đúc kết tối đa 15
  mẫu gần nhất thành 1 đoạn chỉ dẫn ngắn gọn dạng gạch đầu dòng (chất liệu,
  ánh sáng, bố cục, góc máy, nên/không nên). **Ghi đè toàn bộ** `guidanceText`
  mỗi lần tổng hợp lại (không nối chuỗi tích luỹ) để tránh phình to/trôi nội
  dung theo thời gian.
- `getCategoryGuidanceFor()`: đọc guidance cho 1 lượt tạo ảnh mới — suy luận
  category từ sản phẩm/tin nhắn hiện tại rồi đọc thẳng doc theo id. Trả về
  rỗng (không lỗi) nếu chưa đủ mẫu hoặc chưa suy luận được category — luồng
  tạo ảnh vẫn chạy bình thường như trước khi có tính năng này.
- Route: `GET /api/history/category-guidance` (`api/history/category-guidance.ts`
  + route Express tương ứng trong `server.ts`), gọi từ client qua
  `fetchCategoryGuidance()` (`services/historyService.ts`) ở cả
  `App.tsx::startGeneration()` và `ChatView.tsx::handleSendMessage()`.
- **Phạm vi cố ý để ngỏ cho phase sau:** backfill `productCategory` cho các
  bản ghi "good" cũ trước khi tính năng này tồn tại; UI quản trị xem/sửa tay
  guidance đã tổng hợp (hiện tự động hoàn toàn, không có bước duyệt của con
  người); áp dụng guidance cho `chatWithAI` (hội thoại văn bản thuần, không
  tạo ảnh).

### 8.6. Bug đã sửa: Chat không hiện lại ở trình duyệt khác

**Triệu chứng:** người dùng chat ở máy A, mở app ở máy B (hoặc tab ẩn danh,
hoặc sau khi xóa cache) — tab "Trợ lý Chat" trống trơn, dù dữ liệu đã lưu
đúng ở Firestore (kiểm tra được qua tab "Lịch sử" riêng).

**Nguyên nhân thật:** `App.tsx` có 2 useEffect load dữ liệu lúc khởi động —
1 cho gallery, 1 cho `chatSessions` — cả 2 đều **chỉ đọc từ `localforage`
(IndexedDB cục bộ)**, không bao giờ gọi `fetchChatHistory()`/`fetchImageHistory()`.
Hai hàm đó chỉ được gọi trong `HistoryView.tsx` (tab "Lịch sử" riêng biệt).
Nghĩa là: dữ liệu VẪN được ghi lên server đúng như thiết kế, nhưng **thanh
bên "Lịch sử chat" trong chính tab Trợ lý Chat không bao giờ đọc lại từ
server** — nó chỉ là cache cục bộ, y hệt hành vi cũ trước khi có tính năng
Lịch sử dùng chung.

**Đã sửa (`App.tsx`, effect load `chatSessions`):** nếu `localforage` trống
(trình duyệt mới/tab ẩn danh) hoặc toàn bộ dữ liệu cục bộ đã quá hạn 7 ngày,
tự động gọi `fetchChatHistory()` để lấy lại danh sách phiên chat DÙNG CHUNG
từ server và hiển thị ngay trong thanh bên Chat — không cần vòng qua tab
"Lịch sử" riêng nữa. Nếu backend chưa cấu hình, hàm này tự trả về rỗng, ứng
dụng vẫn hoạt động bình thường như trước (không crash).

**Cố ý CHƯA áp dụng fix tương tự cho gallery ảnh Studio:** mỗi `GeneratedImage`
cục bộ mang theo `settings: GenerationSettings` đầy đủ (nhiều field bắt
buộc) để phục vụ chỉnh sửa/tạo lại — trong khi bản ghi server chỉ có
metadata rút gọn (mục 8.7 bên dưới). Dựng lại 1 `GenerationSettings` giả từ
dữ liệu rút gọn đó rủi ro hơn (có thể gây lỗi khi bấm "chỉnh sửa" 1 ảnh tải
về từ server) nên chưa làm trong lần sửa này — tab "Lịch sử" riêng vẫn là
nơi đúng để xem lại ảnh cũ từ máy khác, gallery Studio vẫn chỉ là cache tạm
cho phiên làm việc hiện tại như tài liệu tại mục 8.7 đã ghi.

### 8.6b. Bug đã sửa: Vercel trả "A server error has occurred" (không phải JSON) cho route rate/approved

**Triệu chứng:** tab Lịch sử báo lỗi `Unexpected token 'A', "A server e"...
is not valid JSON` — nghĩa là response không phải JSON như code client kỳ
vọng, mà là trang lỗi mặc định của Vercel (`FUNCTION_INVOCATION_FAILED`),
tức 1 Serverless Function bị crash trước khi kịp trả JSON.

**Nguyên nhân:** `api/history/images/rate.ts` và `api/history/images/approved.ts`
từng nằm trong thư mục con `api/history/images/`, trong khi `api/history/images.ts`
(file xử lý `GET`/`POST`/`DELETE` cho `/api/history/images`) là 1 **file
cùng tên** ở cấp cha. Vercel build file-system routing cho `api/` không xử
lý ổn định trường hợp vừa có file `images.ts` vừa có thư mục `images/` làm
route cha của route con — gây lỗi khi build/invoke function tương ứng.

**Đã sửa:** dời 2 route này ra thành file phẳng, không lồng thư mục trùng
tên với file khác:
- `POST /api/history/images/rate` → `POST /api/history/rate-image`
  (`api/history/rate-image.ts`)
- `GET /api/history/images/approved` → `GET /api/history/approved-prompts`
  (`api/history/approved-prompts.ts`)

Đã cập nhật đồng bộ ở `server.ts` (route Express) và
`services/historyService.ts` (URL client gọi) — 2 nơi này luôn phải khớp
tên route với nhau vì cùng 1 client code chạy trên cả 2 kiểu deploy.

> **Cập nhật (mục 8.5b):** `GET /api/history/approved-prompts` bản thân nó
> sau đó cũng bị thay thế hoàn toàn bởi `GET /api/history/category-guidance`
> — bài học về routing phẳng ở trên vẫn áp dụng cho route mới.

### 8.7. Phạm vi cố ý KHÔNG làm trong v1

- Không lưu lại các ảnh **đầu vào** (ảnh mẫu màu, các mặt bao bì, ảnh
  track/socket...) đi kèm mỗi lần tạo — chỉ log ảnh **đầu ra** + metadata.
  `GenerationSettings` đầy đủ vẫn chỉ nằm trong gallery cục bộ như cũ.
- Không có `costUSD`/`tokens` chính xác tuyệt đối cho lịch sử — dùng lại
  hàm ước tính chi phí hiển thị sẵn có ở client (`calculateCost` trong
  `App.tsx`), cùng độ chính xác (ước tính) như bảng chi phí trong
  HANDBOOK.md mục 8, không phải số liệu billing thật.
- Vẫn là log dùng chung toàn team (không phân biệt người tạo ngoài
  `productName`/`productCode` nhập tay) — khớp với mô hình "1 PIN chung"
  hiện có, không có khái niệm tài khoản cá nhân.
- Mọi route ghi (`POST /api/history/images`, `/api/history/chats`,
  `/api/history/rate-image`) hiện **không có xác thực nào ngoài việc cùng
  origin với app** — bất kỳ ai gọi được API (kể cả không qua UI) đều có thể
  ghi dữ liệu giả hoặc tự "dìm"/"đẩy" đánh giá `rating` của bất kỳ ảnh nào
  vào lịch sử dùng chung. Chấp nhận được cho một tool nội bộ đã có PIN chặn
  ở tầng UI, nhưng cần biết đây không phải hàng rào bảo mật thật ở tầng
  API — và vì `categoryGuidance` được nhúng thẳng vào prompt sinh ảnh (mục
  8.5/8.5b), dữ liệu `rating` giả có thể ảnh hưởng trực tiếp đến chất lượng
  chỉ dẫn cho cả team.
