import ProductsPage from "@/app/components/containers/ProductsPage";
import { getAllArtists } from "@/app/lib/services/artists/getAllArtists";

export const metadata = {
  title: "Soundfolio | Artists",
  description: "Discover talented artists on Soundfolio.",
};

export const revalidate = 1200;

const ArtistsPage = async () => {
  let artists = [];
  let error = null;

  try {
    const result = await getAllArtists({ limit: 30, offset: 0 });
    artists = result.data || [];
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
