import SideContent from "@/app/(routes)/my-profile/activities/(components)/SideContent";
import { getSideTopStats } from "@/app/lib/services/user/get-stats/getSideTopStats";
import React from "react";

export const dynamic = "force-dynamic";

export default async function DefaultSideSection() {
  try {
    const data = await getSideTopStats();
    return (
      <SideContent thisWeek={data.thisWeek} previousWeek={data.previousWeek} />
    );
  } catch {
    return <div className="p-4 text-chino/60 text-sm">Stats unavailable</div>;
  }
}
