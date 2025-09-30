import Clubs from "@/app/pages/club/clubs-page/Clubs";

const ClubsPage = async () => {
  const res = await fetch(`${process.env.PROJECT_URL}/api/club`, { cache: "no-store" });
  const { data } = await res.json();

  return <Clubs clubs={data || []} />;
};

export default ClubsPage;
