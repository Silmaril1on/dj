import { notFound } from "next/navigation";
import { SUPPORT_PAGE_CONFIGS, VALID_SUPPORT_PAGES } from "../supportConfigs";
import LegalPage from "./LegalPage";

export function generateStaticParams() {
  return VALID_SUPPORT_PAGES.map((support) => ({ support }));
}

export async function generateMetadata({ params }) {
  const { support } = await params;
  if (!VALID_SUPPORT_PAGES.includes(support)) return {};
  return SUPPORT_PAGE_CONFIGS[support].metadata;
}

const SupportPage = async ({ params }) => {
  const { support } = await params;
  if (!VALID_SUPPORT_PAGES.includes(support)) notFound();
  const { dataKey } = SUPPORT_PAGE_CONFIGS[support];
  return <LegalPage type={dataKey} />;
};

export default SupportPage;
