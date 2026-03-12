import Reminders from "@/app/pages/my-profile-page/activities/reminders/Reminders";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Profile | Reminders",
  description: "Track events you liked",
};

const RemindersPage = async () => {
  let reminders = [];
  let error = null;

  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map(({ name, value }) => `${name}=${value}`)
      .join("; ");

    const response = await fetch(
      `${process.env.PROJECT_URL}/api/users/event-reminders`,
      {
        headers: {
          Cookie: cookieHeader,
        },
        cache: "no-store",
      },
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Failed to fetch reminders");
    }

    reminders = data.data || [];
  } catch (err) {
    error = err.message || "Failed to fetch reminders";
  }

  return <Reminders reminders={reminders} error={error} />;
};

export default RemindersPage;
