import ArtistReviews from "./ArtistReviews";

export async function generateMetadata({ params }) {
  const { slug } = await params;

  const res = await fetch(
    `${process.env.PROJECT_URL}/api/artists/artist-profile?slug=${slug}`,
    {
      next: { revalidate: 172800 },
    },
  );

  const { artist } = await res.json();
  const artistName = artist?.stage_name || artist?.name || "Artist";

  return {
    title: `${artistName} | User Reviews`,
    description: `Read what people are saying about ${artistName}.`,
  };
}

const ArtistReviewsPage = async ({ params }) => {
  const { slug } = await params;

  const response = await fetch(
    `${process.env.PROJECT_URL}/api/artists/review?artistSlug=${slug}&limit=20&page=1`,
    { cache: "no-store" },
  );
  const { artist, reviews, error, pagination } = await response.json();

  return (
    <ArtistReviews
      artist={artist}
      data={reviews}
      error={error}
      pagination={pagination}
      artistId={artist?.id}
    />
  );
};

export default ArtistReviewsPage;
