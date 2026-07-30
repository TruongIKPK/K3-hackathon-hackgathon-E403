import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Endpoint /api/chatbot
 * Hướng dẫn: Proxy hoặc chuyển tiếp yêu cầu tới AI Chatbot Service của bạn.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { error: "Payload không hợp lệ. Cần truyền mảng 'messages'." },
        { status: 400 }
      );
    }

    // Nếu bạn có môi trường BACKEND_CHATBOT_SERVICE_URL, có thể fetch trực tiếp sang service của bạn:
    const backendUrl = process.env.BACKEND_CHATBOT_SERVICE_URL;

    if (backendUrl) {
      const externalRes = await fetch(backendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await externalRes.json();
      return NextResponse.json(data, { status: externalRes.status });
    }

    // Mẫu phản hồi định dạng chuẩn khi service backend của bạn chưa sẵn sàng
    const lastUserMsg = body.messages[body.messages.length - 1]?.content || "";
    const activeRegions = body.selectedRegions || [];

    return NextResponse.json({
      role: "assistant",
      content: `[Chatbot Service /api/chatbot]\nĐã nhận câu hỏi: "${lastUserMsg}"\nSố lượng phân vùng đính kèm: ${activeRegions.length}`,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Lỗi /api/chatbot:", err);
    return NextResponse.json({ error: "Lỗi kết nối tới /api/chatbot." }, { status: 500 });
  }
}
