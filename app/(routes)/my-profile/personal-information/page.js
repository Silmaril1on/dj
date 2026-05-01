import { redirect } from "next/navigation";
import { getProfile } from "@/app/lib/services/user/profile/getProfile";
import MyProfile from "./(components/MyProfile";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Soundfolio | Personal Information",
  description:
    "Manage your Soundfolio profile — update your name, avatar, bio, and personal details.",
};

const ProfilePageSlot = async () => {
  const { user, error } = await getProfile();

  if (!user || error) {
    redirect("/auth/login");
  }

  return <MyProfile initialProfile={user} />;
};

export default ProfilePageSlot;
