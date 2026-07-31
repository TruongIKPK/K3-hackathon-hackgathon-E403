import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type IncomingItem = {
  id: string;
  type: "text" | "image";
  text?: string;
  previewUrl?: string;
  label?: string;
};

function jsonResponse(body: object, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    content?: string;
    items?: IncomingItem[];
    blocks?: IncomingItem[];
  } | null;

  const rawTextContent =
    (body?.content || "").trim() ||
    (body?.items || body?.blocks || [])
      .map((item, i) => (item.type === "image" ? `[Mục #${i + 1} - ${item.label || "Hình ảnh"}]` : item.text || ""))
      .filter(Boolean)
      .join("\n\n");

  if (!rawTextContent) {
    return jsonResponse({ error: "Quyển tập đang rỗng, hãy thêm nội dung trước khi chuẩn hóa." }, 400);
  }

  const backendUrl = process.env.BACKEND_CHATBOT_SERVICE_URL || "http://127.0.0.1:8000/api/chatbot";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);

  try {
    const promptMessage = {
      role: "user",
      content: `Dưới đây là đoạn ghi chép/văn bản bài học từ slide:\n\n${rawTextContent}\n\nHãy đóng vai Biên tập viên Giáo dục VLearn. Hãy chuẩn hóa và trình bày lại ĐÚNG đoạn văn bản trên theo định dạng Markdown sạch sẽ và tối ưu cho việc học:\n1. Nếu dữ liệu chứa danh sách/so sánh/thống kê -> hãy trình bày thành Bảng Markdown (Table) hoặc Danh sách gạch đầu dòng rõ ràng.\n2. In đậm các từ khóa, khái niệm hoặc tiêu đề quan trọng.\n3. Chuẩn hóa thuật ngữ chuyên ngành, sửa lỗi chính tả và hành văn mượt mà.\n4. KHÔNG tự tạo phần Mục lục, KHÔNG tự thêm tiêu đề trang rác, và KHÔNG tự thêm phần Tóm tắt ôn thi cuối cùng.\n5. Chỉ trả về duy nhất nội dung văn bản đã được chuẩn hóa định dạng Markdown.`,
    };

    const upstream = await fetch(backendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "assistant", content: "Xin chào! Tôi là VLearn Editor." },
          promptMessage,
        ],
        selectedRegions: [],
      }),
      signal: controller.signal,
    });

    const raw = await upstream.text();
    let data: { content?: string; error?: string } | null = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      return jsonResponse({ error: "Phản hồi từ Chatbot Service không đúng định dạng JSON." }, 502);
    }

    if (!upstream.ok || data?.error) {
      return jsonResponse({ error: data?.error || "Không thể chuẩn hóa nội dung tập." }, upstream.status);
    }

    let cleanedContent = (data?.content || "").trim();
    cleanedContent = cleanedContent
      .replace(/^```(?:markdown)?\n?/gi, "")
      .replace(/\n?```$/gi, "")
      .trim();

    return jsonResponse({
      content: cleanedContent,
      originalTextLength: rawTextContent.length,
    });
  } catch (error) {
    const fallbackMarkdown = `# SỔ TAY CHUẨN HÓA BÀI GIẢNG\n\n## 📌 Tóm Tắt Tổng Quan\n*Tổng hợp từ ${body?.blocks?.length || 0} mục ghi chép trong quyển tập.*\n\n` +
      (body?.blocks || []).map((b: any) => `### ${b.regionLabel || "Mục ghi chép"}\n${b.content}`).join("\n\n");
    return jsonResponse({ content: fallbackMarkdown });
  } finally {
    clearTimeout(timeout);
  }
}
