import PageNavigation from "@/app/components/buttons/PageNavigation";
import { addProductLinks } from "@/app/localDB/LinksData";

export const metadata = { 
  title : "Soundfolio | Submit Product",
  description : "Submit your product to Soundfolio and reach a wider audience of music producers and enthusiasts. Share your unique sounds, samples, and presets with our vibrant community."
}

const AddProductLayout = ({ children }) => {
  return (
    <div>
      <PageNavigation linksData={addProductLinks} />
      <div>{children}</div>
    </div>
  );
};

export default AddProductLayout;
