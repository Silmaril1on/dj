import PageNavigation from "@/app/components/buttons/PageNavigation";
import { administrationLinks } from "@/app/localDB/LinksData";

export const metadata = {
  title: "Admin Panel",
  description: "Administration dashboard for managing the platform",
};

const AdministrationLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-black">
      <PageNavigation linksData={administrationLinks} />
      {children}
    </div>
  );
};

export default AdministrationLayout;
