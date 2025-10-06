import MyEvents from '@/app/pages/my-profile-page/activities/events/MyEvents'
import { cookies } from "next/headers";

export const metadata = {
  title: "My Profile | Events",
  description: "my events"
}

const MyEventsPage = async () => {
  let allEvents = [];
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map(({ name, value }) => `${name}=${value}`)
      .join("; ");

    const res = await fetch(`${process.env.PROJECT_URL}/api/users/submitted-event/all-events`, {
      headers: {
        Cookie: cookieHeader,
      },
      cache: "no-store",
    });
    const data = await res.json();
    if (data.success) {
      allEvents = data.data.allEvents;
    }
  } catch (err) {
    // handle error or leave allEvents as []
  }

  return (
    <MyEvents events={allEvents} />
  );
}

export default MyEventsPage