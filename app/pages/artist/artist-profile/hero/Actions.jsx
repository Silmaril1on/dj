"use client";
import { useDispatch, useSelector } from "react-redux";
import { openBookingModal } from "@/app/features/bookingSlice";
import { motion } from "framer-motion";
import { FaHouse } from "react-icons/fa6";
import { selectUser } from "@/app/features/userSlice";
import AddArtistDates from "@/app/components/buttons/artist-buttons/AddArtistDates";
import AddArtistAlbum from "@/app/components/buttons/artist-buttons/AddArtistAlbum";
import RatingButton from "@/app/components/buttons/artist-buttons/RatingButton";
import ReviewButton from "@/app/components/buttons/artist-buttons/ReviewButton";
import LikeButton from "@/app/components/buttons/artist-buttons/LikeButton";

const Actions = ({ data, userRating, onLikeChange }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const userSubmittedArtistId = data.userSubmittedArtistId;

  const handleBookDj = () => {
    dispatch(openBookingModal(data));
  };

  const shouldRenderBookButton =
    data?.user_id && user?.id && data.user_id !== user.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 1.5 }}
      className="flex justify-end flex-wrap gap-2 xl:px-2"
    >
      {shouldRenderBookButton && (
        <button
          className="bg-gold/30 hover:bg-gold/40 gap-1 text-gold w-fit secondary center cursor-pointer duration-300 p-1 rounded-xs  text-sm font-bold"
          onClick={handleBookDj}
        >
          <FaHouse size={18} />
          <h1>Book</h1>
        </button>
      )}
      <AddArtistDates
        desc="Add Date"
        artist={data}
        userSubmittedArtistId={userSubmittedArtistId}
      />
      <AddArtistAlbum
        desc="Add Album"
        artist={data}
        userSubmittedArtistId={userSubmittedArtistId}
      />
      <RatingButton
        desc={userRating ? " " : "Rate"}
        artist={data}
        userRating={userRating}
      />
      <LikeButton desc="Like" artist={data} onLikeChange={onLikeChange} />
      <ReviewButton desc="Review" artist={data} />
    </motion.div>
  );
};

export default Actions;
