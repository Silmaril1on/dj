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
    const artistImage = artist?.artist_image || '/assets/default-artist.jpg';
    const artistBio = artist?.bio || `Check out ${artistName} on Soundfolio - DJ profile, events, music, and more.`;
    const pageUrl = `${process.env.PROJECT_URL}/artists/${id}`;

    // Ensure the image URL is absolute
    const absoluteImageUrl = artistImage.startsWith('http') 
      ? artistImage 
      : `${process.env.PROJECT_URL}${artistImage}`;

    return {
      title: `Soundfolio | ${artistName}`,
      description: artistBio.substring(0, 100), // Facebook recommends 155-160 characters
      openGraph: {
        title: `${artistName} - DJ Profile on Soundfolio`,
        description: artistBio.substring(0, 160),
        url: pageUrl,
        siteName: 'Soundfolio',
        images: [
          {
            url: absoluteImageUrl,
            width: 1200,
            height: 630,
            alt: `${artistName} - DJ Profile Picture`,
          },
        ],
        type: 'profile',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${artistName} - DJ Profile on Soundfolio`,
        description: artistBio.substring(0, 160),
        images: [absoluteImageUrl],
      },
    };
  } catch (error) {
    console.error("Metadata generation error:", error);
    return { 
      title: "Soundfolio - Artist",
      description: "Discover amazing DJs and electronic music artists on Soundfolio.",
    };
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

    return <ArtistProfile data={artist} artistId={id} />;
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
