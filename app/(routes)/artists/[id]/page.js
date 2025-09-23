import { capitalizeTitle } from "@/app/helpers/utils";
import ArtistProfile from "@/app/pages/artist/artist-profile/ArtistProfile";
import { getServerUser } from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";

export const generateMetadata = async ({ params }) => {
  const { id } = await params;
  try {
    const response = await fetch(
      `${process.env.PROJECT_URL}/api/artists/artist-profile?id=${id}`,
      { cache: "no-store" }
    );
    const { artist } = await response.json();
    const artistName = capitalizeTitle(artist.stage_name || artist.name);
    return {
      title: `DJDB | ${artistName}`,
    };
  } catch (error) {
    return { title: "DJDB - Artist" };
  }
};

const ArtistProfilePage = async ({ params }) => {
  const { id } = await params;

  const cookieStore = await cookies();
  const { user } = await getServerUser(cookieStore);

  const url = new URL(`${process.env.PROJECT_URL}/api/artists/artist-profile`);
  url.searchParams.set("id", id);
  if (user?.id) {
    url.searchParams.set("userId", user.id);
  }

  const response = await fetch(url.toString(), { cache: "no-store" });
  const { artist } = await response.json();

  // Fetch rating insights for this artist
  const ratingInsightsUrl = new URL(
    `${process.env.PROJECT_URL}/api/artists/artist-rating-insights`
  );
  ratingInsightsUrl.searchParams.set("artistId", id);

  let ratingInsights = null;
  try {
    const ratingResponse = await fetch(ratingInsightsUrl.toString(), {
      cache: "no-store",
    });
    const ratingData = await ratingResponse.json();
    ratingInsights = ratingData;
  } catch (error) {
    console.error("Error fetching rating insights:", error);
  }

  return <ArtistProfile data={artist} ratingInsights={ratingInsights} />;
};

export default ArtistProfilePage;
