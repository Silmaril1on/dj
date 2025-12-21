import SubmittedEvents from "@/app/pages/my-profile-page/statistics/submitted-events/SubmittedEvents";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const SubmittedEventsSlot = async () => {
  try {
    const cookieStore = await cookies();

    const cookieHeader = cookieStore
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

    const response = await fetch(
      `${process.env.PROJECT_URL}/api/users/statistics`,
      {
        cache: "no-store",
        headers: {
          Cookie: cookieHeader,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Statistics API Error:", response.status, errorData);
      throw new Error(
        errorData.error || "Failed to fetch statistics"
      );
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch statistics");
    }

    // Extract only submitted events data for this slot
    return <SubmittedEvents data={result.data.submittedEvents} />;
  } catch (error) {
    console.error("Error fetching submitted events stats:", error);
    return <SubmittedEvents data={null} error={error.message} />;
  }
};

export default SubmittedEventsSlot;
