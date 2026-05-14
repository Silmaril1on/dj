import SingleNews from "@/app/(routes)/news/[slug]/SingleNews";
import { getNewsBySlug } from "@/app/lib/services/news/news";

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
    const result = await getNewsBySlug(params.slug);
    news = result.news || null;
  } catch (err) {
    console.error("Error fetching news:", err.message);
  }

  return <SingleNews news={news} />;
};

export default SingleNewsPage;
