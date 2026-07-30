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
