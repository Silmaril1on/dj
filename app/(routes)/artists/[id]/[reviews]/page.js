import ArtistReviews from "@/app/pages/artist/artist-reviews/ArtistReviews";

const ArtistReviewsPage = async ({ params }) => {
  const { id } = await params;

  const response = await fetch(
    `${process.env.PROJECT_URL}/api/artists/review?artistId=${id}`,
    {
      cache: "no-store",
    }
  );
  const { artist, reviews, error } = await response.json();

  return <ArtistReviews artist={artist} data={reviews} error={error} />;
};

export default ArtistReviewsPage;
