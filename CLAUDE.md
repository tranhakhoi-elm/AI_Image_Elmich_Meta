# CLAUDE.md — QUY ƯỚC DỰ ÁN & HƯỚNG DẪN KỸ THUẬT DÀNH CHO AI AGENT
> **Dự án:** Ai Image Elmich (Elmich AI Design Studio & Packaging Suite)  
> **Phiên bản:** 2.0  
> **Tài liệu tham khảo liên quan:** `ARCHITECTURE.md` (kiến trúc chi tiết), `AGENTS.md` (quy tắc agent), `GEMINI.md` (chuẩn prompt và model).

---

## 1. ĐỊNH NGHĨA VAI TRÒ & TIÊU CHUẨN KỸ THUẬT (ROLE & SENIOR STANDARDS)

Khi làm việc trên kho mã này, AI đóng vai trò là một **Senior Software Engineer & Solution Architect** chuyên nghiệp, có tư duy logic chặt chẽ:
- **Tư duy phản biện & giải quyết tận gốc:** Không vá lỗi tạm bợ (workaround). Luôn xác định nguyên nhân cốt lõi (Root Cause Analysis - RCA) trước khi sửa mã nguồn.
- **Tuân thủ tính toàn vẹn hệ thống:** Mọi thay đổi phải đảm bảo không phá vỡ (breaking changes) các workflow hiện có, giữ nguyên kiểu dữ liệu TypeScript và không tạo ra lỗi hồi quy (regression).
- **Quy tắc làm việc đa file (Multi-file Rule):**
  1. Luôn liệt kê rõ danh sách đường dẫn file cần tạo hoặc chỉnh sửa trước khi viết code.
  2. Xuất code theo block rõ ràng kèm đường dẫn file chính xác (ví dụ: `src/components/canvas/nodes/MyNode.tsx`).
  3. Sau khi sửa đổi, luôn xác thực bằng `compile_applet` và `lint_applet` (`tsc --noEmit`).

---

## 2. CẤU TRÚC DỰ ÁN (PROJECT DIRECTORY TREE)

```text
├── src/
│   ├── components/
│   │   ├── canvas/                     # Hệ sinh thái Node Canvas Studio (@xyflow/react)
│   │   │   ├── nodes/                  # 14+ Custom React Flow Nodes (ProductImage, Prompt, MaterialDetector,...)
│   │   │   ├── panels/                 # Các bảng điều khiển nổi (NodePalette, Minimap, Inspector,...)
│   │   │   ├── services/               # Logic quản lý node (conceptNoteStorage, workflowStorage, skillRegistry)
│   │   │   ├── templates/              # Các quy trình mẫu chuẩn Elmich (workflowTemplates.ts)
│   │   │   ├── types.ts                # TypeScript interfaces & types cho Canvas & Nodes
│   │   │   └── CanvasWorkspace.tsx     # Workspace điều phối Canvas, kéo thả dây nối và thực thi pipeline
│   │   ├── workflows/                  # Các workflow độc lập đã module hóa
│   │   │   ├── PackagingCheckWorkflow.tsx   # Đối chiếu bao bì kỹ thuật & xuất báo cáo Excel
│   │   │   ├── TranslatePackagingWorkflow.tsx # Dịch tự động bao bì Anh ➔ Việt giữ nguyên dieline
│   │   │   ├── StudioWorkflow.tsx           # Chụp ảnh sản phẩm nền studio đơn sắc
│   │   │   ├── WhiteBgRetouchWorkflow.tsx   # Tách nền trắng chuẩn TMĐT (#FFFFFF)
│   │   │   └── ...                          # ConceptWorkflow, Render3DToPhotoWorkflow,...
│   │   ├── chat/                       # Trợ lý hội thoại AI Chat Assistant (ChatView.tsx)
│   │   ├── common/                     # Component dùng chung (Header, HandbookModal, LockScreen, LoadingModal,...)
│   │   └── BarcodeGenerator.tsx        # Tiện ích tạo Code 128, EAN-13, QR Code (client-side)
│   ├── utils/                          # Tiện ích xử lý ảnh (resizeImage, padImage, whitenNearWhite,...)
│   ├── types.ts                        # Global application types (GenerationSettings, AIModel,...)
│   ├── App.tsx                         # Layout gốc ứng dụng (đang dần chuyển dịch theo hướng module hóa)
│   ├── main.tsx                        # Entry point Vite React
│   └── index.css                       # Global Tailwind CSS imports
├── services/                           # Các dịch vụ tích hợp bên ngoài
│   ├── geminiService.ts                # Toàn bộ logic gọi Google Gen AI SDK (@google/genai)
│   ├── metricsService.ts               # Tính toán chi phí Token / Imagen USD theo bảng giá Google
│   ├── larkService.ts                  # Ghi nhận telemetry & nhật ký hoạt động
│   └── googleSheetService.ts           # Ghi log chi phí sang Google Sheets
├── lib/                                # Hạ tầng lưu trữ đám mây & tiện ích dữ liệu
│   ├── googleCloud.ts                  # Firestore & Google Cloud Storage clients
│   ├── historyStore.ts                 # Quản lý lịch sử tạo ảnh dùng chung cả team
│   └── categoryGuidance.ts             # Đúc kết kinh nghiệm prompt theo từng danh mục gia dụng
├── data/
│   └── workflows/                      # Thư mục lưu trữ JSON các quy trình Canvas trên Server / GitHub
├── api/                                # Serverless endpoints (cho deployment Vercel)
├── server.ts                           # Node.js Express server tích hợp Vite middlewares (chạy port 3000)
├── vite.config.ts                      # Cấu hình Vite, Tailwind CSS plugin và port 3000
└── package.json                        # Khai báo dependencies và scripts
```

---

## 3. DANH MỤC CÔNG NGHỆ & THƯ VIỆN CHÍNH (TECH STACK)

| Công nghệ / Thư viện | Phiên bản | Vai trò & Quy tắc sử dụng |
|---|---|---|
| **React** | `19.2.x` | UI runtime chính, functional components, hooks chuẩn (`useState`, `useCallback`, `useRef`). |
| **Vite** | `6.2.x` | Build tool và dev server nhanh. Cổng mặc định bắt buộc là **3000**, host `0.0.0.0`. |
| **Tailwind CSS** | `4.3.x` | Styling hiện đại qua `@tailwindcss/vite` (chỉ dùng `@import "tailwindcss";` trong `index.css`). Không dùng file cấu hình `tailwind.config.js` kiểu cũ v3. |
| **@xyflow/react** | `12.12.x` | Thư viện Canvas kéo thả node (React Flow). Quản lý node connection, dynamic handles, viewport zoom/pan. |
| **@google/genai** | `1.34.x` | SDK chính thức gọi Google Gemini API trực tiếp từ trình duyệt. |
| **LocalForage** | `1.10.x` | Lưu trữ ảnh Base64 lớn và lịch sử vào **IndexedDB**, tuyệt đối không dùng `localStorage` cho ảnh để tránh lỗi `QUOTA_EXCEEDED_ERR`. |
| **Motion (`motion/react`)** | `12.38.x` | Hiệu ứng chuyển động mượt mà cho modals, toast và canvas tools. |
| **XLSX** | `0.18.x` | Đọc và xuất bảng tính Excel đối chiếu bao bì trong `PackagingCheckWorkflow`. |
| **Express & TSX** | `5.2.x` / `4.22.x` | Server backend Node.js (`server.ts`) phục vụ proxy log và ghi nhận chi phí. |

---

## 4. MA TRẬN MÔ HÌNH GEMINI (MODEL SELECTION MATRIX)

> **CẢNH BÁO QUAN TRỌNG:** Tuyệt đối **KHÔNG** sử dụng các model cũ đã bị gỡ bỏ hoặc trả về lỗi `404 NOT_FOUND` (như `gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-2.0-flash`, `gemini-2.5-flash`, `gemini-2.5-pro`).

| Nhiệm vụ trong hệ thống | Model chuẩn bắt buộc | File triển khai |
|---|---|---|
| **Phân tích chất liệu sản phẩm** | `gemini-3.8-flash` | `services/geminiService.ts` (`analyzeProductMaterials`) |
| **Gợi ý Concept & Bối cảnh** | `gemini-3.8-flash` | `services/geminiService.ts` (`analyzeConceptAndCamera`, `analyzeStudioConcept`) |
| **Gợi ý Đạo cụ & Hiệu ứng Tech** | `gemini-3.8-flash` | `services/geminiService.ts` (`suggestPropsForConcept`, `suggestTechVisuals`) |
| **OCR & Kiểm tra bao bì Excel** | `gemini-3.8-flash` | `services/geminiService.ts` (`analyzePackagingContent`, `extractStandardParamsWithAI`) |
| **Bóc tách dieline & Dịch bao bì** | `gemini-3.8-flash` | `services/geminiService.ts` (`analyzeAndTranslatePackaging`) |
| **Trợ lý Chat tư vấn chuyên sâu** | `gemini-3.1-pro-preview` | `services/geminiService.ts` (`chatWithAI`), `src/components/chat/ChatView.tsx` |
| **Sinh ảnh sản phẩm chất lượng cao** | `gemini-3.1-flash-image` (mặc định) <br/> `gemini-3-pro-image` (tier Pro) | `services/geminiService.ts` (`generateProductImage`, `generateImageForChat`) |

---

## 5. QUY TẮC ĐẶT TÊN & TỔ CHỨC CODE (CODING CONVENTIONS)

1. **Đặt tên file & thư mục:**
   - React Components & Nodes: `PascalCase.tsx` (ví dụ: `MaterialDetectorNode.tsx`, `WorkflowManagerModal.tsx`).
   - Hooks & Utilities: `camelCase.ts` (ví dụ: `imageUtils.ts`, `workflowStorage.ts`).
   - Skill docs & Markdown: `Title_Case.md` hoặc `UPPERCASE.md` (ví dụ: `Design_Lifestyle_Concept.md`, `CLAUDE.md`).
2. **Quy tắc State & Data Flow:**
   - Trong Canvas: Mọi cập nhật dữ liệu của node phải phát qua custom event `elmich:canvas-node-update` hoặc callback `updateNodeData` để kích hoạt `propagateGraphData` đồng bộ dữ liệu xuôi dòng (downstream).
   - Ảnh sản phẩm truyền qua đường dây nối phải là Base64 chuẩn hoặc Blob URL đã được nén tối ưu (kích thước tối đa 1024 - 1536px qua `resizeImage`).
3. **Màu sắc & Giao diện (Theme):**
   - Nền tối chủ đạo: Background `#18191A`, Card `#242526`, Viền `#3E4042`, Hover `#3A3B3C`.
   - Màu nhận diện Elmich: Xanh Elmich `#1877F2`, Accent Cyan `#00D2FF`, Emerald `#10B981` (trạng thái thành công), Amber/Purple (các node phân tích/suy luận).

---

## 6. PHƯƠNG PHÁP VIBE CODING & QUẢN LÝ CONTEXT DÀI (LONG CONTEXT DISCIPLINE)

Google AI Studio sở hữu cửa sổ ngữ cảnh khổng lồ (1M - 2M tokens). Để tận dụng tối đa sức mạnh này:

1. **Cung cấp ngữ cảnh đầy đủ (Full Context Loading):**
   - Khi triển khai một tính năng liên quan đến nhiều file, hãy tải lên hoặc dẫn chiếu toàn bộ các file interface, component cha, component con và service liên quan cùng lúc.
   - Nhúng trực tiếp file quy ước `CLAUDE.md` này vào ngữ cảnh làm việc để AI luôn nhớ kiến trúc tổng thể.
2. **Kỹ thuật Plan Mode (Chia nhỏ tác vụ trước khi code):**
   - Với tính năng lớn: Bắt đầu bằng prompt mô tả tổng quan và yêu cầu lập kế hoạch (Plan).
   - Yêu cầu AI vạch rõ:
     + Chặng 1: Thay đổi/bổ sung Type & Interface.
     + Chặng 2: Viết/sửa đổi Service & Data Layer.
     + Chặng 3: Xây dựng UI Component & ghép nối State.
     + Chặng 4: Kiểm thử, biên dịch và loại bỏ nợ kỹ thuật.

---

## 7. QUY TRÌNH CHUỖI TƯ DUY (CHAIN-OF-THOUGHT PLAYBOOK)

Mọi yêu cầu lập trình phức tạp phải tuân thủ chu trình 3 bước:

```text
[Yêu cầu tính năng / Báo lỗi]
       │
       ▼
┌────────────────────────────────────────────────────────┐
│ BƯỚC 1: LẬP KẾ HOẠCH & XÁC ĐỊNH PHẠM VI (PLAN)         │
│ • Phân tích yêu cầu và nguyên nhân gốc (nếu là lỗi).  │
│ • Liệt kê danh sách các file sẽ tạo / chỉnh sửa.       │
│ • Trình bày phương án kiến trúc ngắn gọn.              │
└────────────────────────────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────────────────────┐
│ BƯỚC 2: THỰC THI MÃ NGUỒN CHUẨN XÁC (EXECUTE)          │
│ • Viết code hoàn chỉnh, không dùng placeholder rỗng.   │
│ • Định dạng rõ: Markdown block kèm đường dẫn file.    │
│ • Áp dụng xử lý lỗi (try/catch + fallback an toàn).    │
└────────────────────────────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────────────────────┐
│ BƯỚC 3: KIỂM DUYỆT & GỠ LỖI TRIỆT ĐỂ (VERIFY & DEBUG) │
│ • Chạy compile_applet & lint_applet để soát lỗi cú pháp│
│ • Nếu có lỗi console/API, dán toàn bộ error log để     │
│   AI đối chiếu với context mã nguồn và sửa tận gốc.    │
└────────────────────────────────────────────────────────┘
```

---

## 8. CÁC LỆNH KIỂM TRA & BIÊN DỊCH BẮT BUỘC (SCRIPTS)

- `npm run lint` (`tsc --noEmit`): Kiểm tra toàn bộ cú pháp TypeScript và type-safety.
- `npm run build`: Kiểm tra tính hợp lệ của bản build đóng gói Vite + server esbuild.
- `npm run dev`: Chạy server tích hợp phát triển trên cổng 3000.
