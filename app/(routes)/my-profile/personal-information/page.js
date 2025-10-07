import { getServerUser } from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";
import MyProfile from "@/app/pages/my-profile-page/user-profile/MyProfile";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Profile | Personal Information",
  description: "Personal Information",
};

const ProfilePageSlot = async () => {
  const cookieStore = await cookies();
  const { user, error } = await getServerUser(cookieStore);

  if (!user || error) {
    redirect("/auth/login");
  }

  return <MyProfile profile={user} error={null} />;
};

export default ProfilePageSlot;
