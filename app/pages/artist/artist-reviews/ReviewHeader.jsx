import ArtistGenres from '@/app/components/materials/ArtistGenres'
import ArtistName from '@/app/components/materials/ArtistName'
import ProfilePicture from '@/app/components/materials/ProfilePicture'
import MyLink from '@/app/components/ui/MyLink'
import Paragraph from '@/app/components/ui/Paragraph'
import { FaArrowLeft } from 'react-icons/fa'

const ReviewHeader = ({ artist, data }) => {
  return (
    <div className="flex items-center gap-5">
      {artist?.artist_image && (
        <ProfilePicture avatar_url={artist.artist_image} type="avatar" />
      )}
      <div className='space-y-2'>
        <MyLink href={`/artists/${artist.id}`} text="Go to Artist Profile" icon={<FaArrowLeft />} />
        <ArtistName artistName={artist} size="xxl" className='leading-10 mt-5' />
        <ArtistGenres genres={artist?.genres} />
        <Paragraph text={`${data.length} review${data.length !== 1 ? 's' : ''} from the community`} />
      </div>
    </div>
  )
}

export default ReviewHeader