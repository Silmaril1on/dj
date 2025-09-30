import Reports from "@/app/pages/administration/reports/Reports";

export default async function BugsSlot() {
  let reports = [];
  try {
    const res = await fetch(`${process.env.PROJECT_URL}/api/reports/bug`, { cache: "no-store" });
    const data = await res.json();
    if (data.reports) reports = data.reports;
  } catch {}
  return <Reports data={reports} type="bug" />;
}