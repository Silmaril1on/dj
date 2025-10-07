import SideContent from "@/app/pages/my-profile-page/activities/side-content/SideContent";
import React from "react";

const ArtistReviewsLayout = async ({ children }) => {
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
    <div className="flex dark:bg-stone-900 min-h-screen">
      <div className="w-[70%]">{children}</div>
      <div className="w-[30%] h-fit sticky top-0 overflow-hidden">
        <SideContent
          thisWeek={data.thisWeek}
          previousWeek={data.previousWeek}
        />
      </div>
    </div>
  );
};

export default ArtistReviewsLayout;
