# Canvas CP1 — Cải tiến Tính năng Khoanh vùng Thông minh cho VLearn

## 📊 Bảng Tổng Quan Canvas CP1

| STT | Hạng mục | Nội dung chi tiết |
| :---: | :--- | :--- |
| **1** | **Chiến tuyến** | VLearn AI Khoanh Vùng Thông Minh |
| **2** | **Ai đang làm việc này** | Học viên đang học bài, ôn thi hoặc tra cứu kiến thức trực tiếp trên các tài liệu PDF/Slide. |
| **3** | **Họ vướng gì** | Học viên muốn hỏi AI về một khu vực cụ thể trên tài liệu, nhưng thao tác khoanh vùng thủ công dễ bị lệch và tính năng nhận diện (OCR) thường xuyên nhận sai ký tự, thiếu chữ, hoặc cắt cụt văn bản.<br><br>*Hậu quả:* AI nhận được thông tin đầu vào bị nhiễu, dẫn đến việc trả lời sai ngữ cảnh, thiếu ý quan trọng hoặc báo lỗi không tìm thấy tài liệu, khiến học viên phải khoanh đi khoanh lại nhiều lần gây ức chế. |
| **4** | **Bằng chứng đầu tiên** | **Theo phân tích dữ liệu:**<br>• **100% (37/37)** số lượt bị đánh giá tiêu cực (*downvote*) trong lịch sử chat bắt nguồn từ tính năng khoanh vùng.<br>• Trong khảo sát, lỗi giao diện có **22 lượt** phản ánh *"AI bỏ sót một phần nội dung khi khoanh vùng"*.<br>• Lỗi trích xuất có **15 lượt** báo cáo *"OCR nhận sai ký tự hoặc thiếu chữ"*. |
| **5** | **Lát cắt MỘT CÂU** | Học viên đang tra cứu tài liệu · muốn đặt câu hỏi về một khu vực hình ảnh/văn bản cụ thể · AI (hoặc hệ thống) tự động nhận diện và bám dính (auto-snapping) vào vùng nội dung hoặc sử dụng Vision AI để phân tích trực tiếp ảnh thay vì OCR tĩnh · giúp hệ thống lấy đúng ngữ cảnh trọn vẹn để trả lời chính xác, tránh việc người dùng phải khoanh lại nhiều lần. |
| **6** | **AI tự làm đến đâu** | **Agentic / Multimodal:**<br>AI tự động phân tích khu vực người dùng đang tương tác thông qua **Tọa độ + Hình ảnh cắt ra (Vision) + Metadata tài liệu**.<br><br>Nếu dữ liệu khoanh vùng quá ngắn, nhiễu, hoặc không rõ ràng, AI sẽ tự động mở rộng vùng tìm kiếm (**Fallback Context**) ra toàn bộ trang tài liệu đó và xác nhận lại với người dùng trước khi trả lời.<br><br>*Lý do:* Một câu trả lời "lạc đề" do lỗi trích xuất thô sẽ làm giảm nghiêm trọng độ tin cậy của ứng dụng học tập. |
| **7** | **Người thử & Phân công** | **Thành viên tham gia:**<br>• Trần Duy Trường - 2A202601247<br>• Nguyễn Khánh Toàn - 2A202601843<br>• Hồ Văn Thi - 2A202601907<br>• Nguyễn Quang Huy - 2A202601165<br>• Lê Nguyễn Phi Trường - 2A202601541<br><br>**Phân công nhiệm vụ:**<br>• **UI/UX:** Thiết kế lại tương tác khoanh vùng (thêm auto-snapping) & spec.<br>• **Backend:** Xử lý truyền tọa độ và ảnh vùng chọn.<br>• **AI:** Tích hợp Multimodal LLM (Vision) thay cho OCR tĩnh + Prompt điều hướng ngữ cảnh bị thiếu. |
