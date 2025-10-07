import AllNews from '@/app/pages/news/AllNews'

export const dynamic = "force-dynamic";

export const metadata = { 
  title: "Soundfolio | News",
  description: "Stay updated with the latest news and updates from Soundfolio. Explore articles, announcements, and insights about our platform and the music industry."
}

const AllNewsPage = async () => {
  let news = [];
  try {
    const res = await fetch(`${process.env.PROJECT_URL}/api/admin/news?limit=15`, {
      cache: 'no-store'
    });
    const data = await res.json();
    news = data.news || [];
  } catch (error) {
    console.error('Failed to fetch news:', error);
  }

  return <AllNews news={news} />;
}

export default AllNewsPage