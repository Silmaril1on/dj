import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerUser } from "@/app/lib/config/supabaseServer";

const BASE_URL = process.env.BYTEPLUS_BASE_URL;
const API_KEY = process.env.BYTEPLUS_API_KEY;

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const { user } = await getServerUser(cookieStore);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      model,
      prompt,
      imageUrl,
      resolution,
      duration,
      cameraFixed,
      taskType,
    } = body;

    if (!model || !prompt) {
      return NextResponse.json(
        { error: "model and prompt are required" },
        { status: 400 },
      );
    }

    // Build inline prompt flags
    let textContent = String(prompt).trim().slice(0, 2000);
    if (resolution) textContent += ` --resolution ${resolution}`;
    if (duration) textContent += ` --duration ${duration}`;
    if (cameraFixed !== undefined)
      textContent += ` --camerafixed ${cameraFixed}`;

    const content = [{ type: "text", text: textContent }];

    if (taskType === "i2v" && imageUrl) {
      const urlObj = new URL(imageUrl); // validates URL
      if (!["https:", "http:"].includes(urlObj.protocol)) {
        return NextResponse.json(
          { error: "Invalid image URL" },
          { status: 400 },
        );
      }
      content.push({ type: "image_url", image_url: { url: imageUrl } });
    }

    const response = await fetch(`${BASE_URL}/contents/generations/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({ model, content }),
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
    if (err instanceof TypeError && err.message.includes("Invalid URL")) {
      return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
    }
    console.error("[byteplus/video]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
