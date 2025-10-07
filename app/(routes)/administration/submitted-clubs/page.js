import Submittions from "@/app/pages/administration/submittions/Submittions";

export const dynamic = "force-dynamic";

const SubmittedClubsPage = async () => {
  try {
    const response = await fetch(
      `${process.env.PROJECT_URL}/api/admin/submitted-clubs`,
      { cache: "no-store" }
    );
    const { submissions } = await response.json();

    return <Submittions submissions={submissions || []} type="club" />;
  } catch (error) {
    console.error("Error fetching club submissions:", error);
    return <Submittions submissions={[]} type="club" />;
  }
};

export default SubmittedClubsPage;
