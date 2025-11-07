import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get("artistId");

    if (!artistId) {
      return NextResponse.json(
        { error: "Artist ID is required" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);

    // ✅ OPTIMIZED: Fetch reviews with user data in ONE query using JOIN
    const { data: reviews, error: reviewsError } = await supabase
      .from("artist_reviews")
      .select(`
        review_title,
        review_text,
        created_at,
        user_id,
        users:user_id(
          id,
          userName,
          user_avatar
        )
      `)
      .eq("artist_id", artistId)
      .order("created_at", { ascending: false })
      .limit(6);

    if (reviewsError) {
      console.error("Error fetching reviews:", reviewsError);
      return NextResponse.json(
        { error: "Failed to fetch reviews" },
        { status: 500 }
      );
    }

    if (!reviews || reviews.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: "No reviews found"
      });
    }

    // Transform the joined data into the expected format
    const reviewsWithUsers = reviews.map(review => {
      const { users, ...reviewData } = review;
      return {
        ...reviewData,
        user: users || {
          userName: "Unknown User",
          user_avatar: null
        }
      };
    });

    return NextResponse.json({
      success: true,
      data: reviewsWithUsers
    });

  } catch (error) {
    console.error("Artist reviews API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}