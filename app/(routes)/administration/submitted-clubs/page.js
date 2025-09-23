import SubmittedClubs from "@/app/pages/administration/submitted-clubs/SubmittedClubs";

const SubmittedClubsPage = async () => {
  try {
    const response = await fetch(
      `${process.env.PROJECT_URL}/api/admin/submitted-clubs`,
      { cache: "no-store" }
    );
    const { submissions } = await response.json();

    return <SubmittedClubs submissions={submissions || []} />;
  } catch (error) {
    console.error("Error fetching club submissions:", error);
    return <SubmittedClubs submissions={[]} />;
  }
};

export default SubmittedClubsPage;
