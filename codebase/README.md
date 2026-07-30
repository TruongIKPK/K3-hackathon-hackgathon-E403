# Freehand Slide Lab

MVP mô phỏng lát cắt chức năng khoanh vùng trên VLearn:

- tải một file PDF từ máy;
- render và chuyển trang PDF ngay trong trình duyệt;
- vẽ và quản lý nhiều vùng khoanh bất quy tắc bằng chuột, bút hoặc cảm ứng;
- giữ vùng theo từng trang trong RAM, chỉnh lại text OCR và pin vùng xuyên slide;
- so sánh các vùng đã pin bằng chatbot;
- tự động bổ sung text toàn slide chứa vùng và cửa sổ slide lân cận -1/+1, khử trùng khi nhiều vùng dùng chung trang;
- chấm chất lượng vùng theo hình học và OCR, cảnh báo vùng lệch/nhiễu, tạm loại vùng vô nghĩa khỏi chatbot nhưng cho phép người dùng xác nhận dùng tiếp;
- bấm citation `[Vùng n]` hoặc `[Slide n]` để quay về đúng polygon hay slide nguồn.

PDF, polygon, ảnh crop và trạng thái pin chỉ tồn tại trong RAM của phiên trình duyệt. OCR và chatbot được gọi qua các API route; MVP chưa lưu tài liệu hoặc lịch sử vào cơ sở dữ liệu.

## Chạy local

Yêu cầu Node.js `>=22.13.0`.

```bash
npm install
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

## Kiểm tra

```bash
npm run build
npm test
npm run lint
```

## Luồng demo

1. Chọn **Tải PDF từ máy**.
2. Chờ slide đầu tiên hiển thị, dùng nút mũi tên để đổi trang nếu cần.
3. Giữ chuột/bút và vẽ một hoặc nhiều đường bao quanh nội dung.
4. Kiểm tra crop và sửa text OCR nếu cần; có thể ghim vùng rồi chuyển sang slide khác.
5. Xem nhãn chất lượng: vùng đỏ cần khoanh lại hoặc bấm **Vẫn OCR**; nếu OCR còn hữu ích có thể chọn **Vẫn dùng vùng này**.
6. Ghim ít nhất hai vùng và chọn **So sánh vùng đã ghim**.
7. Bấm citation `[Vùng n]` để highlight polygon hoặc `[Slide n]` để mở slide ngữ cảnh.

## Python LangChain/LangGraph chatbot

The current app includes:

- multi-region OCR context plus deduplicated `slideContexts` windows (`page-1/page/page+1`);
- Vinext proxy route `POST /api/chatbot`;
- Python FastAPI service in `backend/`;
- LangGraph flow for context guardrail → LangChain answer → output guardrail;
- Markdown rendering for chatbot responses.

Start the Python service first:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-dev.txt
Copy-Item .env.example .env
python -m uvicorn app.main:app --reload --port 8000
```

Configure `OPENAI_API_KEY` in `backend/.env`. The frontend proxy defaults to
`http://127.0.0.1:8000/api/chatbot`; copy the root `.env.example` to `.env`
when a different backend URL or OCR key is needed.

The baseline is intentionally text-only and grounded in both
`selectedRegions[].parsedText` and PDF text from `slideContexts`. It accepts
`previewUrl` for contract compatibility but does not send crop images to a vision model yet.
