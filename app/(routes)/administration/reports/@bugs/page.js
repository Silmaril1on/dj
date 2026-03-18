import Reports from "@/app/pages/administration/reports/Reports";
import { cookies } from "next/headers";
import { getBugReports } from "@/app/lib/services/admin/reports/bugsAndFeedbacks";

export const dynamic = "force-dynamic";

export default async function BugsSlot() {
  let reports = [];
  try {
    reports = await getBugReports();
  } catch {}
  return <Reports data={reports} type="bug" />;
}
