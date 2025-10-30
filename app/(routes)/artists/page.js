import AllArtists from "@/app/pages/artist/artist-page/AllArtists";
import React from "react";

export const metadata = {
  title: "Soundfolio | Artists",
  description: "Discover talented artists on Soundfolio.",
}

const ArtistsPage = async () => {
  let artists = [];
  let error = null;

  try {
    const response = await fetch(
      `${process.env.PROJECT_URL}/api/artists/all-artists?limit=20&offset=0`,
      { cache: "no-store" }
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

  return <AllArtists artists={artists} error={error} />;
};

export default ArtistsPage;
