# Báo Cáo Thống Kê & Đánh Giá Tối Ưu Hóa Token Usage (Token Analytics Report)

## 1. Tổng Quan Kịch Bản Phân Tích (Executive Summary)

Báo cáo này đánh giá hiệu quả tiêu tốn token giữa **Lịch sử hội thoại VLearn cũ** và **Hệ thống Backend AI Tutor mới (với tính năng Region Cropping & Dynamic Vision Routing)**.

### Nguồn dữ liệu thống kê:
1. **Lịch sử VLearn Baseline**: [`data/vlearn-pack/chatlog/chat_history_anonymized_for_hackathon.csv`](file:///d:/AI-THUCCHIEN/Batch03-K3-AI-Product-Hackathon/data/vlearn-pack/chatlog/chat_history_anonymized_for_hackathon.csv) (2,522 lượt hội thoại thực tế).
2. **Backend Log Thực tế**: [`codebase/backend/logs/analytics.jsonl`](file:///d:/AI-THUCCHIEN/Batch03-K3-AI-Product-Hackathon/codebase/backend/logs/analytics.jsonl) (12 requests gần nhất từ ứng dụng).

---

## 2. Bảng So Sánh Chỉ Số Token (Key Metrics Comparison)

| Chỉ số / Tiêu chí | Chat History CSV (Baseline VLearn) | Backend Log (`analytics.jsonl`) | Mức độ Tối ưu / Thay đổi |
| :--- | :--- | :--- | :--- |
| **Tổng số lượt ghi nhận** | 2,522 turns | 12 requests | — |
| **Prompt (Input) Tokens Trung bình** | **11,203.7 tokens / turn** | **2,282.2 tokens / req** | 📉 **Tiết kiệm 79.6%** |
| **Prompt Tokens Trung vị (Median)** | **8,900.0 tokens** | **1,971.0 tokens** | 📉 **Tiết kiệm 77.8%** |
| **Mức Prompt Tokens Thấp nhất (Min)** | 4,958 tokens | 1,124 tokens | 📉 Giảm đáng kể |
| **Mức Prompt Tokens Cao nhất (Max)** | 32,091 tokens | 4,912 tokens | 📉 Tránh quá tải context |
| **Completion (Output) Tokens TB** | 188.4 tokens | 227.1 tokens | ⚖️ Duy trì ổn định (~200 tokens) |

![Biểu đồ so sánh Prompt Tokens giữa Baseline và Backend Mới](file:///d:/AI-THUCCHIEN/Batch03-K3-AI-Product-Hackathon/docs/images/chart1_baseline_vs_backend.png)

---

## 3. Phân Tích Chi Tiết Theo Loại Request Trong Backend (`analytics.jsonl`)

Nhờ cơ chế **Cắt khoanh vùng (Region Cropping)** kết hợp **Định tuyến thị giác tự động (`should_use_vision`)**, lượng token được kiểm soát tối ưu theo từng trường hợp cụ thể:

![Biểu đồ thống kê token theo chế độ phản hồi backend](file:///d:/AI-THUCCHIEN/Batch03-K3-AI-Product-Hackathon/docs/images/chart2_request_type_tokens.png)

### 3.1. Phân loại theo Request Type & Vision Flag

1. **Yêu cầu chỉ có Văn bản (`text_only`)**:
   - **Trung bình**: **1,163.0 Prompt Tokens**
   - **Nội dung**: Chỉ bao gồm System Prompt sư phạm + câu hỏi trực tiếp của học viên.

2. **Yêu cầu có Vùng chọn nhưng dùng Text/JSON (`text_with_images`, `should_use_vision = False`)**:
   - **Trung bình**: **1,723.7 Prompt Tokens** (Dao động: 1,124 – 2,076 tokens).
   - **Nội dung**: Khi vùng chọn chỉ cần trích xuất văn bản/JSON mà không cần tải ảnh multimodal lên Gemini Vision API.
   - **Hiệu quả**: Tiết kiệm thêm **~35% tokens** so với khi bật Vision API.

3. **Yêu cầu dùng Visual Multimodal (`text_with_images`, `should_use_vision = True`)**:
   - **Trung bình**: **2,645.0 Prompt Tokens** (Dao động: 1,630 – 4,912 tokens).
   - **Chi tiết theo số lượng Vùng Khoanh (Region Images)**:
     - **1 Region Image**: **2,143.4 Prompt Tokens** (Min: 1,630, Max: 3,115).
     - **2 Region Images**: **2,765.5 Prompt Tokens** (Min: 1,815, Max: 3,716).
     - **3 Region Images**: **4,912.0 Prompt Tokens** (Max: 4,912).

![Biểu đồ tác động của số lượng vùng khoanh đến Prompt Tokens](file:///d:/AI-THUCCHIEN/Batch03-K3-AI-Product-Hackathon/docs/images/chart3_region_count_tokens.png)

---

## 4. Phân Tích Lịch Sử Baseline CSV (`chat_history_anonymized_for_hackathon.csv`)

### 4.1. Phân theo Model AI Đã Sử Dụng

| Model | Số lượng Turn | Input Tokens TB | Input Tokens Median |
| :--- | :--- | :--- | :--- |
| **`gemini-3.1-flash-lite`** | 2,202 turns (87.3%) | 9,758.0 tokens | 8,473.0 tokens |
| **`gemini-3-flash`** | 320 turns (12.7%) | 21,152.0 tokens | 21,527.5 tokens |

![Biểu đồ phân phối input tokens theo model trong CSV Baseline](file:///d:/AI-THUCCHIEN/Batch03-K3-AI-Product-Hackathon/docs/images/chart4_model_breakdown_csv.png)

### 4.2. Nguyên nhân tiêu tốn Token ở hệ thống cũ:
- Trong hệ thống VLearn cũ, đối với mỗi câu hỏi của học sinh, toàn bộ tài liệu bài giảng/slide (thường kéo dài từ vài chục đến hàng trăm trang) đều phải nạp trực tiếp vào Prompt Context.
- Điều này dẫn đến lượng Input Tokens trung bình lên đến **9,758 - 21,152 tokens/turn**, gây tăng chi phí API và độ trễ phản hồi (Avg Latency ~1.4s - 5.0s).

---

## 5. Kết Luận & Đánh Giá Tối Ưu (Conclusion & Insights)

1. **Hiệu quả tiết kiệm tài nguyên vượt trội**:
   - Kiến trúc mới áp dụng Region Cropping giúp giảm trung bình từ **11,203 input tokens** xuống **2,282 prompt tokens** per request (**tiết kiệm ~79.6% chi phí token**).
2. **Kiểm soát Visual Embedding thông minh**:
   - Mỗi vùng ảnh crop chỉ tiêu tốn trung bình khoảng **500 - 800 tokens** visual tiles.
   - Việc tách biệt `should_use_vision = False` khi chỉ xử lý dữ liệu dạng text/OCR giúp hệ thống tránh lãng phí token cho mô hình thị giác multimodal.
3. **Giá trị với Sản phẩm VLearn AI Tutor**:
   - Giúp giảm độ trễ phản hồi, giảm thiểu chi phí API lên đến 4/5 lần, đồng thời nâng cao độ chính xác khi AI chỉ tập trung giải đáp vào đúng phạm vi vùng khoanh học sinh yêu cầu.
