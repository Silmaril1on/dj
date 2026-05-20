import React from "react";
import TrackListAnimation from "./TrackListAnimation";
import Twinkles from "./components/Twinkles";

const BrandingPage = () => {
  return (
    <div className="center bg-black relative bo">
      <Twinkles />
      <TrackListAnimation tracklist={true} />
      {/* <PosterTool /> */}
    </div>
  );
};

export default BrandingPage;
