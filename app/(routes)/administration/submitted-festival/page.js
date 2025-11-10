import Submittions from "@/app/pages/administration/submittions/Submittions";

export const dynamic = "force-dynamic";

const SubmittedFestivalPage = async () => {
  try {
    const response = await fetch(
      `${process.env.PROJECT_URL}/api/admin/submitted-festival`,
      { cache: "no-store" }
    );
    const { submissions } = await response.json();

    return <Submittions submissions={submissions || []} type="festival" />;
  } catch (error) {
    console.error("Error fetching festival submissions:", error);
    return <Submittions submissions={[]} type="festival" />;
  }
};

export default SubmittedFestivalPage;