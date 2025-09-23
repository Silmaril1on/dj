import React from "react";

export const metadata = {
  title: "My Profile | Statistics",
  description: "Statistics",
};

const StatisticsLayout = ({
  ratingsSlot,
  reviewsSlot,
  likesSlot,
  submittedArtistSlot,
  submittedClubSlot,
  submittedEventsSlot,
}) => {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-3">
        {reviewsSlot}
        {ratingsSlot}
        {likesSlot}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3">
        {submittedArtistSlot}
        {submittedClubSlot}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3">
        <div className="border">
          <h1>some content</h1>
        </div>
        {submittedEventsSlot}
        <div className="border">
          <h1>some content</h1>
        </div>
      </div>
    </div>
  );
};

export default StatisticsLayout;
