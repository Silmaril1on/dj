import ClubProfile from '@/app/pages/club/club-profile-page/ClubProfile'
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Soundfolio | Club Details", 
  description: "Club details page",
}

const ClubProfilePage = async ({ params }) => {
  const { id } = await params;
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  const res = await fetch(`${process.env.PROJECT_URL}/api/club/${id}`, {
    headers: {
      Cookie: cookieHeader,
    },
    cache: "no-store",
  });
  const { club, currentUserId, clubSchedule } = await res.json();


  return (
    <ClubProfile club={club} currentUserId={currentUserId} clubSchedule={clubSchedule} />
  );
}

export default ClubProfilePage;