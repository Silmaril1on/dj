import SubmittedClub from "@/app/pages/my-profile-page/statistics/submitted-club/SubmitttedClub";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const SubmittedClubsSlot = async () => {
  try {
    const cookieStore = await cookies();

    // Get all cookies and format them properly
    const cookieHeader = cookieStore
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

    const response = await fetch(
      `${process.env.PROJECT_URL}/api/users/submitted-club`,
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
      throw new Error(errorData.error || "Failed to fetch submitted clubs");
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch submitted clubs");
    }

    return <SubmittedClub data={result.data} />;
  } catch (error) {
    console.error("Error fetching submitted clubs:", error);
    return <SubmittedClub data={null} error={error.message} />;
  }
};

export default SubmittedClubsSlot;
