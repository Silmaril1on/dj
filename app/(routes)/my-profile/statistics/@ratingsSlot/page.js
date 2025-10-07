import RatingsStats from "@/app/pages/my-profile-page/statistics/ratings/RatingsStats";
import { headers, cookies } from "next/headers";

export const dynamic = "force-dynamic";

const RatingsStatsSlot = async () => {
  try {
    const cookieStore = await cookies();

    // Get all cookies and format them properly
    const cookieHeader = cookieStore
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

    const response = await fetch(
      `${process.env.PROJECT_URL}/api/users/rate-stats`,
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
      throw new Error(errorData.error || "Failed to fetch rating statistics");
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch rating statistics");
    }

    return <RatingsStats data={result.data} />;
  } catch (error) {
    console.error("Error fetching rating statistics:", error);
    return <RatingsStats data={null} error={error.message} />;
  }
};

export default RatingsStatsSlot;
