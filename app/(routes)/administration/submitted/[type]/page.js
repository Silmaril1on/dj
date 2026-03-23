import { notFound } from "next/navigation";
import Submittions from "@/app/pages/administration/submittions/Submittions";
import { VALID_SUBMISSION_TYPES } from "@/app/lib/services/admin/submittedData";

export const dynamic = "force-dynamic";

const SubmittedDataPage = async ({ params }) => {
  const { type } = await params;

  if (!VALID_SUBMISSION_TYPES.includes(type)) {
    notFound();
  }

  try {
    const response = await fetch(
      `${process.env.PROJECT_URL}/api/admin/submitted-data/${type}`,
      { cache: "no-store" },
    );
    const { submissions } = await response.json();
    return <Submittions submissions={submissions || []} type={type} />;
  } catch {
    return <Submittions submissions={[]} type={type} />;
  }
};

export default SubmittedDataPage;
