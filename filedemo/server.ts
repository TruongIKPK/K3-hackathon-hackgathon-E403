import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize Gemini client lazily/safely
const getGeminiAi = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// VLearn Tutor API Endpoint
app.post("/api/tutor/ask", async (req, res) => {
  try {
    const { question, selectedText, slideTitle, slideText, pageNumber, docTitle, chatHistory } = req.body;

    const ai = getGeminiAi();

    let contextDetails = `Document: ${docTitle || "day05-slide-batch03-C401.pdf"}\n`;
    contextDetails += `Trang slide: ${pageNumber || 1}\n`;
    if (slideTitle) contextDetails += `Tiêu đề slide: ${slideTitle}\n`;
    if (slideText) contextDetails += `Nội dung slide hiện tại:\n${slideText}\n`;
    if (selectedText) contextDetails += `Đoạn văn bản người dùng bôi đen / chọn:\n"${selectedText}"\n`;

    const systemInstruction = `Bạn là VLearn Tutor - Trợ lý AI học tập thông minh và thân thiện của nền tảng VLearn.
Nhiệm vụ của bạn là giải đáp thắc mắc, tóm tắt, giải thích các khái niệm trong slide bài giảng, hoặc trả lời bất kỳ câu hỏi ôn tập nào của sinh viên bằng tiếng Việt ngắn gọn, dễ hiểu, sư phạm, và có cấu trúc rõ ràng (sử dụng gạch đầu dòng, bold key terms nếu thích hợp).

Dưới đây là ngữ cảnh slide bài giảng hiện tại của sinh viên:
${contextDetails}

Hãy dùng thông tin trong slide và kiến thức môn học để trả lời trực tiếp câu hỏi của sinh viên. Nếu câu hỏi liên quan đến đoạn bôi đen, hãy tập trung giải thích đoạn bôi đen đó.`;

    if (!ai) {
      // Graceful fallback response when GEMINI_API_KEY is not configured yet
      let fallbackText = `[VLearn Tutor] Xin chào! Mình đã nhận được câu hỏi của bạn về Trang ${pageNumber || 1}. `;
      if (selectedText) {
        fallbackText += `\n\nBạn đang hỏi về đoạn bôi đen: "${selectedText}". `;
        fallbackText += `\n\nTrong thiết kế sản phẩm AI, sự "không chắc chắn" (uncertainty) xuất phát từ tính chất xác suất (probabilistic nature) của các mô hình AI. Để giải quyết điều này, PM/Designer cần thiết kế các cơ chế phản hồi linh hoạt, quản lý kỳ vọng của người dùng và tạo cơ chế kiểm chứng (verification UI).`;
      } else {
        fallbackText += `\n\nCảm ơn bạn đã đặt câu hỏi: "${question}". Trang slide này thảo luận về các chiến lược thiết kế sản phẩm AI thích ứng với tính không chắc chắn của mô hình, chuyển đổi từ khả năng kỹ thuật sang trải nghiệm người dùng đáng tin cậy.`;
      }
      return res.json({ response: fallbackText });
    }

    const prompt = question || (selectedText ? `Giải thích giúp mình đoạn này: "${selectedText}"` : "Tóm tắt giúp mình slide này");

    // Format chat contents
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const replyText = response.text || "VLearn Tutor không thể tạo ra câu trả lời lúc này, vui lòng thử lại.";
    return res.json({ response: replyText });
  } catch (error: any) {
    console.error("Error in /api/tutor/ask:", error);
    return res.status(500).json({
      error: "Không thể xử lý yêu cầu",
      details: error.message || String(error),
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`VLearn App running on http://localhost:${PORT}`);
  });
}

startServer();
