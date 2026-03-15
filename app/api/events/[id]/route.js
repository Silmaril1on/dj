import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createSupabaseServerClient,
  supabaseAdmin,
  getServerUser,
} from "@/app/lib/config/supabaseServer";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const { user } = await getServerUser(cookieStore);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    // Fetch event to verify ownership
    const { data: event, error: fetchError } = await supabaseAdmin
      .from("events")
      .select("id, user_id")
      .eq("id", id)
      .single();

    if (fetchError || !event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 },
      );
    }

    // Check permission: admin or event owner
    const supabase = await createSupabaseServerClient(cookieStore);
    const { data: userData } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    const isAdmin = userData?.is_admin === true;
    const isOwner = event.user_id === user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        {
          success: false,
          error: "You don't have permission to delete this event",
        },
        { status: 403 },
      );
    }

    const { error: deleteError } = await supabaseAdmin
      .from("events")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: "Failed to delete event" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
