import { capitalizeTitle } from "@/app/helpers/utils";
import { getServerUser } from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";
import { cache } from "react";
import ArtistProfile from "./ArtistProfile";

export const dynamic = "force-dynamic";

const getArtistProfile = cache(async ({ slug, cookieStore, userId }) => {
  const url = new URL(`${process.env.PROJECT_URL}/api/artists/artist-profile`);
  url.searchParams.set("slug", slug);
  if (userId) {
    url.searchParams.set("userId", userId);
  }

  const response = await fetch(url.toString(), {
    next: {
      revalidate: 1200,
      tags: ["artists", "artist-likes", `artist-${slug}`],
    },
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

  return artist;
});

export const generateMetadata = async ({ params }) => {
  const { slug } = await params;
  try {
    const cookieStore = await cookies();
    const { user } = await getServerUser(cookieStore);
    const artist = await getArtistProfile({
      slug,
      cookieStore,
      userId: user?.id,
    });
    const artistName = capitalizeTitle(
      artist?.stage_name || artist?.name || "Artist",
    );
    const description =
      artist?.bio?.substring(0, 160) ||
      `Check out ${artistName} on Soundfolio - DJ profile, music, events, and more.`;
    const artistImage =
      artist?.image || `${process.env.PROJECT_URL}/assets/default-artist.jpg`;

    return {
      title: `Soundfolio | ${artistName}`,
      description,
      openGraph: {
        title: `${artistName} | Soundfolio`,
        description,
        type: "profile",
        url: `${process.env.PROJECT_URL}/artists/${slug}`,
        images: [
          {
            url: artistImage,
            width: 1200,
            height: 630,
            alt: artistName,
          },
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
    return {
      title: "Soundfolio - Artist",
    };
  }
};

const ArtistProfilePage = async ({ params }) => {
  try {
    const { slug } = await params;
    const cookieStore = await cookies();
    const { user } = await getServerUser(cookieStore);

    const artist = await getArtistProfile({
      slug,
      cookieStore,
      userId: user?.id,
    });

    return <ArtistProfile data={artist} artistId={artist.id} />;
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
