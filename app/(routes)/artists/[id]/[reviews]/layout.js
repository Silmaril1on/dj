import React from "react";

const ArtistReviewsLayout = ({ children }) => {
  return (
    <div className="flex dark:bg-stone-900 min-h-screen">
      <div className="w-[70%]">{children}</div>
      <h1>some side content here</h1>
    </div>
  );
};

export default ArtistReviewsLayout;
