import Submittions from "@/app/pages/administration/submittions/Submittions";

export const dynamic = "force-dynamic";

const SubmittedEventsPage = async () => {
  try {
    const response = await fetch(
      `${process.env.PROJECT_URL}/api/admin/submitted-events`,
      { cache: "no-store" }
    );
    const { submissions } = await response.json();

    return <Submittions submissions={submissions || []} type="event" />;
  } catch (error) {
    console.error("Error fetching event submissions:", error);
    return <Submittions submissions={[]} type="event" />;
  }
};

export default SubmittedEventsPage;
