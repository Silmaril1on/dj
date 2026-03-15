import { notFound } from "next/navigation";
import ProductsPage from "@/app/components/containers/ProductsPage";
import { CATEGORY_CONFIGS, VALID_CATEGORIES } from "../categoryConfigs";

export const revalidate = 1200;

export function generateStaticParams() {
  return VALID_CATEGORIES.map((category) => ({ category }));
}

export async function generateMetadata({ params }) {
  const { category } = await params;
  return CATEGORY_CONFIGS[category]?.metadata.list || {};
}

const CategoryListingPage = async ({ params }) => {
  const { category } = await params;

  if (!VALID_CATEGORIES.includes(category)) {
    notFound();
  }

  const config = CATEGORY_CONFIGS[category].listing;

  try {
    const response = await fetch(
      config.apiEndpoint(process.env.PROJECT_URL),
      config.fetchOptions,
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch ${category}`);
    }

    const result = await response.json();
    const data = config.extractData(result);

    return (
      <ProductsPage
        type={category}
        initialData={data}
        title={config.title}
        description={config.description}
      />
    );
  } catch (error) {
    return (
      <ProductsPage
        type={category}
        initialData={[]}
        error={error.message}
        title={config.title}
        description={config.description}
      />
    );
  }
};

export default CategoryListingPage;
