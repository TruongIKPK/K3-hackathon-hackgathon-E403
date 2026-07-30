import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type RegionContext = {
  id: string;
  label: string;
  parsedText?: string;
};

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      messages?: ChatMessage[];
      regions?: RegionContext[];
    };

    const messages = body.messages ?? [];
    const regions = body.regions ?? [];
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content || "";

    if (!lastUserMessage.trim()) {
      return NextResponse.json({ error: "Nội dung câu hỏi không được để trống." }, { status: 400 });
    }

    // Build context summary from active selection regions
    const contextText = regions
      .map((r) => `📌 **${r.label}**:\n${r.parsedText?.trim() || "(Chưa có dữ liệu OCR)"}`)
      .join("\n\n");

    const queryLower = lastUserMessage.toLowerCase();
    let replyMarkdown = "";

    // Intelligently generate contextual response based on prompt intent and region OCR
    if (queryLower.includes("giải thích") || queryLower.includes("trợ giúp") || queryLower.includes("hỏi")) {
      replyMarkdown = `### 💡 Phân tích & Giải thích Nội dung\n\nDựa trên các phân vùng bạn đã khoanh:\n\n${contextText}\n\n---\n\n#### 🎯 Điểm trọng tâm:\n- Nội dung trên chứa thông tin quan trọng được trích xuất từ slide.\n- Nếu bạn cần làm rõ khái niệm hoặc công thức cụ thể trong vùng này, hãy cho tôi biết chi tiết nhé!`;
    } else if (queryLower.includes("tóm tắt") || queryLower.includes("bài học") || queryLower.includes("tổng hợp")) {
      replyMarkdown = `### 📚 Tóm tắt Bài học từ các vùng đã khoanh\n\n${contextText ? contextText : "Chưa có vùng khoanh nào."}\n\n---\n\n#### ✍️ Ghi nhớ nhanh:\n1. **Ý chính 1**: Xác định các từ khóa trọng tâm trong vùng chọn.\n2. **Ý chính 2**: Liên kết thông tin giữa các vùng để nắm trọn vẹn ngữ cảnh slide.`;
    } else if (queryLower.includes("câu hỏi") || queryLower.includes("ôn tập") || queryLower.includes("trắc nghiệm")) {
      replyMarkdown = `### 📝 Câu hỏi Ôn tập Tự luyện\n\nDựa vào nội dung khoanh vùng:\n\n1. **Câu 1**: Nội dung chính được đề cập trong ${regions[0]?.label || "vùng khoanh"} là gì?\n   - A. Khái niệm cơ bản\n   - B. Phương pháp ứng dụng\n   - C. Ví dụ thực tế\n   - D. Tất cả các ý trên\n\n*Đáp án gợi ý: D. Hãy đối chiếu với slide để ghi nhớ tốt hơn!*`;
    } else {
      replyMarkdown = `### 🤖 Trả lời trợ giúp từ VLearn AI\n\nBạn vừa hỏi: "*${lastUserMessage}*"\n\n**Ngữ cảnh vùng khoanh đang chọn:**\n${contextText || "Không có vùng khoanh nào được chọn."}\n\n---\nTôi đã tiếp nhận câu hỏi của bạn. Nếu cần phân tích sâu hơn về bất kỳ vùng nào, bạn có thể bấm chọn vùng tương ứng trên danh sách!`;
    }

    return NextResponse.json({
      role: "assistant",
      content: replyMarkdown,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json({ error: "Lỗi xử lý yêu cầu chat." }, { status: 500 });
  }
}
