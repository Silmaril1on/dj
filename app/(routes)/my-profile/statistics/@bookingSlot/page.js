import Mybookings from "@/app/(routes)/my-profile/statistics/@bookingSlot/Mybookings";
import { getUserBookingsStats } from "@/app/lib/services/user/statistics/getUserBookingsStats";

export default async function BookingSlot() {
  try {
    const bookings = await getUserBookingsStats();
    return <Mybookings data={bookings} />;
  } catch (error) {
    console.error("Error fetching booking statistics:", error);
    return <Mybookings data={null} error={error.message} />;
  }
}
