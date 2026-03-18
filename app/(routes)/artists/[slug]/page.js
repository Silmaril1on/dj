import ArtistProfile from "./ArtistProfile";
import { capitalizeTitle } from "@/app/helpers/utils";
import { getServerUser } from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";
import { cache } from "react";
import { getArtistProfile } from "@/app/lib/services/artists/artistProfile";
import { getArtistLikesCount } from "@/app/lib/services/artists/artistLikes";
import { getArtistScheduleCount } from "@/app/lib/services/artists/artistSchedule";
import { getArtistUserData } from "@/app/lib/services/artists/getArtistUserData";

const getProfile = cache(getArtistProfile);

export const generateMetadata = async ({ params }) => {
  const { slug } = await params;
  try {
    const artist = await getProfile(slug);
    const artistName = capitalizeTitle(
      artist?.stage_name || artist?.name || "Artist",
    );
    const description =
      artist?.bio?.substring(0, 160) ||
      `Check out ${artistName} on Soundfolio - DJ profile, music, events, and more.`;
    const artistImage =
      artist?.artist_image ||
      `${process.env.PROJECT_URL}/assets/default-artist.jpg`;

    return {
      title: `Soundfolio | ${artistName}`,
      description,
      openGraph: {
        title: `${artistName} | Soundfolio`,
        description,
        type: "profile",
        url: `${process.env.PROJECT_URL}/artists/${slug}`,
        images: [
          { url: artistImage, width: 1200, height: 630, alt: artistName },
        ],
        siteName: "Soundfolio",
      },
      twitter: {
        card: "summary_large_image",
        title: `${artistName} | Soundfolio`,
        description,
        images: [artistImage],
      },
    };
  } catch (error) {
    console.error("Metadata generation error:", error);
    return { title: "Soundfolio - Artist" };
  }
};

const ArtistProfilePage = async ({ params }) => {
  try {
    const { slug } = await params;
    const cookieStore = await cookies();
    const { user } = await getServerUser(cookieStore);
    const artist = await getProfile(slug);

    const [likesCount, scheduleCount, userSpecificData] = await Promise.all([
      getArtistLikesCount(artist.id),
      getArtistScheduleCount(artist.id),
      user ? getArtistUserData(artist.id, user.id) : Promise.resolve(null),
    ]);

    const enrichedArtist = {
      ...artist,
      likesCount,
      scheduleCount,
      isLiked: userSpecificData?.isLiked ?? false,
      userRating: userSpecificData?.userRating ?? null,
      userSubmittedArtistId: user?.submitted_artist_id ?? null,
    };

    return <ArtistProfile data={enrichedArtist} artistId={artist.id} />;
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
