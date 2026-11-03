# GEMINI.MD — HƯỚNG DẪN MÔ HÌNH GEMINI & KỸ THUẬT PROMPT ELMICH

Tài liệu này cung cấp các tiêu chuẩn mô hình và kỹ thuật prompt dành riêng cho hệ thống Elmich AI Studio.

> Danh sách đầy đủ các hàm gọi Gemini (model chính xác đang dùng, ai gọi
> hàm nào) nằm ở [ARCHITECTURE.md](ARCHITECTURE.md) mục 3.1 — bảng dưới đây
> chỉ là khuyến nghị chọn model theo loại nhiệm vụ. Skill file (tiêu chuẩn
> phong cách được nhúng vào prompt) xem [SKILLS.md](SKILLS.md).

---

## 1. LỰA CHỌN MÔ HÌNH GEMINI (MODEL SELECTION MATRIX)

> **Lưu ý:** Code hiện tại (`services/geminiService.ts`) chỉ hard-code
> `gemini-3.1-flash-image` cho mọi tác vụ sinh/sửa ảnh. Kiểu `AIModel`
> trong `types.ts` có khai báo thêm `imagen-3.0-fast-generate-001` và
> `imagen-3.0-generate-002`, nhưng **không có lời gọi API nào thực sự dùng
> dòng model Imagen** — đây là lựa chọn dự phòng cho tương lai, không phải
> mô tả hành vi hiện tại.

| Nhiệm vụ | Model đang dùng thực tế | Lý do kỹ thuật |
|---|---|---|
| **Tạo ảnh sản phẩm chất lượng cao** | `gemini-3.1-flash-image` | Tái hiện vật liệu kim loại Inox 304, thủy tinh, bóng phản chiếu studio sắc nét |
| **Dịch bao bì tự động (Translate)** | `gemini-3.1-flash-image` (Image-to-Image recreation qua `editProductImage`) | Giữ nguyên 100% kết cấu bế dieline, thay chữ tiếng Anh thành tiếng Việt chuẩn |
| **Phân tích OCR & Kiểm tra bao bì** | `gemini-2.5-flash` | Nhận diện chữ tiếng Việt có dấu, đọc được cả font chữ nhỏ trên tem phụ |
| **Gợi ý Concept & Đạo cụ Lifestyle** | `gemini-2.5-flash` (phân tích ban đầu), `gemini-2.5-pro` (gợi ý đạo cụ chi tiết, "thinking prompt" cuối trước khi sinh ảnh) | Cân bằng tốc độ (flash) và chất lượng suy luận sâu (pro) tùy bước |
| **Trợ lý Chat tư vấn thiết kế** | `gemini-2.5-pro` (mặc định trong `ChatView.tsx`) | Đối thoại tự nhiên, hiểu sâu về đồ gia dụng và thuật ngữ thiết kế đồ họa. `systemInstruction` lấy từ [ChatAssistant_Handbook.md](ChatAssistant_Handbook.md) (persona Giám đốc Sáng tạo), không còn là 1 câu ngắn như trước. |
| **Tạo ảnh tự do qua Chat** | `gemini-3.1-flash-image` (`generateImageForChat`) | Cùng chuẩn vật liệu/ánh sáng Elmich như Studio, nhưng nhúng bản cô đọng từ `ChatAssistant_Handbook.md` thay vì 8 skill file đầy đủ, để tránh tốn token trên mỗi tin nhắn — xem [SKILLS.md](SKILLS.md). |

---

## 2. KỸ THUẬT PROMPT CHO TỪNG LOẠI VẬT LIỆU GIA DỤNG

### 2.1. Kim loại Inox (Nồi, Chảo, Ấm đun, Dao thớt)
```text
Professional commercial studio photograph of Elmich stainless steel product.
Material: Food-grade 304 stainless steel with ultra-fine brushed satin texture, crisp longitudinal specular highlights along curved surfaces, subtle metallic sheen, authentic subtle reflection. No distorted reflections.
Lighting: High-end catalog 3-point softbox studio lighting, rim lighting defining product edges sharply against pristine clean backdrop.
Camera: 50mm or 85mm prime lens, f/8 aperture, razor-sharp focus throughout, ISO 100.
```

### 2.2. Lớp Chống Dính (Chảo, Lòng nồi cơm, Khay nướng)
```text
Inner surface features premium non-stick ceramic / granite coating with subtle matte micro-texture, deep charcoal black or speckled dark granite finish. Seamless transition between metallic rim and non-stick coating.
```

### 2.3. Thủy Tinh Cao Cấp (Bình giữ nhiệt, Nắp nồi, Cối xay sinh tố)
```text
Ultra-clear high-borosilicate heat-resistant glass, pristine transparent surface showing gentle light refraction, realistic caustics, and subtle soft rim reflections around the edges.
```

---

## 3. TỐI ƯU GỢI Ý CONCEPT & ĐẠO CỤ THEO DÒNG SẢN PHẨM

Các hàm gợi ý concept/camera (`analyzeConceptAndCamera`, `analyzeTechConceptAndCamera`,
`analyzeStudioConcept`) và gợi ý đạo cụ/hiệu ứng (`suggestPropsForConcept`,
`suggestTechVisuals`, `suggestTechConcepts`, `analyzeStagingScene`) trong
`geminiService.ts` đều áp dụng chung 1 khuôn tối ưu:

1. **Bước phân tích bắt buộc trước khi đề xuất:** yêu cầu Gemini tự xác định
   DANH MỤC sản phẩm cụ thể (ấm siêu tốc, nồi chiên không dầu, máy xay, bàn
   ủi, máy hút bụi...) và thuộc tính liên quan (chất liệu, cơ chế vật lý,
   màu chủ đạo...) trước khi sinh gợi ý — tránh gợi ý chung chung không
   khớp sản phẩm thật.
2. **Ràng buộc đa dạng rõ ràng:** mỗi hàm đều có 1 câu "BẮT BUỘC ĐA DẠNG"
   chỉ rõ trục biến thiên cụ thể cho từng loại gợi ý (phong cách nội thất +
   khung giờ ánh sáng cho Lifestyle; góc độ hiệu ứng cho Tech; loại bục +
   sắc thái ánh sáng cho Studio...) để 5 concept/10 đạo cụ không na ná nhau.
3. **Mô tả có chi tiết hình ảnh cụ thể** thay vì chỉ liệt kê tên đạo cụ
   (ví dụ "vài lát cam khô xếp cạnh ấm, tỏa hơi ấm nhẹ" thay vì "lát cam
   khô") — cho model sinh ảnh đủ dữ liệu để dựng cảnh phong phú hơn.
4. `suggestTechVisuals` và `analyzeStagingScene` trước đây **không hề nhúng
   skill file liên quan** (`Design_Tech_Effects.md`, `Design_Lifestyle_Concept.md`)
   — đã bổ sung để đồng bộ chất lượng với các hàm khác cùng nhóm.

## 4. PROMPT CHUYỂN NGỮ BAO BÌ TIẾNG ANH ➔ TIẾNG VIỆT
```text
Recreate this exact packaging design perfectly.
Strict constraints:
1. Keep the exact same dieline (cut lines, fold creases, flap positions), dimensions, aspect ratio, and structural blueprint.
2. Keep the identical graphic layout, background colors, brand palettes, product illustration style, and logo placement.
3. Translate all English text, headings, feature badges, specifications, and descriptions into professional, natural Vietnamese terminology.
4. Render high-resolution typography with crisp fonts and zero visual blur. Output in clean 1K resolution.
```
