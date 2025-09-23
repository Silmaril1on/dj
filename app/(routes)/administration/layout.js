import PageNavigation from "@/app/components/buttons/PageNavigation";
import { administrationLinks } from "@/app/localDB/LinksData";

const AdministrationLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-black">
      <PageNavigation linksData={administrationLinks} />
      <div>{children}</div>
    </div>
  );
};

export default AdministrationLayout;
