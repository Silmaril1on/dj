import AllFestivals from "@/app/pages/festivals/festivals-page/AllFestivals";

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

  return <AllFestivals initialFestivals={festivals} initialTotal={festivals.length} error={error} />;
};

export default FestivalsPage;