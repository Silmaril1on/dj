import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerUser, supabaseAdmin } from "@/app/lib/config/supabaseServer";

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
      .from("clubs")
      .select(
        "id, name, club_slug, image_url, address, capacity, description, social_links, venue_email, status",
      )
      .eq("status", status)
      .or(
        "capacity.is.null,description.is.null,social_links.is.null,venue_email.is.null," +
          "description.eq.,venue_email.eq.",
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw new Error(error.message);

    return NextResponse.json({ clubs: data || [] });
  } catch (err) {
    console.error("[clubs-fill GET]", err);
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
      updates.map(({ id, ...fields }) => {
        if (!id) return Promise.resolve({ skipped: true });

        const safeFields = { ...fields, updated_at: new Date().toISOString() };

        return supabaseAdmin.from("clubs").update(safeFields).eq("id", id);
      }),
    );

    const failed = results.filter((r) => r.status === "rejected").length;

    return NextResponse.json({ success: true, failed });
  } catch (err) {
    console.error("[clubs-fill PATCH]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
