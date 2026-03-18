import { NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  getServerUser,
} from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";
import {
  getArtistByIdentifier,
  getArtistReviews,
  getUserReviews,
  createReview,
} from "@/app/lib/services/artists/artistReviews";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get("artistId");
    const artistSlug = searchParams.get("artistSlug");
    const isUserReviews = searchParams.get("userReviews") === "true";

    if (isUserReviews) {
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

      const supabase = await createSupabaseServerClient(cookieStore);
      const page = parseInt(searchParams.get("page")) || 1;
      const limit = parseInt(searchParams.get("limit")) || 20;

      const result = await getUserReviews(supabase, user.id, page, limit);

      if (result.error) {
        return NextResponse.json(
          {
            success: false,
            error: "Failed to fetch user reviews",
            details: result.error.message,
          },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        data: { reviews: result.reviews, pagination: result.pagination },
      });
    }

    if (!artistId && !artistSlug) {
      return NextResponse.json(
        { error: "Artist ID or slug is required" },
        { status: 400 },
      );
    }

    const { artist, error: artistError } = await getArtistByIdentifier(
      artistSlug,
      artistId,
    );

    if (artistError) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;

    const result = await getArtistReviews(artist.id, page, limit);

    if (result.error) {
      return NextResponse.json(
        { error: "Failed to fetch reviews" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      artist,
      reviews: result.reviews,
      count: result.totalReviews,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error in GET reviews API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
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
        { status: 400 },
      );
    }

    const result = await createReview(
      artistId,
      userId,
      reviewTitle,
      reviewText,
    );

    if (result.error) {
      console.error("Error inserting review:", result.error);
      return NextResponse.json(
        { error: "Failed to submit review" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Review submitted successfully",
      review: result.review,
    });
  } catch (error) {
    console.error("Error in review API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
