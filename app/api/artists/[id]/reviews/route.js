import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";

export async function GET(request, { params }) {
  try {
    const { id: artistId } = await params;

    if (!artistId) {
      return NextResponse.json(
        { error: "Artist ID is required" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);

    // Fetch last 6 reviews for the artist
    const { data: reviews, error: reviewsError } = await supabase
      .from("artist_reviews")
      .select("review_title, review_text, created_at, user_id")
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
      });
    }

    // Get unique user IDs from reviews
    const userIds = [...new Set(reviews.map((review) => review.user_id))];

    // Fetch user data for all reviewers
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, userName, user_avatar")
      .in("id", userIds);

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return NextResponse.json(
        { error: "Failed to fetch user data" },
        { status: 500 }
      );
    }

    // Create user lookup map
    const userMap = (users || []).reduce((acc, user) => {
      acc[user.id] = {
        userName: user.userName,
        user_avatar: user.user_avatar,
      };
      return acc;
    }, {});

    // Combine reviews with user data
    const reviewsWithUsers = reviews.map((review) => ({
      review_title: review.review_title,
      review_text: review.review_text,
      created_at: review.created_at,
      user_id: review.user_id,
      user: userMap[review.user_id] || {
        userName: "Unknown User",
        user_avatar: null,
      },
    }));

    return NextResponse.json({
      success: true,
      data: reviewsWithUsers,
    });
  } catch (error) {
    console.error("Reviews API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
