import { NextResponse } from "next/server";
import { encrypt } from "@dork7/filehasher";

export async function POST(req: Request) {
  let body: { text?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const text = body.text ?? "";
  const password = body.password ?? "";
  if (!password) {
    return NextResponse.json({ error: "Password is required." }, { status: 400 });
  }
  const plain = Buffer.from(text, "utf8");
  const out = encrypt(plain, password);
  const filename = "encrypted.fhc";
  return new NextResponse(new Uint8Array(out), {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
