import AllNews from "@/app/(routes)/news/AllNews";
import { getLimitedNews } from "@/app/lib/services/news/news";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Soundfolio | News",
  description:
    "Stay updated with the latest news and updates from Soundfolio. Explore articles, announcements, and insights about our platform and the music industry.",
};

const AllNewsPage = async () => {
  let news = [];
  try {
    const result = await getLimitedNews({ limit: 20, offset: 0 });
    news = result.data || [];
  } catch (error) {
    console.error("Failed to fetch news:", error);
  }

  return <AllNews news={news} />;
};

export default AllNewsPage;
