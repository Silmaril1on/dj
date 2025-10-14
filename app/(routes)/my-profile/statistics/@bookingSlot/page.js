import Mybookings from '@/app/pages/my-profile-page/statistics/bookings/Mybookings'
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const BookingSlot = async () => {
  try {
    const cookieStore = await cookies();

    // Get all cookies and format them properly
    const cookieHeader = cookieStore
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

    const response = await fetch(
      `${process.env.PROJECT_URL}/api/users/booking-stats`,
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
      console.error("Booking stats API Error:", response.status, errorData);
      throw new Error(errorData.error || "Failed to fetch booking statistics");
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch booking statistics");
    }

    return <Mybookings data={result.data} />;
  } catch (error) {
    console.error("Error fetching booking statistics:", error);
    return <Mybookings data={null} error={error.message} />;
  }
}

export default BookingSlot