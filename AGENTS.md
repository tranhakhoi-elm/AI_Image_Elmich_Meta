# AGENTS.MD — HƯỚNG DẪN DÀNH CHO AI AGENT TRÊN DỰ ÁN ELMICH AI STUDIO

Tài liệu này xác định các quy tắc, nguyên tắc kiến trúc và tiêu chuẩn mã nguồn bắt buộc cho bất kỳ AI Coding Agent nào làm việc trên kho mã này.

> Trước khi sửa code, đọc thêm [ARCHITECTURE.md](ARCHITECTURE.md) (thực
> trạng kỹ thuật chi tiết + danh sách nợ kỹ thuật đã biết) và
> [SKILLS.md](SKILLS.md) (cơ chế skill file dùng trong prompt). Tài liệu
> hiện tại chỉ tóm tắt quy tắc; ARCHITECTURE.md là nguồn chi tiết/chính xác
> hơn khi có mâu thuẫn.

---

## 1. TỔNG QUAN DỰ ÁN & VAI TRÒ
- **Tên dự án:** Ai Image Elmich (Elmich AI Design Studio & Packaging Suite)
- **Mục tiêu:** Hệ thống thiết kế đồ họa sản phẩm gia dụng Elmich, hỗ trợ tạo ảnh quảng cáo, bóc tách kỹ thuật, mockup bao bì 3D, dịch bao bì tự động và kiểm duyệt bao bì đối chiếu Excel.
- **Công nghệ chính:** React 19, Vite, Tailwind CSS, Motion (`motion/react`), Express server (`server.ts`), Google Gen AI SDK (`@google/genai`), LocalForage, XLSX, JsBarcode, qrcode-svg, jsQR, `@google-cloud/firestore` + `@google-cloud/storage` (Lịch sử dùng chung — xem `lib/googleCloud.ts`, `lib/historyStore.ts`, ARCHITECTURE.md mục 8).
- **Điểm đặc thù cần biết trước khi sửa code:** ứng dụng gọi Gemini **trực
  tiếp từ trình duyệt** (`services/geminiService.ts`), không qua backend —
  backend (`server.ts` + `api/*.ts`) chỉ phục vụ ghi log chi phí ra Google
  Sheets. Xem ARCHITECTURE.md mục 1 và 5.

---

## 2. NGUYÊN TẮC KIẾN TRÚC MÃ NGUỒN (MODULARITY RULES)
1. **Không nhồi nhét code vào App.tsx (nguyên tắc — hiện TRẠNG THÁI THỰC TẾ chưa đạt được):**
   - `App.tsx` hiện có ~2.850 dòng và chứa state + UI của 11/15 workflow.
     Đây là nợ kỹ thuật đã biết (xem ARCHITECTURE.md mục 7), **không phải
     mẫu để làm theo** — khi thêm workflow mới hoặc sửa lớn 1 workflow cũ,
     hãy tách thành component riêng trong `src/components/`, theo đúng
     tinh thần quy tắc này, thay vì thêm tiếp state/JSX vào `App.tsx`.
   - Mọi workflow chuyên biệt, modal hoặc tiện ích độc lập phải được tách thành component con trong thư mục `src/components/`.
   - 4 workflow đã được tách đúng chuẩn (dùng làm ví dụ tham khảo):
     - `src/components/workflows/PackagingCheckWorkflow.tsx`: Kiểm tra đối chiếu bao bì và xuất Excel.
     - `src/components/workflows/TranslatePackagingWorkflow.tsx`: Dịch bao bì tự động tiếng Anh sang tiếng Việt.
     - `src/components/BarcodeGenerator.tsx`: Tạo mã vạch Code 128, EAN-13, QR Code (không gọi AI).
     - `src/components/chat/ChatView.tsx`: Trợ lý hội thoại và tạo ảnh từ chat.
   - Các component dùng chung (`src/components/common/`):
     - `Header.tsx`: Thanh điều hướng chính và chuyển đổi chế độ Studio / Chat / Handbook.
     - `HandbookModal.tsx`: Bản tóm tắt HANDBOOK.md hiển thị trực tiếp trên UI (cần cập nhật song song nếu sửa HANDBOOK.md phần workflow/kiến trúc/chi phí).
     - `GalleryRail.tsx`: Thanh hiển thị bộ sưu tập ảnh đã tạo trong phiên.
     - `LockScreen.tsx`: Màn hình chặn UI bằng mã PIN nội bộ (`15012026` hoặc `1111`) — đây **không phải** cơ chế xác thực bảo mật thật, chỉ là lớp chặn truy cập vãng lai (xem ARCHITECTURE.md mục 2.4).
     - `LoadingModal.tsx`: Lớp phủ thông báo trạng thái xử lý AI toàn màn hình.

2. **Quy tắc Xử lý Dữ liệu & Storage:**
   - Sử dụng **LocalForage (IndexedDB)** thay cho `localStorage` khi lưu trữ dữ liệu lớn (ảnh Base64, lịch sử chat nhiều tin nhắn) để tránh lỗi tràn hạn mức bộ nhớ (`QUOTA_EXCEEDED_ERR`).
   - Tối ưu kích thước ảnh trước khi gửi sang API Gemini bằng hàm `resizeImage` trong `src/utils/imageUtils.ts` (mặc định giới hạn kích thước phân tích tối đa 1024 - 1536px).

3. **Backend & Bảo mật API Key (thực trạng — KHÁC với mục tiêu lý tưởng):**
   - Khởi tạo cổng máy chủ duy nhất là **3000** trên host **0.0.0.0** (chỉ áp dụng cho `server.ts` khi tự host; deploy Vercel dùng các file riêng trong `api/`, xem ARCHITECTURE.md mục 4).
   - `GOOGLE_SERVICE_ACCOUNT_JSON`, `GOOGLE_SHEET_ID`, `LARK_APP_ID`/`LARK_APP_SECRET` **thực sự** chỉ được đọc ở phía server (`process.env.*` trong `server.ts`/`api/*.ts`) — không đưa các khóa này vào code frontend.
   - **NGOẠI LỆ QUAN TRỌNG:** `GEMINI_API_KEY` hiện **bị nhúng vào bundle JS
     phía client** do `vite.config.ts` dùng `define` để inline giá trị thật
     của biến môi trường vào code build ra — nghĩa là khóa này lộ ra cho
     bất kỳ ai xem file JS đã build. Đây là rủi ro bảo mật thật đã biết,
     không phải hành vi mong muốn. **Không copy lại pattern này** cho bất
     kỳ khóa bí mật nào khác; nếu được yêu cầu sửa vấn đề này, giải pháp
     đúng là chuyển lời gọi Gemini qua một route backend proxy (không phải
     việc nhỏ — cần bàn với người dùng trước vì ảnh hưởng toàn bộ luồng
     gọi AI hiện tại chạy thẳng từ client).

---

## 3. NGUYÊN TẮC THIẾT KẾ GIAO DIỆN (UI/UX PRINCIPLES)
- **Tông màu chủ đạo:** Tông tối hiện đại cao cấp (`#18191A`, `#242526`, viền `#3E4042`), điểm nhấn màu xanh Elmich (`#1877F2`) và màu phụ trợ thương hiệu.
- **Trải nghiệm thao tác (UX):**
  - Luôn có feedback loading rõ ràng khi AI đang xử lý (không để nút bấm câm lặng).
  - Sử dụng modal chặn toàn màn hình khi đang tạo ảnh để người dùng không bấm trùng lặp tác vụ.
  - Hỗ trợ xem trước ảnh ở độ phân giải cao và nút tải về rõ ràng.

---

## 4. QUY CHUẨN PROMPT CHO SẢN PHẨM GIA DỤNG ELMICH
- Mọi prompt sinh ảnh sản phẩm Elmich phải luôn mô tả chính xác:
  - **Inox 304:** Cần có vân xước satin mờ (`brushed satin finish`) và vệt sáng phản quang chân thực.
  - **Lớp chống dính:** Bề mặt vi hạt mờ (`micro-granite non-stick texture`).
  - **Thủy tinh:** Trong suốt chịu nhiệt borosilicate có khúc xạ ánh sáng sắc sảo.
  - **Logo thương hiệu:** Luôn giữ nguyên logo Elmich ở vị trí tự nhiên trên sản phẩm.

---

## 5. QUY TRÌNH THỰC THI MẶC ĐỊNH (DEFAULT INTERACTIVE CLAUDE CODE STYLE)
Từ nay, với **MỌI YÊU CẦU MỚI** từ người dùng (không cần người dùng phải nhắc câu lệnh định hướng), Agent **BẮT BUỘC TUÂN THỦ NGHIÊM NGẶT** quy trình tương tác 2 giai đoạn:

### Giai đoạn 1: Khảo sát & Đề xuất Kế hoạch (BẮT BUỘC DỪNG CHỜ XÁC NHẬN)
1. **Khảo sát ngữ cảnh (Context Gathering):**
   - Đọc kỹ mã nguồn liên quan bằng `view_file` trước.
   - Đối chiếu `ARCHITECTURE.md`, `types.ts`, và các component liên quan.
2. **Trình bày Kế hoạch & Điểm kiểm tra (Plan Breakdown & Confirmation Checkpoint):**
   - Trình bày rõ ràng: (a) Phân tích hiện trạng & nguyên nhân, (b) Đề xuất giải pháp kiến trúc, (c) Danh sách các file dự kiến tạo/sửa.
   - **ĐIỀU KIỆN TIÊN QUYẾT:** Dừng lại hỏi người dùng xác nhận kế hoạch. **TUYỆT ĐỐI KHÔNG tự ý viết code, tạo file hay sửa code khi người dùng chưa đồng ý duyệt kế hoạch.**

### Giai đoạn 2: Triển khai sau khi người dùng phê duyệt (Implementation & Verification)
3. **Thực thi chuẩn Modular (Clean Implementation):**
   - Tuân thủ nguyên tắc không nhồi nhét `App.tsx`.
   - Viết code hoàn chỉnh, sạch, giữ nguyên design system Elmich.
4. **Tự động Thẩm định (Verification & Linting):**
   - Chạy `lint_applet` và `compile_applet` để đảm bảo 0 lỗi build.
5. **Báo cáo kết quả rõ ràng (Executive Summary):**
   - Tóm tắt những thay đổi đã hoàn thành và hướng dẫn kiểm thử.

