import React from "react";

export const dynamic = "force-dynamic";

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
  bookingSlot,
  submittedFestivalSlot,
}) => {
  return (
    <div className="grid gap-4 p-3 lg:p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reviewsSlot}
        {ratingsSlot}
        {likesSlot}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {submittedArtistSlot}
        {submittedClubSlot}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {submittedEventsSlot}
        {bookingSlot}
        {submittedFestivalSlot}
      </div>
    </div>
  );
};

export default StatisticsLayout;
