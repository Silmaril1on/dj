import { notFound } from "next/navigation";
import { VALID_TYPES } from "./dataTypeConfigs";
import SubmitDataPage from "./SubmitDataPage";

export function generateStaticParams() {
  return VALID_TYPES.map((type) => ({ type }));
}

export async function generateMetadata({ params }) {
  const { type } = await params;
  if (!VALID_TYPES.includes(type)) return {};

  const label = type.charAt(0).toUpperCase() + type.slice(1);
  return {
    title: `Soundfolio | Submit ${label}`,
    description: `Submit a new ${type} to Soundfolio and reach a wider audience of music producers and enthusiasts.`,
  };
}

const AddProductPage = async ({ params }) => {
  const { type } = await params;

  if (!VALID_TYPES.includes(type)) {
    notFound();
  }

  return <SubmitDataPage type={type} />;
};

export default AddProductPage;
