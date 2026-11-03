# SKILLS.MD — HỆ THỐNG "SKILL FILE" CỦA ELMICH AI STUDIO

> Tài liệu này giải thích cơ chế mà dự án dùng để dạy Gemini "phong cách
> chuẩn Elmich" cho từng loại ảnh — gọi tắt là **skill file**. Đọc kèm
> [ARCHITECTURE.md](ARCHITECTURE.md) mục 3 (lớp service) để hiểu bối cảnh kỹ
> thuật, và [GEMINI.md](GEMINI.md) để xem chi tiết prompt mẫu.

---

## 1. Skill file là gì trong dự án này

Đây **không phải** một hệ thống RAG (không có vector DB, không có
embedding, không có runtime file lookup). Mỗi "skill" là một file Markdown
đặt ở **thư mục gốc dự án**, viết bằng tiếng Anh, mô tả chi tiết tiêu chuẩn
nhiếp ảnh/thiết kế cho một nhóm workflow cụ thể (ánh sáng, camera, chất
liệu, bố cục, checklist lỗi cần tránh...).

File này được **import thẳng vào mã nguồn** bằng cú pháp `?raw` của Vite
(khai báo type ở `global.d.ts`):

```ts
import designLifestyleConcept from '../Design_Lifestyle_Concept.md?raw';
```

Nghĩa là:
- Nội dung skill file được **đóng gói cứng vào bundle JS ở thời điểm
  `npm run build`**, không đọc từ đĩa lúc chạy.
- Sửa 1 skill file → phải build/deploy lại app thì thay đổi mới có hiệu
  lực, không tự cập nhật "nóng".
- Toàn bộ nội dung skill file (nguyên văn) được nhét vào phần đầu của prompt
  gửi cho Gemini mỗi khi gọi các hàm liên quan trong `geminiService.ts` —
  tức là **mỗi lần gọi AI cho các workflow có skill file đều tốn thêm token
  đầu vào bằng đúng độ dài file đó**. Đây là lý do các skill file được viết
  cô đọng nhưng vẫn đầy đủ chi tiết kỹ thuật.

## 2. Danh sách skill file hiện có

| File (đặt ở gốc repo) | Workflow áp dụng | Nạp trong hàm |
|---|---|---|
| [Design_Lifestyle_Concept.md](Design_Lifestyle_Concept.md) | `CONCEPT`, `SCENE_STAGING` | `analyzeConceptAndCamera`, `generateProductImage` (nhánh CONCEPT/STUDIO/TECH_PS "thinking prompt", nhánh SCENE_STAGING) |
| [Design_Studio_Creative.md](Design_Studio_Creative.md) | `STUDIO` | `analyzeStudioConcept`, `generateProductImage` (thinking prompt) |
| [Design_Studio_Props_Guide.md](Design_Studio_Props_Guide.md) | `STUDIO` (Đạo cụ & Tiêu chuẩn 10 ngành hàng) | `suggestPropsForConcept`, `StudioWorkflow.tsx`, `propMatrix.ts` |
| [Design_Tech_Effects.md](Design_Tech_Effects.md) | `TECH_PS`, `TECH_EFFECTS` (loại `SEA_TECH_GENERATION`) | `analyzeTechConceptAndCamera`, `suggestTechConcepts`, `generateProductImage` (thinking prompt + nhánh TECH_EFFECTS) |
| [Design_Color_Editing.md](Design_Color_Editing.md) | `COLOR_CHANGE` | `generateProductImage` |
| [Design_Packaging_Mockup.md](Design_Packaging_Mockup.md) | `PACKAGING_MOCKUP` | `generateProductImage` |
| [Design_WhiteBG_Retouch.md](Design_WhiteBG_Retouch.md) | `WHITE_BG_RETOUCH` | `generateProductImage` |
| [Design_Line_Art.md](Design_Line_Art.md) | `LINE_ART` | `generateProductImage` |
| [3DRender_To_Photo.md](3DRender_To_Photo.md) | `3D_TO_REAL_WHITE_BG` | `generateProductImage` |
| [ChatAssistant_Handbook.md](ChatAssistant_Handbook.md) | Trợ lý **Chat AI** (`ChatView.tsx`), cả 2 chế độ | `chatWithAI` (làm `systemInstruction`), `generateImageForChat` (nhúng đầu prompt) |

`ChatAssistant_Handbook.md` khác 7 file trên ở chỗ nó không gắn với 1
`VisualStyle`/workflow cụ thể — đây là cẩm nang **dùng chung cho toàn bộ
trải nghiệm Chat**, vì Chat là kênh tự do không đi qua wizard nào của Studio
nên cần 1 lớp chuẩn hóa riêng để không lệch chất lượng thương hiệu so với 15
workflow chính. File này viết cô đọng hơn hẳn (không nhúng cả 8 file
`Design_*.md` vào Chat) để tránh đội chi phí token trên **mọi** tin nhắn
chat — xem mục 5.

**5 workflow không có skill file riêng** — prompt được viết inline ngắn gọn
ngay trong `geminiService.ts`, không có tài liệu chuẩn hóa dạng "manual":

| Workflow | Vì sao không có skill file |
|---|---|
| `TRACING_ASSISTANT` | Tác vụ đơn giản (làm sắc nét ảnh để vector hóa), prompt 1 đoạn là đủ |
| `TRACK_SOCKET_STAGING` | Prompt tiếng Việt, logic chủ yếu là ghép ảnh + đếm số lượng ổ cắm, không cần "triết lý nhiếp ảnh" |
| `BARCODE_QR_GENERATOR` | Không gọi AI — thuần thư viện `jsbarcode`/`qrcode-svg` phía client |
| `TRANSLATE_PACKAGING` | Một prompt cố định 1 câu (xem `TranslatePackagingWorkflow.tsx`), không đọc skill file nào |
| `PACKAGING_CHECK` | Prompt là quy trình đối chiếu dữ liệu (OCR + so khớp), không phải "phong cách hình ảnh" nên không cần skill file |

## 3. Cấu trúc chung của một skill file

Nhìn vào 7 file `Design_*.md` (trừ `3DRender_To_Photo.md` viết bằng tiếng
Việt và có văn phong hơi khác — có vẻ được viết ở một thời điểm khác), tất
cả theo cùng 1 khuôn:

1. **Tiêu đề + 1 đoạn mô tả** phạm vi áp dụng.
2. **"Prerequisite Agent Verification Instruction"** — một đoạn chỉ thị trực
   tiếp cho mô hình AI: *"phải đọc toàn bộ tài liệu này trước khi..."*. Đây
   là kỹ thuật prompt engineering nhúng chỉ dẫn ngay trong tài liệu tham
   chiếu, không phải chỉ dẫn cho người phát triển.
3. **Triết lý/nguyên tắc cốt lõi** của phong cách (mood, đối tượng phục vụ).
4. **Thông số kỹ thuật cụ thể**: tiêu cự ống kính, khẩu độ, ánh sáng, chất
   liệu, bố cục.
5. **"Standard Prompt Blueprint"** — công thức ghép các phần thành 1 prompt
   hoàn chỉnh, kèm 1 ví dụ mẫu.
6. **"Defect Prevention Checklist"** — danh sách lỗi thường gặp cần tránh
   (méo phối cảnh, sai tỷ lệ, nền lem...).

## 4. Cách thêm một skill file mới (khi tạo workflow mới)

Nếu sau này bổ sung 1 `VisualStyle` mới cần chuẩn hóa phong cách riêng:

1. Tạo file `Design_<TenPhongCach>.md` ở gốc repo, theo khuôn ở mục 3 (không
   bắt buộc theo đúng 6 phần, nhưng nên có phần "Blueprint" + "Checklist lỗi"
   vì đó là phần thực sự giúp Gemini bám chuẩn).
2. Import bằng `?raw` trong `services/geminiService.ts`, đặt tên biến theo
   quy ước `designXxx`/`renderXxx` đã có.
3. Nhúng biến đó vào prompt ở (các) hàm phân tích concept và ở nhánh tương
   ứng trong `generateProductImage`.
4. Cập nhật bảng ở mục 2 của tài liệu này, và bảng 15-workflow trong
   [HANDBOOK.md](HANDBOOK.md).
5. Build lại (`npm run build`) — nhớ rằng nội dung file chỉ có hiệu lực sau
   khi build, không phải theo thời gian thực.

## 5. Giới hạn cần biết

- Vì nội dung skill file luôn được nhúng **nguyên văn** vào mọi prompt liên
  quan, file càng dài thì mỗi lần gọi AI càng tốn token đầu vào — nên cân
  nhắc độ dài khi chỉnh sửa, tránh lặp lại nội dung đã có ở file khác.
- 3 skill file (`Design_Lifestyle_Concept.md`, `Design_Studio_Creative.md`,
  `Design_Tech_Effects.md`) được nhúng **cùng lúc cả 3** vào 1 prompt duy
  nhất trong nhánh "thinking prompt" của `generateProductImage` (xem
  ARCHITECTURE.md mục 3.2) — đây là lời gọi tốn token nhiều nhất trong toàn
  hệ thống.
- Không có cơ chế kiểm tra tự động rằng nội dung skill file và prompt code
  không mâu thuẫn nhau — việc đối chiếu hiện tại là thủ công.
