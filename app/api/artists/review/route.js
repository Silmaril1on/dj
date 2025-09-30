import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";
import {
  createSupabaseServerClient,
  getServerUser,
} from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get("artistId");
    const userReviews = searchParams.get("userReviews");

    // Handle user reviews request
    if (userReviews === "true") {
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

      const supabase = await createSupabaseServerClient(cookieStore);
      const page = parseInt(searchParams.get("page")) || 1;
      const limit = parseInt(searchParams.get("limit")) || 20;
      const offset = (page - 1) * limit;

      // Get all user reviews with pagination
      const { data: userReviewsData, error: reviewsError } = await supabase
        .from("artist_reviews")
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
            artist_image
          )
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (reviewsError) {
        return NextResponse.json(
          {
            success: false,
            error: "Failed to fetch user reviews",
            details: reviewsError.message,
          },
          { status: 500 }
        );
      }

      // Get total count for pagination
      const { count: totalReviews, error: countError } = await supabase
        .from("artist_reviews")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (countError) {
        return NextResponse.json(
          {
            success: false,
            error: "Failed to fetch reviews count",
            details: countError.message,
          },
          { status: 500 }
        );
      }

      // Transform the data to include artist info
      const reviews =
        userReviewsData?.map((review) => ({
          id: review.id,
          review_title: review.review_title,
          review_text: review.review_text,
          created_at: review.created_at,
          updated_at: review.updated_at,
          artist: {
            id: review.artists.id,
            name: review.artists.name,
            stage_name: review.artists.stage_name,
            artist_image: review.artists.artist_image,
          },
        })) || [];

      return NextResponse.json({
        success: true,
        data: {
          reviews,
          pagination: {
            page,
            limit,
            total: totalReviews || 0,
            totalPages: Math.ceil((totalReviews || 0) / limit),
            hasNext: page < Math.ceil((totalReviews || 0) / limit),
            hasPrev: page > 1,
          },
        },
      });
    }

    // Handle artist reviews request (existing functionality)
    if (!artistId) {
      return NextResponse.json(
        { error: "Artist ID is required" },
        { status: 400 }
      );
    }
    // Fetch artist data separately
    const { data: artist, error: artistError } = await supabaseAdmin
      .from("artists")
      .select("id, name, stage_name, artist_image, genres")
      .eq("id", artistId)
      .single();

    if (artistError) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const offset = (page - 1) * limit;

    // Fetch paginated reviews for the specific artist
    const { data: reviews, error: fetchError, count: totalReviews } = await supabaseAdmin
      .from("artist_reviews")
      .select(
        `
        *,
        users!inner(
          id,
          userName,
          user_avatar
        )
      `,
        { count: "exact" }
      )
      .eq("artist_id", artistId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (fetchError) {
      return NextResponse.json(
        { error: "Failed to fetch reviews" },
        { status: 500 }
      );
    }

    // Get user ratings for each review author
    const reviewUserIds = reviews?.map((review) => review.user_id) || [];
    let userRatings = {};

    if (reviewUserIds.length > 0) {
      const { data: ratingsData, error: ratingsError } = await supabaseAdmin
        .from("artist_ratings")
        .select("user_id, score")
        .eq("artist_id", artistId)
        .in("user_id", reviewUserIds);

      if (ratingsError) {
        console.error("Error fetching user ratings:", ratingsError);
        return NextResponse.json(
          { error: "Failed to fetch user ratings" },
          { status: 500 }
        );
      }

      // Create a map of user_id to rating score
      ratingsData?.forEach((rating) => {
        userRatings[rating.user_id] = rating.score;
      });
    }

    // Add user ratings to each review
    const reviewsWithRatings =
      reviews?.map((review) => ({
        ...review,
        userRating: userRatings[review.user_id] || null,
      })) || [];

    return NextResponse.json({
      success: true,
      artist: artist,
      reviews: reviewsWithRatings,
      count: totalReviews || 0,
      pagination: {
        page,
        limit,
        total: totalReviews || 0,
        totalPages: Math.ceil((totalReviews || 0) / limit),
        hasNext: page < Math.ceil((totalReviews || 0) / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error in GET reviews API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { artistId, userId, reviewTitle, reviewText } = await request.json();
    if (!artistId || !userId || !reviewTitle || !reviewText) {
      return NextResponse.json(
        {
          error:
            "Artist ID, User ID, Review Title, and Review Text are required",
        },
        { status: 400 }
      );
    }

    const { data: newReview, error: insertError } = await supabaseAdmin
      .from("artist_reviews")
      .insert({
        artist_id: artistId,
        user_id: userId,
        review_title: reviewTitle,
        review_text: reviewText,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select(
        `
        *,
        users!inner(
          id,
          userName,
          user_avatar
        )
      `
      )
      .single();

    if (insertError) {
      console.error("Error inserting review:", insertError);
      return NextResponse.json(
        { error: "Failed to submit review" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Review submitted successfully",
      review: newReview,
    });
  } catch (error) {
    console.error("Error in review API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
