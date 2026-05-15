import Reports from "@/app/(routes)/administration/reports/Reports";
import { getReports } from "@/app/lib/services/admin/reports/bugsAndFeedbacks";

export const dynamic = "force-dynamic";

export default async function BugsSlot() {
  let reports = [];
  try {
    reports = await getReports();
  } catch (e) {
    console.error("[BugsSlot]", e);
  }
  return <Reports data={reports} type="report" />;
}
