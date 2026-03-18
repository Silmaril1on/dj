import { NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  getServerUser,
} from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";
import { toggleReviewLike } from "@/app/lib/services/artists/artistReviews";

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
        { status: 401 },
      );
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not authenticated" },
        { status: 401 },
      );
    }

    const { reviewId, action } = await request.json();

    if (!reviewId || !action) {
      return NextResponse.json(
        { error: "Review ID and action are required" },
        { status: 400 },
      );
    }

    if (!["like", "dislike"].includes(action)) {
      return NextResponse.json(
        { error: "Action must be 'like' or 'dislike'" },
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient(cookieStore);

    const result = await toggleReviewLike(supabase, reviewId, user.id, action);

    if (result.error) {
      console.error("Error updating review:", result.error);
      const isNotFound = result.error.code === "PGRST116";
      return NextResponse.json(
        { error: isNotFound ? "Review not found" : "Failed to update review" },
        { status: isNotFound ? 404 : 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `Review ${action} updated successfully`,
      review: result.review,
      likesCount: result.newLikes.length,
      dislikesCount: result.newDislikes.length,
      userLiked: result.newLikes.includes(user.id),
      userDisliked: result.newDislikes.includes(user.id),
    });
  } catch (error) {
    console.error("Error in likes API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
