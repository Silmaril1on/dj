import SideContent from "@/app/pages/my-profile-page/activities/side-content/SideContent";
import React from "react";

export const dynamic = "force-dynamic";

export default async function DefaultSideSection() {
  const res = await fetch(
    `${process.env.PROJECT_URL}/api/users/side-top-stats`,
    {
      cache: "no-store",
    }
  );

  if (!res.ok) {
    return <div className="p-4">Failed to load data</div>;
  }

  const { data } = await res.json();

  return (
      <SideContent thisWeek={data.thisWeek} previousWeek={data.previousWeek} />
  );
}
