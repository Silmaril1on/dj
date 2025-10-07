import UserRatingsPage from "@/app/pages/my-profile-page/activities/ratings/UserRatingsPage";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Profile | Ratings",
  description: "My Ratings",
};

const ActivitiesRatingsPage = async ({ searchParams }) => {
  let ratingsData = null;
  let error = null;

  try {
    // Await searchParams in newer Next.js versions
    const resolvedSearchParams = await searchParams;
    const page = parseInt(resolvedSearchParams?.page) || 1;
    const limit = 20;

    const cookieStore = await cookies();

    // Get all cookies and format them properly
    const cookieHeader = cookieStore
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

    // Build the API URL with search parameters
    const apiUrl = `${process.env.PROJECT_URL}/api/users/rate-stats/user-rates?page=${page}&limit=${limit}`;

    const response = await fetch(apiUrl, {
      cache: "no-store",
      headers: {
        Cookie: cookieHeader,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to fetch user ratings");
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch user ratings");
    }

    ratingsData = result.data;
  } catch (err) {
    console.error("Error fetching user ratings:", err);
    error = err.message || "Failed to fetch ratings data";
  }

  // Await searchParams again for the currentPage prop
  const resolvedSearchParamsForRender = await searchParams;

  return (
    <UserRatingsPage
      ratingsData={ratingsData}
      error={error}
      currentPage={parseInt(resolvedSearchParamsForRender?.page) || 1}
    />
  );
};

export default ActivitiesRatingsPage;
