import UsersReviewPage from "@/app/pages/my-profile-page/activities/reviews/UsersReviewPage";
import { cookies } from "next/headers";

export const metadata = {
  title: "My Profile | Reviews",
  description: "My Reviews",
};

const ActivityReviewsPage = async ({ searchParams }) => {
  let reviewsData = null;
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
    const apiUrl = `${process.env.PROJECT_URL}/api/users/review-stats/user-reviews?page=${page}&limit=${limit}`;

    const response = await fetch(apiUrl, {
      cache: "no-store",
      headers: {
        Cookie: cookieHeader,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to fetch user reviews");
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch user reviews");
    }

    reviewsData = result.data;
  } catch (err) {
    console.error("Error fetching user reviews:", err);
    error = err.message || "Failed to fetch reviews data";
  }

  // Await searchParams again for the currentPage prop
  const resolvedSearchParamsForRender = await searchParams;

  return (
    <UsersReviewPage
      reviewsData={reviewsData}
      error={error}
      currentPage={parseInt(resolvedSearchParamsForRender?.page) || 1}
    />
  );
};

export default ActivityReviewsPage;
