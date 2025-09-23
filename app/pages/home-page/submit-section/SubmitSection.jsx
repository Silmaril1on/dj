'use client'
import { RiUploadCloud2Fill } from "react-icons/ri";
import { setError } from '@/app/features/modalSlice'
import { selectUser } from '@/app/features/userSlice'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'

const SubmitSection = () => {
    const router = useRouter()
    const dispatch = useDispatch()
    const user = useSelector(selectUser)

    const handleAddArtist = () => {
        if (user?.submitted_artist_id) {
            dispatch(setError({ message: 'You have already submitted an artist', type: 'error' }))
        } else {
            router.push('/add-product/add-artist')
        }
    }

    const handleAddClub = () => {
        if (user?.submitted_club_id) {
            dispatch(setError({ message: 'You have already submitted a club', type: 'error' }))
        } else {
            router.push('/add-product/add-club')
        }
    }

    const handleAddEvent = () => {
        if (!user) {
            dispatch(setError({ message: 'Please login to add events', type: 'error' }))
        } else {
            router.push('/add-product/add-event')
        }
    }


    return (
        <div className='w-full grid grid-cols-1 md:grid-cols-3 gap-6 px-[10%] bg-stone-900 py-20'>
            {/* Add Artist Card */}
            <div
                onClick={handleAddArtist}
                className="group relative bg-gradient-to-br from-gold/20 to-gold/10 border border-gold/30 rounded-lg p-6 cursor-pointer hover:border-gold/60 hover:bg-gradient-to-br hover:from-gold/30 hover:to-gold/20 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-gold/20"
            >
                <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center group-hover:bg-gold/30 transition-colors duration-300">
                        <RiUploadCloud2Fill className="text-gold text-2xl" />
                    </div>
                    <h3 className="text-xl font-bold text-gold group-hover:text-gold/90 transition-colors duration-300">
                        Add Artist
                    </h3>
                    <p className="text-sm text-chino/80 leading-relaxed">
                        Submit a new DJ or electronic music artist to our database. Help expand our community's music collection.
                    </p>
                </div>
            </div>

            {/* Add Club Card */}
            <div
                onClick={handleAddClub}
                className="group relative bg-gradient-to-br from-gold/20 to-gold/10 border border-gold/30 rounded-lg p-6 cursor-pointer hover:border-gold/60 hover:bg-gradient-to-br hover:from-gold/30 hover:to-gold/20 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-gold/20"
            >
                <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center group-hover:bg-gold/30 transition-colors duration-300">
                        <RiUploadCloud2Fill className="text-gold text-2xl" />
                    </div>
                    <h3 className="text-xl font-bold text-gold group-hover:text-gold/90 transition-colors duration-300">
                        Add Club
                    </h3>
                    <p className="text-sm text-chino/80 leading-relaxed">
                        Add a new venue or club to our directory. Share the best spots for electronic music events.
                    </p>
                </div>
            </div>

            {/* Add Event Card */}
            <div
                onClick={handleAddEvent}
                className="group relative bg-gradient-to-br from-gold/20 to-gold/10 border border-gold/30 rounded-lg p-6 cursor-pointer hover:border-gold/60 hover:bg-gradient-to-br hover:from-gold/30 hover:to-gold/20 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-gold/20"
            >
                <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center group-hover:bg-gold/30 transition-colors duration-300">
                        <RiUploadCloud2Fill className="text-gold text-2xl" />
                    </div>
                    <h3 className="text-xl font-bold text-gold group-hover:text-gold/90 transition-colors duration-300">
                        Add Event
                    </h3>
                    <p className="text-sm text-chino/80 leading-relaxed">
                        Create and manage your upcoming events. Connect with fans and promote your shows.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default SubmitSection