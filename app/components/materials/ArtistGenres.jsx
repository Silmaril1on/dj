import { capitalizeFirst } from '@/app/helpers/utils'
import { IoMusicalNotesSharp } from 'react-icons/io5'

const ArtistGenres = ({ genres, className }) => {
    return (
        <div className={`flex items-center secondary text-[12px] font-medium gap-2 text-gold pointer-events-none ${className}`}>
            <IoMusicalNotesSharp size={20} />
            {genres?.map((genre, index) => (
                <h1 className='bg-gold/20 px-2 py-1 border border-gold/50 ' key={index}>{capitalizeFirst(genre)}</h1>
            ))}
        </div>
    )
}

export default ArtistGenres