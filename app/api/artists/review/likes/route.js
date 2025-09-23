// app/api/artists/review/likes/route.js
import { NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  getServerUser,
} from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";

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
        {
          success: false,
          error: "User not authenticated",
        },
        { status: 401 }
      );
    }

    const { reviewId, action } = await request.json();

    if (!reviewId || !action) {
      return NextResponse.json(
        { error: "Review ID and action are required" },
        { status: 400 }
      );
    }

    if (!["like", "dislike"].includes(action)) {
      return NextResponse.json(
        { error: "Action must be 'like' or 'dislike'" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient(cookieStore);

    // Get current review data WITH joined user and artist data
    const { data: review, error: fetchError } = await supabase
      .from("artist_reviews")
      .select(
        `
        *,
        users!inner(
          id,
          userName,
          user_avatar
        ),
        artists!inner(
          name,
          stage_name,
          artist_image,
          genres
        )
      `
      )
      .eq("id", reviewId)
      .single();

    if (fetchError) {
      console.error("Error fetching review:", fetchError);
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Initialize arrays if they don't exist
    const currentLikes = review.likes || [];
    const currentDislikes = review.dislikes || [];

    let newLikes = [...currentLikes];
    let newDislikes = [...currentDislikes];

    if (action === "like") {
      // Remove from dislikes if user was there
      newDislikes = newDislikes.filter((id) => id !== user.id);

      // Add to likes if not already there, remove if already there (toggle)
      if (newLikes.includes(user.id)) {
        newLikes = newLikes.filter((id) => id !== user.id);
      } else {
        newLikes.push(user.id);
      }
    } else if (action === "dislike") {
      // Remove from likes if user was there
      newLikes = newLikes.filter((id) => id !== user.id);

      // Add to dislikes if not already there, remove if already there (toggle)
      if (newDislikes.includes(user.id)) {
        newDislikes = newDislikes.filter((id) => id !== user.id);
      } else {
        newDislikes.push(user.id);
      }
    }

    // Update the review
    const { error: updateError } = await supabase
      .from("artist_reviews")
      .update({
        likes: newLikes,
        dislikes: newDislikes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reviewId);

    if (updateError) {
      console.error("Error updating review:", updateError);
      return NextResponse.json(
        { error: "Failed to update review" },
        { status: 500 }
      );
    }

    // Return the complete review with updated likes/dislikes and preserved joined data
    const updatedReview = {
      ...review,
      likes: newLikes,
      dislikes: newDislikes,
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: `Review ${action} updated successfully`,
      review: updatedReview,
      likesCount: newLikes.length,
      dislikesCount: newDislikes.length,
      userLiked: newLikes.includes(user.id),
      userDisliked: newDislikes.includes(user.id),
    });
  } catch (error) {
    console.error("Error in likes API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
