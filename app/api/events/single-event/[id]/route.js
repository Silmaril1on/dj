import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient, getServerUser } from "@/app/lib/config/supabaseServer";

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const cookieStore = await cookies();
    const { user } = await getServerUser(cookieStore);
    const supabase = await createSupabaseServerClient(cookieStore);

    // Fetch the event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { success: false, error: eventError?.message || "Event not found" },
        { status: 404 }
      );
    }

    // Fetch likes/interested count
    const { data: likesData, error: likesError } = await supabase
      .from("event_likes")
      .select("user_id")
      .eq("event_id", id);

    const likesCount = Array.isArray(likesData) ? likesData.length : 0;
    const userLiked =
      user && Array.isArray(likesData)
        ? likesData.some((like) => like.user_id === user.id)
        : false;

    return NextResponse.json({
      ...event,
      likesCount,
      userLiked,
      currentUserId: user?.id || null,
      success: true,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}