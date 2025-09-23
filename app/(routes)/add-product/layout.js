import PageNavigation from "@/app/components/buttons/PageNavigation";
import { addProductLinks } from "@/app/localDB/LinksData";

const AddProductLayout = ({ children }) => {
  return (
    <div>
      <PageNavigation linksData={addProductLinks} />
      <div>{children}</div>
    </div>
  );
};

export default AddProductLayout;
