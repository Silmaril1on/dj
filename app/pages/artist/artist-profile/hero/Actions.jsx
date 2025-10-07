'use client'
import { useDispatch } from 'react-redux';
import { openBookingModal } from '@/app/features/bookingSlice'; 
import AddArtistDates from '@/app/components/buttons/AddArtistDates'
import EditProduct from '@/app/components/buttons/EditProduct.'
import LikeButton from '@/app/components/buttons/LikeButton'
import RatingButton from '@/app/components/buttons/RatingButton'
import ReviewButton from '@/app/components/buttons/ReviewButton'
import { motion } from 'framer-motion'
import { FaHouse } from 'react-icons/fa6';

const Actions = ({ data, userRating, onLikeChange }) => {
    const dispatch = useDispatch(); 
    const userSubmittedArtistId = data.userSubmittedArtistId;

    const handleBookDj = () => {
      dispatch(openBookingModal(data));
  };  
  
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.5 }}
        className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-3 xl:grid-cols-6 border *:w-full gap-2 justify-end items-end"
      >
        {data?.user_id && (
          <button
            className="bg-gold/30 hover:bg-gold/40 gap-1 text-gold w-fit secondary center cursor-pointer duration-300 p-1 rounded-xs text-[10px] lg:text-sm font-bold"
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
        <EditProduct desc="Edit Profile" data={data} />
        <RatingButton
          desc={userRating ? " " : "Rate"}
          artist={data}
          userRating={userRating}
        />
        <LikeButton desc="Like" artist={data} onLikeChange={onLikeChange} />
        <ReviewButton desc="Review" artist={data} />
      </motion.div>
    );
}

export default Actions