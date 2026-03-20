import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createSupabaseServerClient,
  supabaseAdmin,
} from "@/app/lib/config/supabaseServer";

const REQUIRED_PROFILE_FIELDS = [
  "user_avatar",
  "first_name",
  "last_name",
  "address",
  "birth_date",
  "sex",
  "country",
  "city",
];

export async function PATCH() {
  try {
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userData, error: fetchError } = await supabaseAdmin
      .from("users")
      .select(
        "id, email_verified, profile_verified, user_avatar, first_name, last_name, address, birth_date, sex, country, city",
      )
      .eq("id", authUser.id)
      .single();

    if (fetchError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const profileComplete = REQUIRED_PROFILE_FIELDS.every(
      (f) => userData[f] && String(userData[f]).trim() !== "",
    );

    if (profileComplete && !userData.profile_verified) {
      const { data: updated, error: updateError } = await supabaseAdmin
        .from("users")
        .update({ profile_verified: true })
        .eq("id", authUser.id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json(
          { error: "Failed to set profile verified" },
          { status: 500 },
        );
      }

      return NextResponse.json({ user: updated }, { status: 200 });
    }

    return NextResponse.json({ user: userData }, { status: 200 });
  } catch (err) {
    console.error("[VERIFY-COMPLETE] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
