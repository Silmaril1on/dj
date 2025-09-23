'use client'
import AddEvent from '@/app/components/buttons/AddEvent'
import EditArtist from '@/app/components/buttons/EditArtist.'
import LikeButton from '@/app/components/buttons/LikeButton'
import RatingButton from '@/app/components/buttons/RatingButton'
import ReviewButton from '@/app/components/buttons/ReviewButton'
import { motion } from 'framer-motion'

const Actions = ({ data, userRating, onLikeChange }) => {
    const userSubmittedArtistId = data.userSubmittedArtistId;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1.5 }} className='flex justify-end gap-2 *:px-5'>
            <AddEvent desc="Add Date" artist={data} userSubmittedArtistId={userSubmittedArtistId} />
            <EditArtist desc="Edit Profile" artist={data} />
            <RatingButton desc={userRating ? " " : "Rate"} artist={data} userRating={userRating} />
            <LikeButton desc="Like" artist={data} onLikeChange={onLikeChange} />
            <ReviewButton desc="Add Review" artist={data} />
        </motion.div>
    )
}

export default Actions