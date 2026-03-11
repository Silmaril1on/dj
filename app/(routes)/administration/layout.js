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
      <div className="flex gap-3">
        <div className="w-[70%]">{children}</div>
        <div className="p-3"></div>
      </div>
    </div>
  );
};

export default AdministrationLayout;
