import { NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  getServerUser,
} from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const { user, error: userError } = await getServerUser(cookieStore);

    let userId = null;
    if (user && !userError) {
      userId = user.id;
    }

    const supabase = await createSupabaseServerClient(cookieStore);

    const { count: likesCount, error: countError } = await supabase
      .from("event_likes")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId);

    if (countError) {
      return NextResponse.json(
        { error: "Failed to get likes count" },
        { status: 500 }
      );
    }

    let isLiked = false;
    if (userId) {
      const { data: userLike, error: userLikeError } = await supabase
        .from("event_likes")
        .select("id")
        .eq("event_id", eventId)
        .eq("user_id", userId)
        .single();

      if (userLikeError && userLikeError.code !== "PGRST116") {
        return NextResponse.json(
          { error: "Failed to check user like status" },
          { status: 500 }
        );
      }

      isLiked = !!userLike;
    }

    return NextResponse.json({
      success: true,
      likesCount: likesCount || 0,
      isLiked,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const { user, error: userError } = await getServerUser(cookieStore);

    if (userError) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication failed",
          details: userError.message,
        },
        { status: 401 }
      );
    }
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not authenticated" },
        { status: 401 }
      );
    }

    const { eventId } = await request.json();
    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient(cookieStore);

    const { data: existingLike, error: checkError } = await supabase
      .from("event_likes")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      return NextResponse.json(
        { error: "Failed to check like status" },
        { status: 500 }
      );
    }

    const isLiked = !!existingLike;

    if (isLiked) {
      const { error: deleteError } = await supabase
        .from("event_likes")
        .delete()
        .eq("event_id", eventId)
        .eq("user_id", user.id);
      if (deleteError) {
        return NextResponse.json(
          { error: "Failed to remove like" },
          { status: 500 }
        );
      }
    } else {
      const { error: insertError } = await supabase
        .from("event_likes")
        .insert({ event_id: eventId, user_id: user.id });
      if (insertError) {
        return NextResponse.json(
          { error: "Failed to add like" },
          { status: 500 }
        );
      }
    }

    const { count: likesCount, error: countError } = await supabase
      .from("event_likes")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId);
    if (countError) {
      return NextResponse.json(
        { error: "Failed to get likes count" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      likesCount: likesCount || 0,
      isLiked: !isLiked,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
