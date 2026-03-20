import SingleNews from "@/app/(routes)/news/[id]/SingleNews";
import { getNewsById } from "@/app/lib/services/news/news";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Soundfolio | News",
  description:
    "Stay updated with the latest news and announcements from Soundfolio. Explore articles, updates, and insights about our platform and the broader music industry.",
};

const SingleNewsPage = async (props) => {
  const params = await props.params;
  let news = null;

  try {
    const result = await getNewsById(params.id);
    news = result.news || null;
  } catch (err) {
    console.error("Error fetching news:", err.message);
  }

  return <SingleNews news={news} />;
};

export default SingleNewsPage;
