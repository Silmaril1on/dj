import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerUser } from "@/app/lib/config/supabaseServer";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";

const BUCKET = "generate_assets";
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const { user } = await getServerUser(cookieStore);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. PNG, JPG, WEBP, GIF only." },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum 10 MB." },
        { status: 400 },
      );
    }

    const ext = file.type.split("/")[1].replace("jpeg", "jpg");
    const fileName = `upload_${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 },
      );
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(fileName);

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error("[byteplus/upload]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
