import ReviewsStats from "@/app/pages/my-profile-page/statistics/reviews/ReviewsStats";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const ReviewsStatsSlot = async () => {
  try {
    const cookieStore = await cookies();

    // Get all cookies and format them properly
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
      throw new Error(errorData.error || "Failed to fetch statistics");
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch statistics");
    }

    // Extract only reviews data for this slot
    return <ReviewsStats data={result.data.reviews} />;
  } catch (error) {
    console.error("Error fetching reviews statistics:", error);
    return <ReviewsStats data={null} error={error.message} />;
  }
};

export default ReviewsStatsSlot;
