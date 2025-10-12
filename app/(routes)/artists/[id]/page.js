import { capitalizeTitle } from "@/app/helpers/utils";
import ArtistProfile from "@/app/pages/artist/artist-profile/ArtistProfile";
import { getServerUser } from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export const generateMetadata = async ({ params }) => {
  const { id } = await params;
  try {
    const response = await fetch(
      `${process.env.PROJECT_URL}/api/artists/artist-profile?id=${id}`,
      { next: { revalidate: 0 } }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch artist metadata");
    }

    const { artist } = await response.json();
    const artistName = capitalizeTitle(artist?.stage_name || artist?.name || "Artist");
    return {
      title: `Soundfolio | ${artistName}`,
    };
  } catch (error) {
    console.error("Metadata generation error:", error);
    return { title: "Soundfolio - Artist" };
  }
};

const ArtistProfilePage = async ({ params }) => {
  try {
    const { id } = await params;

    const cookieStore = await cookies();
    const { user } = await getServerUser(cookieStore);

    // Fetch artist profile data
    const url = new URL(`${process.env.PROJECT_URL}/api/artists/artist-profile`);
    url.searchParams.set("id", id);
    if (user?.id) {
      url.searchParams.set("userId", user.id);
    }

    const response = await fetch(url.toString(), {
      next: { revalidate: 0 },
      headers: {
        Cookie: cookieStore.toString(),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch artist: ${response.status}`);
    }

    const { artist } = await response.json();

    if (!artist) {
      throw new Error("Artist not found");
    }

    // Fetch rating insights for this artist
    const ratingInsightsUrl = new URL(
      `${process.env.PROJECT_URL}/api/artists/artist-rating-insights`
    );
    ratingInsightsUrl.searchParams.set("artistId", id);

    let ratingInsights = null;
    try {
      const ratingResponse = await fetch(ratingInsightsUrl.toString(), {
        next: { revalidate: 0 },
        headers: {
          Cookie: cookieStore.toString(),
        },
      });

      if (ratingResponse.ok) {
        const ratingData = await ratingResponse.json();
        ratingInsights = ratingData;
      }
    } catch (error) {
      console.error("Error fetching rating insights:", error);
    }

    // Fetch artist reviews
    const reviewsUrl = new URL(
      `${process.env.PROJECT_URL}/api/artists/artist-reviews`
    );
    reviewsUrl.searchParams.set("artistId", id);

    let reviewsData = null;
    try {
      const reviewsResponse = await fetch(reviewsUrl.toString(), {
        next: { revalidate: 0 },
        headers: {
          Cookie: cookieStore.toString(),
        },
      });

      if (reviewsResponse.ok) {
        const reviewsResult = await reviewsResponse.json();
        reviewsData = reviewsResult.data || [];
      }
    } catch (error) {
      console.error("Error fetching artist reviews:", error);
      reviewsData = [];
    }

    return (
      <ArtistProfile
        data={artist}
        ratingInsights={ratingInsights}
        reviewsData={reviewsData}
      />
    );
  } catch (error) {
    console.error("Artist page error:", error);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl text-red-400 mb-4">Error Loading Artist</h1>
          <p className="text-stone-400">{error.message}</p>
        </div>
      </div>
    );
  }
};

export default ArtistProfilePage;
