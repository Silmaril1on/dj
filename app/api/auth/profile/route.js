// api/auth/profile/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerUser } from "@/app/lib/config/supabaseServer";
import { updateProfile } from "@/app/lib/services/user/profile/updateProfile";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const { user, error } = await getServerUser(cookieStore);

    if (error || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    return NextResponse.json({ profile: user });
  } catch (error) {
    console.error("[GET /api/auth/profile]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const cookieStore = await cookies();
    const { user, error } = await getServerUser(cookieStore);

    if (error || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const formData = await request.formData();
    const { profile, error: serviceError } = await updateProfile(
      user.id,
      formData,
    );

    if (serviceError) {
      return NextResponse.json({ error: serviceError }, { status: 500 });
    }

    return NextResponse.json({
      profile,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("[PUT /api/auth/profile]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
