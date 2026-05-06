import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerUser } from "@/app/lib/config/supabaseServer";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const { user } = await getServerUser(cookieStore);

    if (!user?.is_admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";

    const { data, error } = await supabaseAdmin
      .from("artists")
      .select(
        "id, name, stage_name, image_url, artist_slug, country, city, birth, desc, status",
      )
      .eq("status", status)
      .or(
        "country.is.null,city.is.null,birth.is.null,desc.is.null," +
          "country.eq.,city.eq.,birth.eq.,desc.eq.",
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw new Error(error.message);

    // ✅ normalize desc → description
    const normalized = (data || []).map((a) => ({
      ...a,
      description: a.desc,
    }));

    return NextResponse.json({ artists: normalized });
  } catch (err) {
    console.error("[artists-fill GET]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const cookieStore = await cookies();
    const { user } = await getServerUser(cookieStore);

    if (!user?.is_admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { updates } = await request.json();

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: "No updates provided" },
        { status: 400 },
      );
    }

    const results = await Promise.allSettled(
      updates.map(({ id, description, ...fields }) => {
        if (!id) return Promise.resolve({ skipped: true });

        const safeFields = {
          ...fields,
        };

        // ✅ map description → desc
        if (description !== undefined) {
          safeFields.desc = description;
        }

        return supabaseAdmin
          .from("artists")
          .update({
            ...safeFields,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id);
      }),
    );

    const failed = results.filter((r) => r.status === "rejected").length;

    return NextResponse.json({ success: true, failed });
  } catch (err) {
    console.error("[artists-fill PATCH]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
