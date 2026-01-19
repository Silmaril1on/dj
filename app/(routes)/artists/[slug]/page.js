import { capitalizeTitle } from "@/app/helpers/utils";
import ArtistProfile from "@/app/pages/artist/artist-profile/ArtistProfile";
import { getServerUser } from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export const generateMetadata = async ({ params }) => {
  const { slug } = await params;
  try {
    const response = await fetch(
      `${process.env.PROJECT_URL}/api/artists/artist-profile?slug=${slug}`,
      { next: { revalidate: 0 } },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch artist metadata");
    }

    const { artist } = await response.json();
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

    // Fetch artist profile data
    const url = new URL(
      `${process.env.PROJECT_URL}/api/artists/artist-profile`,
    );
    url.searchParams.set("slug", slug);
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
