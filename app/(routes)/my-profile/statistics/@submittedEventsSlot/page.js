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
      `${process.env.PROJECT_URL}/api/users/submitted-event`,
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
      console.error("API Error:", response.status, errorData);
      throw new Error(
        errorData.error || "Failed to fetch submitted events stats"
      );
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch submitted events stats");
    }

    return <SubmittedEvents data={result.data} />;
  } catch (error) {
    console.error("Error fetching submitted events stats:", error);
    return <SubmittedEvents data={null} error={error.message} />;
  }
};

export default SubmittedEventsSlot;
