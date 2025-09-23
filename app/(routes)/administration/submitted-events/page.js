import SubmittedEvents from "@/app/pages/administration/submitted-events/SubmittedEvents";

const SubmittedEventsPage = async () => {
  try {
    const response = await fetch(
      `${process.env.PROJECT_URL}/api/admin/submitted-events`,
      { cache: "no-store" }
    );
    const { submissions } = await response.json();

    return <SubmittedEvents submissions={submissions || []} />;
  } catch (error) {
    console.error("Error fetching event submissions:", error);
    return <SubmittedEvents submissions={[]} />;
  }
};

export default SubmittedEventsPage;
