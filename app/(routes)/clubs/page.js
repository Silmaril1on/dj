import AllDataPage from "@/app/pages/all-data-page/AllDataPage";

export const revalidate = 1200;

export const metadata = {
  title: "Soundfolio | Clubs",
  description:
    "Discover and explore various clubs on Soundfolio. Join communities that share your musical interests and connect with like-minded individuals.",
};

const ClubsPage = async () => {
  try {
    const response = await fetch(
      `${process.env.PROJECT_URL}/api/club?limit=30&offset=0`,
      {
        next: { revalidate: 1200, tags: ["clubs"] },
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Failed to fetch clubs");
    }

    const result = await response.json();
    const clubs = result?.data || [];
    return (
      <AllDataPage
        type="clubs"
        initialData={clubs}
        title="All Clubs"
        description="Discover the best clubs around the world."
      />
    );
  } catch (error) {
    return (
      <AllDataPage
        type="clubs"
        initialData={[]}
        error={error.message}
        title="All Clubs"
        description="Discover the best clubs around the world."
      />
    );
  }
};

export default ClubsPage;
