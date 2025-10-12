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
    <div className="grid gap-4 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reviewsSlot}
        {ratingsSlot}
        {likesSlot}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {submittedArtistSlot}
        {submittedClubSlot}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      
        {submittedEventsSlot}
       
      </div>
    </div>
  );
};

export default StatisticsLayout;
