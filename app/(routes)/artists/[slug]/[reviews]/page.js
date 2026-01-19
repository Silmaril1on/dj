import ArtistReviews from "@/app/pages/artist/artist-reviews/ArtistReviews";

export async function generateMetadata({ params }) {
  const { slug } = await params;

  const response = await fetch(
    `${process.env.PROJECT_URL}/api/artists/review?artistSlug=${slug}&limit=10&page=1`,
    { cache: "no-store" }
  );
  const { artist } = await response.json();

  return {
    title: `${artist?.stage_name || artist?.name} | User Reviews`,
    description: `Read what people are saying about ${artist?.name}.`,
  };
}

const ArtistReviewsPage = async ({ params }) => {
  const { slug } = await params;

  const response = await fetch(
    `${process.env.PROJECT_URL}/api/artists/review?artistSlug=${slug}&limit=20&page=1`,
    { cache: "no-store" }
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
