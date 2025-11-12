import AllDataPage from "@/app/pages/all-data-page/AllDataPage";

export const metadata = {
  title: "Soundfolio | Festivals",
  description: "Discover music festivals on Soundfolio.",
}

const FestivalsPage = async () => {
  let festivals = [];
  let error = null;

  try {
    const response = await fetch(
      `${process.env.PROJECT_URL}/api/festivals/all-festivals?limit=20&offset=0`,
      { cache: "no-store" }
    );
    const data = await response.json();
    
    if (data.error) {
      error = data.error;
    } else {
      festivals = data.data || [];
    }
  } catch (err) {
    error = "Failed to load festivals";
    console.error("Error fetching festivals:", err);
  }

  return (
    <AllDataPage 
      type="festivals"
      initialData={festivals}
      error={error}
      title="All Festivals"
      description="Discover music festivals from around the world."
    />
  );
};

export default FestivalsPage;