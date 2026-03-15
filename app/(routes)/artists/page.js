import ProductsPage from "@/app/components/containers/ProductsPage";

export const metadata = {
  title: "Soundfolio | Artists",
  description: "Discover talented artists on Soundfolio.",
};

export const revalidate = 1200;

const ArtistsPage = async () => {
  let artists = [];
  let error = null;

  try {
    const response = await fetch(
      `${process.env.PROJECT_URL}/api/artists/all-artists?limit=30&offset=0`,
      {
        next: { revalidate: 1200, tags: ["artists"] },
      },
    );
    const data = await response.json();

    if (data.error) {
      error = data.error;
    } else {
      artists = data.data || [];
    }
  } catch (err) {
    error = "Failed to load artists";
    console.error("Error fetching artists:", err);
  }

  return (
    <ProductsPage
      type="artists"
      initialData={artists}
      error={error}
      title="All Artists"
      description="Discover talented artists from around the world."
    />
  );
};

export default ArtistsPage;
