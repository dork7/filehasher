import { NextResponse } from "next/server";
import { decrypt } from "@dork7/filehasher";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  const password = String(form.get("password") ?? "");
  if (!(file instanceof Blob) || file.size === 0) {
    return NextResponse.json({ error: "Please upload an encrypted file." }, { status: 400 });
  }
  if (!password) {
    return NextResponse.json({ error: "Password is required." }, { status: 400 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  try {
    const plain = decrypt(buf, password);
    const text = plain.toString("utf8");
    return NextResponse.json({ text });
  } catch {
    return NextResponse.json(
      { error: "Could not decrypt. Wrong password or file is not valid." },
      { status: 400 },
    );
  }
}
