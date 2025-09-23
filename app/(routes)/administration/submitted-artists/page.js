import Submittions from "@/app/pages/administration/submittions/Submittions";

const SubmittedArtistsPage = async () => {
  try {
    const response = await fetch(
      `${process.env.PROJECT_URL}/api/admin/submitted-artists`,
      { cache: "no-store" }
    );
    const { submissions } = await response.json();

    return <Submittions submissions={submissions || []} type="artist" />;
  } catch (error) {
    return <Submittions submissions={[]} type="artist" />;
  }
};

export default SubmittedArtistsPage;
