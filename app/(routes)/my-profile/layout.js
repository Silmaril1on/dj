import PageNavigation from "@/app/components/buttons/PageNavigation";
import { userProfileLinks } from "@/app/localDB/LinksData";

const UserProfileLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-black">
      <PageNavigation linksData={userProfileLinks} />
      <div>{children}</div>
    </div>
  );
};

export default UserProfileLayout;
