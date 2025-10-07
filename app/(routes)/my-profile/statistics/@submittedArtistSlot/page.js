import SubmittedArtist from "@/app/pages/my-profile-page/statistics/submitted-artist/SubmittedArtist";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const SubmittedArtistsSlot = async () => {
  try {
    const cookieStore = await cookies();

    // Get all cookies and format them properly
    const cookieHeader = cookieStore
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

    const response = await fetch(
      `${process.env.PROJECT_URL}/api/users/submitted-artist`,
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
      throw new Error(errorData.error || "Failed to fetch submitted artists");
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch submitted artists");
    }

    return <SubmittedArtist data={result.data} />;
  } catch (error) {
    console.error("Error fetching submitted artists:", error);
    return <SubmittedArtist data={null} error={error.message} />;
  }
};

export default SubmittedArtistsSlot;
