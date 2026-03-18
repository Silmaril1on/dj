import { redirect } from "next/navigation";
import { getProfile } from "@/app/lib/services/user/profile/getProfile";
import MyProfile from "./(components/MyProfile";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Profile | Personal Information",
  description: "Personal Information",
};

const ProfilePageSlot = async () => {
  const { user, error } = await getProfile();

  if (!user || error) {
    redirect("/auth/login");
  }

  return <MyProfile initialProfile={user} />;
};

export default ProfilePageSlot;
