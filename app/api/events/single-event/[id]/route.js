import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient, getServerUser } from "@/app/lib/config/supabaseServer";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const { user } = await getServerUser(cookieStore);
    const supabase = await createSupabaseServerClient(cookieStore);

    const [eventResult, likesResult] = await Promise.all([
      supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single(),
      
      supabase
        .from("event_likes")
        .select("user_id")
        .eq("event_id", id)
    ]);

    if (eventResult.error || !eventResult.data) {
      return NextResponse.json(
        { success: false, error: eventResult.error?.message || "Event not found" },
        { status: 404 }
      );
    }

    const event = eventResult.data;
    const likesData = likesResult.data || [];

    const likesCount = likesData.length;
    const userLiked = user 
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