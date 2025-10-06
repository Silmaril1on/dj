import SingleNews from "@/app/pages/news/single-news-page/SingleNews";

export const metadata = {
  title: "Soundfolio | News",
  description:
    "Stay updated with the latest news and announcements from Soundfolio. Explore articles, updates, and insights about our platform and the broader music industry.",
};

const SingleNewsPage = async (props) => {
  const params = await props.params;
  let news = null;

  try {
    const res = await fetch(
      `${process.env.PROJECT_URL}/api/admin/news/single-news?id=${params.id}`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`Failed to fetch news: ${res.status}`);
    const data = await res.json();
    news = data.news || null;
  } catch (err) {
    console.error("Error fetching news:", err.message);
  }

  return <SingleNews news={news} />;
};

export default SingleNewsPage;
