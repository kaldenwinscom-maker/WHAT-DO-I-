import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (file.size > MAX_SIZE) return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 413 });

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/gif", "image/webp",
      "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain", "text/csv", "application/json"];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "File type not supported" }, { status: 415 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");

    const fileRecord = {
      id: crypto.randomUUID(),
      name: file.name,
      type: file.type,
      size: file.size,
      userId,
      uploadedAt: new Date().toISOString(),
      base64: base64.substring(0, 100) + "...",
    };

    return NextResponse.json({ file: fileRecord, success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
