import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerUser } from "@/app/lib/config/supabaseServer";

const BASE_URL = process.env.BYTEPLUS_BASE_URL;
const API_KEY = process.env.BYTEPLUS_API_KEY;

const VALID_SIZES = ["512x512", "1K", "2K"];

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const { user } = await getServerUser(cookieStore);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { model, prompt, images, size, watermark, taskType } = body;

    if (!model || !prompt) {
      return NextResponse.json(
        { error: "model and prompt are required" },
        { status: 400 },
      );
    }

    const resolvedSize = VALID_SIZES.includes(size) ? size : "2K";

    const payload = {
      model,
      prompt: String(prompt).trim().slice(0, 4000),
      sequential_image_generation: "disabled",
      response_format: "url",
      size: resolvedSize,
      stream: false,
      watermark: watermark !== false,
    };

    if (taskType === "i2i" && Array.isArray(images) && images.length > 0) {
      const validImages = images
        .slice(0, 4)
        .map((u) => String(u).trim())
        .filter((u) => {
          try {
            const parsed = new URL(u);
            return ["http:", "https:"].includes(parsed.protocol);
          } catch {
            return false;
          }
        });
      if (validImages.length === 0) {
        return NextResponse.json(
          { error: "At least one valid image URL is required for i2i" },
          { status: 400 },
        );
      }
      payload.image = validImages;
    }

    const response = await fetch(`${BASE_URL}/images/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "BytePlus API error" },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[byteplus/image]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
