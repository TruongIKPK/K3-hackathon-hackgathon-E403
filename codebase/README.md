# Freehand Slide Lab

MVP mô phỏng lát cắt chức năng khoanh vùng trên VLearn:

- tải một file PDF từ máy;
- render và chuyển trang PDF ngay trong trình duyệt;
- vẽ vùng khoanh bất quy tắc bằng chuột, bút hoặc cảm ứng;
- nhấn **Process** để cắt nội dung theo đúng mặt nạ freehand và xem PNG preview.

Không có OCR, chatbot, upload server hay lưu dữ liệu trong scope hiện tại. File PDF và ảnh crop chỉ tồn tại trong phiên trình duyệt.

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
3. Giữ chuột/bút và vẽ một đường bao quanh nội dung.
4. Thả chuột để khép vùng, sau đó nhấn **Process**.
5. Kiểm tra ảnh PNG cắt theo polygon ở panel **Vùng đã chọn**.

## Python LangChain/LangGraph chatbot

The current app includes:

- multi-region OCR context in `ChatWidget`;
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

The baseline is intentionally text-only and grounded in
`selectedRegions[].parsedText`. It accepts `previewUrl` for contract compatibility
but does not send crop images to a vision model yet.
