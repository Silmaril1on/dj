"use client";
import { useState } from "react";
import useRecentlyViewed from "@/app/lib/hooks/useRecentlViewed";
import Albums from "@/app/(routes)/artists/[slug]/(components)/Albums";
import ArtistInsight from "@/app/(routes)/artists/[slug]/(components)/ArtistInsight";
import Bio from "@/app/(routes)/artists/[slug]/(components)/Bio";
import Avatar from "@/app/(routes)/artists/[slug]/(components)/(hero-components)/Avatar";
import BasicInfo from "@/app/(routes)/artists/[slug]/(components)/(hero-components)/BasicInfo";
import ArtistSchedule from "@/app/(routes)/artists/[slug]/(components)/ArtistSchedule";
import RelatedArtists from "./(components)/RelatedArtists";

const ArtistProfile = ({ data, artistId }) => {
  const id = artistId || data?.id;
  const [likesCount, setLikesCount] = useState(data.likesCount || 0);
  const [isLiked, setIsLiked] = useState(data.isLiked || false);

  useRecentlyViewed("artist", id);

  const handleLikeChange = (updatedIsLiked, updatedLikesCount) => {
    setIsLiked(updatedIsLiked);
    setLikesCount(updatedLikesCount);
  };

  const updatedData = { ...data, likesCount, isLiked };

  return (
    <div className="min-h-screen">
      <div className="grid lg:grid-cols-2 gap-2 lg:gap-5 items-center min-h-[80vh] p-3 lg:p-5 relative">
        <div className="absolute -z-[1] inset-0 bg-[radial-gradient(circle_at_center,rgb(255_215_0_/_0.2)_2%,rgb(255_215_0_/_0.04)_20%)]" />
        <Avatar data={updatedData} onLikeChange={handleLikeChange} />
        <BasicInfo data={updatedData} />
      </div>
      <Bio data={data} />
      <ArtistSchedule artistId={id} artistData={data} />
      <Albums artistId={id} />
      <ArtistInsight artistId={id} slug={data?.artist_slug} />
      <RelatedArtists artistId={id} genres={data?.genres} />
    </div>
  );
};

export default ArtistProfile;
