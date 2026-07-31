import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type LightOnPage = {
  index?: number;
  markdown?: string;
};

type LightOnResponse = {
  status?: string;
  result?: {
    pages?: LightOnPage[];
  };
  message?: string;
};



export async function POST(request: NextRequest) {
  const apiKey = process.env.LIGHTON_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "LIGHTON_API_KEY chưa được cấu hình." }, { status: 500 });
  }

  const incomingForm = await request.formData().catch(() => null);
  if (!incomingForm) {
    return NextResponse.json({ error: "Request phải dùng multipart/form-data." }, { status: 400 });
  }

  const file = incomingForm.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Thiếu ảnh PNG để parse." }, { status: 400 });
  }

  const lightonForm = new FormData();
  lightonForm.append("file", file, file.name || "selection.png");

  const response = await fetch("https://api.lighton.ai/api/v3/parse", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: lightonForm,
  });

  const payload = (await response.json().catch(() => null)) as LightOnResponse | null;
  if (!response.ok) {
    return NextResponse.json(
      { error: payload?.message || "LightOn parse API trả về lỗi.", details: payload },
      { status: response.status },
    );
  }

  const pages = payload?.result?.pages ?? [];
  const markdown = pages
    .map((page) => page.markdown?.trim())
    .filter(Boolean)
    .join("\n\n");

  return NextResponse.json({
    markdown,
    pages,
    status: payload?.status,
  });
}
