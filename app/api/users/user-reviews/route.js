import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createSupabaseServerClient,
  getServerUser,
} from "@/app/lib/config/supabaseServer";
import { revalidateTag } from "next/cache";
import { getUserReviews } from "@/app/lib/services/user/get-stats/getUserReviews";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;

    const data = await getUserReviews({ page, limit });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const status = error.message === "User not authenticated" ? 401 : 500;
    return NextResponse.json(
      { success: false, error: error.message },
      { status },
    );
  }
}

export async function PUT(request) {
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
        {
          success: false,
          error: "User not authenticated",
        },
        { status: 401 },
      );
    }

    const { reviewId, reviewTitle, reviewText } = await request.json();

    if (!reviewId || !reviewTitle || !reviewText) {
      return NextResponse.json(
        { error: "Review ID, title, and text are required" },
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient(cookieStore);

    // First, verify that the review belongs to the user
    const { data: existingReview, error: checkError } = await supabase
      .from("artist_reviews")
      .select("id, user_id, artist_id")
      .eq("id", reviewId)
      .eq("user_id", user.id)
      .single();

    if (checkError || !existingReview) {
      return NextResponse.json(
        { error: "Review not found or you don't have permission to edit it" },
        { status: 404 },
      );
    }

    // Update the review
    const { data: updatedReview, error: updateError } = await supabase
      .from("artist_reviews")
      .update({
        review_title: reviewTitle.trim(),
        review_text: reviewText.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", reviewId)
      .eq("user_id", user.id)
      .select(
        `
        id,
        review_title,
        review_text,
        created_at,
        updated_at,
        artists!inner(
          id,
          name,
          stage_name,
          image_url
        )
      `,
      )
      .single();

    if (updateError) {
      console.error("Error updating review:", updateError);
      return NextResponse.json(
        { error: "Failed to update review" },
        { status: 500 },
      );
    }

    // Transform the data to match the expected format
    const transformedReview = {
      id: updatedReview.id,
      review_title: updatedReview.review_title,
      review_text: updatedReview.review_text,
      created_at: updatedReview.created_at,
      updated_at: updatedReview.updated_at,
      artist: {
        id: updatedReview.artists.id,
        name: updatedReview.artists.name,
        stage_name: updatedReview.artists.stage_name,
        image_url: updatedReview.artists.image_url,
      },
    };

    return NextResponse.json({
      success: true,
      message: "Review updated successfully",
      review: transformedReview,
    });
  } catch (error) {
    console.error("Error in update-review API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
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
        {
          success: false,
          error: "User not authenticated",
        },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get("reviewId");

    if (!reviewId) {
      return NextResponse.json(
        { error: "Review ID is required" },
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient(cookieStore);

    // First, verify that the review belongs to the user
    const { data: existingReview, error: checkError } = await supabase
      .from("artist_reviews")
      .select("id, user_id, artist_id")
      .eq("id", reviewId)
      .eq("user_id", user.id)
      .single();

    if (checkError || !existingReview) {
      return NextResponse.json(
        { error: "Review not found or you don't have permission to delete it" },
        { status: 404 },
      );
    }

    // Delete the review
    const { error: deleteError } = await supabase
      .from("artist_reviews")
      .delete()
      .eq("id", reviewId)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error deleting review:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete review" },
        { status: 500 },
      );
    }

    revalidateTag("artists");
    revalidateTag(`artist-${existingReview.artist_id}`);
    revalidateTag(`user-statistics-${user.id}`);
    revalidateTag(`user-statistics-reviews-${user.id}`);
    revalidateTag("user-statistics-reviews");

    return NextResponse.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Error in delete-review API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
