# AI SPEC — Tutor có căn cứ cho VLearn · Nhóm E403 · Zone A
Hướng: [x] A — VLearn  [ ] B — Trợ lý Học viên  [ ] C — Làn mở
Loại: [x] Tối ưu tính năng có sẵn  [ ] Tính năng mới

---

## §1. User & Job

- **Job executor + workflow:** Học viên đang trong buổi học trực tuyến trên VLearn, đọc tài liệu slide/PDF, gặp biểu đồ hoặc hình ảnh phức tạp cần hiểu sâu hơn, dùng chức năng khoanh vùng (freehand selection) để đặt câu hỏi cho AI Tutor.

- **Core JTBD (không tên sản phẩm/AI):** Khi đang đọc tài liệu và thấy một đoạn hoặc hình ảnh cần làm rõ, học viên muốn đặt câu hỏi chính xác về đúng vùng nội dung đó và nhận được câu trả lời căn cứ vào nội dung trong vùng đã chọn.

- **Problem statement (KHÔNG chữ AI):** Học viên đang đọc tài liệu thấy biểu đồ hoặc hình ảnh cần làm rõ, chọn chức năng khoanh vùng, nhưng hệ thống không xác định được đúng nội dung trong vùng được chọn nên trả về câu trả lời không liên quan — khiến học viên phải hỏi lại hoặc tìm nguồn khác, mất thêm thời gian và có thể học sai kiến thức.

- **Evidence (chuẩn A — khảo sát 25 người):**
  - **Số liệu khảo sát (n = 25):**
    - 21/25 (84%) người dùng đánh giá OCR xử lý ảnh chất lượng thấp ở mức không tốt (mức 1–2 trên thang 5).
    - 15/25 (60%) người dùng đồng ý hoặc hoàn toàn đồng ý rằng OCR thường nhận sai ký tự hoặc thiếu chữ (mức 4–5).
    - 18/25 (72%) người dùng đồng ý hoặc hoàn toàn đồng ý rằng AI thường bỏ sót ý quan trọng hoặc trả lời không liên quan đến nội dung trong ảnh (AI3 và AI4, mức 4–5).
  - **≥5 quote/ví dụ nguyên văn + nguồn:** *(bổ sung từ log khảo sát trong validation/)*
    - "OCR đọc sai hầu hết ký tự toán trong biểu đồ." — U01
    - "Tôi chọn vùng hình nhưng tutor trả lời về chủ đề khác." — U07
    - "AI không nhận ra biểu đồ cột nên giải thích sai hẳn." — U12
    - "Khoanh vùng xong nhưng kết quả không liên quan gì đến vùng chọn." — U15
    - "OCR bị thiếu dấu nên câu hỏi gửi đi bị hiểu sai." — U20

---

## §2. Impact & quyết định chọn

- **Bảng impact ≥3 ứng viên:**

| Ứng viên (hướng) | Bao nhiêu người gặp | Tần suất | Tốn gì mỗi lần | Build nổi trong sự kiện | Chọn? |
|---|---|---|---|---|---|
| **Hướng A — VLearn:** Tối ưu AI tutor — học viên khoanh vùng ảnh/biểu đồ nhưng AI trả lời sai do OCR kém | 21/25 (84%) xác nhận qua khảo sát | Mỗi lần gặp nội dung trực quan trong slide | ~3-5 phút hỏi lại + niềm tin vào tutor giảm | ✅ Có (freehand crop + LightOn OCR + AI response) | ✅ **CHỌN** |
| **Hướng B — Trợ lý Discord:** Trợ lý không phân biệt được intent thật (hỏi bài vs logistics) → trả lời sai cỡ hoặc sai nội dung | Quan sát trực tiếp Discord (không có data pack riêng) | Liên tục, mỗi khi học viên nhắn tin | TA tốn thêm thời gian xử lý sau khi bot trả lời sai | 🔴 Không có data pack — phải tự quan sát Discord, khó thu bằng chứng đủ chuẩn trong thời gian sự kiện | ❌ Loại |
| **Hướng C — Làn mở:** Mining chatlog đề xuất tính năng AI hoàn toàn mới cho khoá | Chưa xác định — cần mining trước mới biết | Chưa xác định | Chưa xác định | 🔴 Rủi ro cao: không đảm bảo tìm ra pain đủ mạnh và build nổi trong 1,5 ngày | ❌ Loại |

- **Ứng viên ĐÃ LOẠI + vì sao:**
  - *Hướng B — Trợ lý Discord:* Pain có thật nhưng không có data pack — phải tự quan sát Discord trong thời gian sự kiện, rất khó thu bằng chứng đủ chuẩn (≥20 người, ≥50% xác nhận). Rủi ro không đủ evidence trước CP1.
  - *Hướng C — Làn mở:* Quá rủi ro — chưa biết pain gì, tần suất bao nhiêu, ai gặp. Nếu mining xong không tìm ra pain build được trong 1,5 ngày thì không còn thời gian xoay sang hướng khác.

- **Ứng viên CHỌN + vì sao (bằng số):** Hướng A — 21/25 (84%) người dùng xác nhận pain OCR xử lý ảnh kém qua khảo sát trực tiếp; 18/25 (72%) xác nhận AI bỏ sót ý quan trọng. Tần suất cao (mỗi buổi học có biểu đồ), cost-of-error cao (học sai kiến thức), và nhóm có thể build Working prototype với LightOn API trong sự kiện.



---

## §3. Giải pháp tương tự đã nghiên cứu

- **NotebookLM (Google):** Upload PDF → hỏi bất kỳ → trả lời kèm cite nguồn cụ thể (trang, đoạn). Đáng học: luôn cite nguồn cạnh câu trả lời. Đáng né: không hỗ trợ khoanh vùng tự do trên ảnh/biểu đồ. Mình khác: freehand selection → crop đúng vùng → OCR → AI trả lời theo đúng vùng.

- **ChatGPT với ảnh (GPT-4o Vision):** Upload ảnh → hỏi về hình. Đáng học: nhận ảnh trực tiếp, không cần OCR trung gian. Đáng né: không tích hợp trong luồng học, học viên phải tự chụp và upload. Mình khác: khoanh vùng ngay trong trang học, không cần thoát ra ngoài.

- **Khanmigo (Khan Academy):** AI tutor trong trang học, trả lời câu hỏi về bài học. Đáng học: AI biết ngữ cảnh trang học, từ chối trả lời thay vì đoán bừa. Đáng né: không có freehand selection. Mình khác: freehand selection cho phép hỏi về biểu đồ cụ thể mà không cần mô tả bằng lời.

---

## §4. Thiết kế

- **Lát cắt MỘT CÂU:** Học viên đang đọc tài liệu trong buổi học · muốn khoanh vùng để hỏi sâu về biểu đồ hoặc hình ảnh · hệ thống cắt đúng vùng được chọn, OCR nội dung trong vùng và gửi cho AI · AI dựa vào nội dung khoanh vùng để trả lời chính xác.

- **Non-goals (≥3 thứ KHÔNG build):**
  1. Không build OCR tự phát triển — dùng LightOn API.
  2. Không build chatbot đa lượt — chỉ một lượt hỏi-đáp theo vùng khoanh.
  3. Không lưu lịch sử hội thoại hay tài khoản người dùng.
  4. Không cần deploy lên server thật hay tích hợp vào VLearn production.

- **Mức prototype nhắm tới:** [x] Working — PDF render thật + freehand crop thật + OCR thật (LightOn API) + AI trả lời thật (prompt từ text OCR). Phần mock: giao diện chat đơn giản, không có context đa lượt.

- **Automation:** [ ] augment [ ] **[x] conditional** [ ] automate — Lý do: AI tự trả lời khi tìm được căn cứ trong vùng khoanh (có nội dung OCR hợp lệ); khi không đủ căn cứ (OCR trống, ảnh mờ), AI nói rõ giới hạn và hỏi lại. Lý do theo cost-of-error: trả lời sai kiến thức kỹ thuật hoặc bịa nội dung có thể làm học viên học sai — chi phí sửa cao (phải học lại, mất niềm tin vào hệ thống).

### §4b. Nguyên tắc đã áp dụng (≥4 — HAX/PAIR)

| Nguyên tắc | Áp cụ thể vào đâu trong prototype |
|---|---|
| **Uncertainty of AI outputs** (PAIR) — luôn thể hiện mức độ chắc chắn | Khi OCR trả về ít/không có text, hệ thống hiện thông báo rõ: "Không đủ nội dung để trả lời — hãy thử chọn lại vùng rõ hơn" thay vì đoán bừa |
| **Make clear what the system can do** (HAX P4) | Màn hình upload hướng dẫn rõ: chỉ nhận PDF, chỉ hỗ trợ khoanh vùng freehand trên trang hiển thị |
| **Support efficient invocation** (PAIR) — giúp user thực hiện ý định dễ nhất | Freehand selection tự đóng vùng và preview ngay; nút Process rõ ràng, không cần thao tác thừa |
| **Make clear why the system did what it did** (HAX P11) | AI trả lời kèm trích dẫn nội dung trong vùng đã khoanh để user thấy AI dựa vào đâu |
| **Notify users about changes** (PAIR) — thông báo khi AI không chắc | Khi confidence OCR thấp, hiển thị cảnh báo và cho phép user xem lại text OCR trước khi gửi AI |

---

## §5. Kiểu lỗi — 4 lớp chỗ khó + kịch bản (≥8)

| # | Lớp | Kịch bản | Hành xử hiện tại | Hành xử mục tiêu |
|---|---|---|---|---|
| 1 | ① Nguồn sự thật | Biểu đồ chứa số liệu nhưng OCR đọc sai số → AI giải thích sai số | Trả lời sai, không cảnh báo | Hiển thị text OCR để user xác nhận trước khi AI trả lời |
| 2 | ① Nguồn sự thật | Vùng khoanh chứa hình vẽ tay, không có text → OCR trả về rỗng | AI bịa hoặc trả về lỗi khó hiểu | AI nói rõ "không tìm thấy text trong vùng", gợi ý khoanh lại |
| 3 | ② Mơ hồ / thiếu thông tin | Vùng khoanh quá nhỏ, chỉ chứa một từ → không đủ ngữ cảnh | AI đoán và trả lời sai hướng | AI hỏi lại: "Bạn muốn hỏi gì về '[từ OCR]'?" |
| 4 | ② Mơ hồ / thiếu thông tin | Ảnh slide bị mờ/chất lượng thấp → OCR nhiều lỗi | Trả về văn bản vô nghĩa, AI bị confuse | Hiển thị cảnh báo chất lượng ảnh thấp, đề nghị upload PDF chất lượng cao hơn |
| 5 | ③ Ngoài phạm vi | User khoanh vùng và hỏi về chủ đề không liên quan đến khoá học | AI trả lời bất kỳ chủ đề gì | AI trả lời chỉ trong phạm vi nội dung khoanh vùng; nếu câu hỏi lệch, nói rõ giới hạn |
| 6 | ③ Ngoài phạm vi | User yêu cầu AI làm bài tập hộ (cho đáp án thẳng) | AI đưa đáp án thẳng | AI gợi ý cách suy luận thay vì đáp án trực tiếp (Socratic guiding) |
| 7 | ④ Đặc thù domain | Biểu đồ chứa ký hiệu toán học (∑, ∫, ≈) → OCR đọc sai ký hiệu | AI giải thích sai công thức | Hiện text OCR để user sửa trước khi gửi; cảnh báo ký hiệu có thể sai |
| 8 | ④ Đặc thù domain | Slide code Python/SQL → OCR nhầm ký tự đặc biệt (`:`, `_`, `=`) | Code được giải thích sai logic | Nhận dạng block code và xử lý ưu tiên bảo toàn ký tự đặc biệt |

---

## §6. Bốn đường đi của trải nghiệm

- **Happy path:** User upload PDF → render trang → vẽ freehand chọn vùng biểu đồ rõ nét → nhấn Process → OCR thành công → AI nhận text → AI trả lời đúng nội dung vùng kèm giải thích → user hiểu và tiếp tục học.

- **Low-confidence (②):** OCR nhận được text nhưng có nhiều từ sai/thiếu → hệ thống hiển thị text OCR kèm cảnh báo "Chất lượng nhận dạng thấp — hãy xem lại nội dung trước khi AI phân tích" → user có thể sửa text trước khi gửi AI.

- **Failure/không căn cứ (①):** OCR trả về rỗng hoặc ảnh mờ hoàn toàn → AI KHÔNG đoán bừa → hiển thị thông báo: "Không tìm thấy nội dung đọc được trong vùng. Thử chọn vùng khác hoặc upload PDF chất lượng tốt hơn."

- **Correction (user sửa):** User xem text OCR và thấy sai → user có thể chỉnh text trực tiếp → nhấn "Gửi AI" với text đã sửa → AI trả lời theo text đã được chỉnh sửa.

- **Khi bị đòi ngoài phạm vi (③):** User hỏi về chủ đề không có trong vùng khoanh → AI trả lời: "Tôi chỉ phân tích nội dung trong vùng bạn đã chọn. Câu hỏi của bạn có vẻ ngoài phạm vi đó — bạn có muốn chọn lại vùng không?"

- **Case đặc thù domain (④):** Vùng khoanh chứa code hoặc công thức toán → AI nhận dạng loại nội dung → ưu tiên giải thích logic/ý nghĩa thay vì paraphrase → nếu nghi sai ký tự OCR, nói rõ "ký hiệu này có thể bị OCR nhầm".

---

## §7. Kiểm thử

- **Chiều chất lượng + định nghĩa kiểm chứng được:**
  - **OCR accuracy:** % text nhận dạng đúng trên golden set ảnh slide chuẩn.
  - **Answer relevance:** % câu trả lời AI đúng chủ đề với nội dung vùng khoanh (đánh giá thủ công theo golden set).
  - **Failure detection:** % trường hợp ảnh mờ/rỗng mà hệ thống báo đúng thay vì trả lời sai.

- **Golden set (≥20 case, file trong eval/):**
  - 5 case: slide text rõ, vùng khoanh đoạn văn → kỳ vọng OCR đúng ≥90%, AI trả lời đúng.
  - 5 case: slide chứa biểu đồ có số liệu → kỳ vọng OCR đúng số, AI giải thích đúng xu hướng.
  - 5 case: slide code Python/SQL → kỳ vọng AI giải thích logic đúng.
  - 3 case: ảnh mờ/chất lượng thấp → kỳ vọng hệ thống cảnh báo thay vì trả lời.
  - 2 case: vùng khoanh không có text (hình vẽ tay) → kỳ vọng hệ thống báo không tìm được nội dung.

- **Quality bar (chốt từ 23:59, giữ nguyên sau đó):** "Đạt khi ≥70% case golden set được AI trả lời đúng chủ đề với vùng khoanh, và 100% case ảnh mờ/rỗng được hệ thống phát hiện thay vì trả lời sai."

- **Kết quả các lượt chạy (bảng % — cập nhật đến trước CP6):**

| Lượt | Thời điểm | % Answer relevance | % Failure detection | Ghi chú |
|---|---|---|---|---|
| 1 | CP1 | — | — | Khám phá bài toán & chốt Canvas CP1 (khảo sát 25 người dùng) |
| 2 | CP2 | 50.0% (10/20) | 80.0% | Khởi tạo Prototype (Freehand crop PDF + OCR baseline) |
| 3 | CP3 | 70.0% (14/20) | 100.0% | Lượt đo 1: Cải thiện prompt & trích xuất OCR (14/20 case pass) |
| 4 | CP4 | 85.0% (17/20) | 100.0% | Tối ưu System Prompt, bổ sung 4 lớp guardrails rủi ro & vision routing |
| 5 | CP5 | 95.0% (19/20) | 100.0% (8/8 API unit tests) | Lượt đo 2: Chạy full live eval suite (19/20 case pass & 8/8 unit tests) |

---

## §8. Phân công & kế hoạch

- **Phân công có tên:**
  - **Quang Huy:** evidence mining + spec (§1, §2, §7 golden set)
  - **Hồ Văn Thi:** prompt engineering + golden set + đánh giá kết quả
  - **Duy Trường:** build prototype (freehand crop + LightOn OCR + AI response) + validation
  - **Khánh Toàn:** user test, thu thập feedback validation
  - **Phi Trường:** user test, demo slides

- **Willing users (≥3 tên) + kế hoạch validation CP5:**
  - Khánh Toàn, Duy Trường, Phi Trường (3 người đã xác nhận sẵn sàng thử — ghi trong canvas CP1).
  - **3 câu hỏi validation:** ① "Sau khi khoanh vùng và nhận câu trả lời, bạn có hiểu nội dung vùng bạn chọn hơn không? (thang 1-5)" ② "Câu trả lời AI có bám đúng vào vùng bạn khoanh không?" ③ "Bạn có tự tin dùng tính năng này trong buổi học tiếp theo không?"
  - **Ai log:** Khánh Toàn và Phi Trường log feedback theo form, Duy Trường ghi observation hành vi.

- **Multi-prototype:** Chỉ một phương án — Working prototype với freehand crop + LightOn OCR + AI response.

---

## §9. Changelog

| Thời điểm | Đổi gì | Vì sao (trỏ về feedback/case nào) |
|---|---|---|
| CP1 | Khởi tạo canvas, chốt lát cắt | Canvas CP1 — canvas-cp1.md |
| CP4 | Cập nhật evidence từ khảo sát 25 người (84%, 60%, 72%) | Survey results — Hồ Văn Thi cập nhật §1 và §4 bằng chứng |
