import ArtistGenres from '@/app/components/materials/ArtistGenres'
import ArtistName from '@/app/components/materials/ArtistName'
import ProfilePicture from '@/app/components/materials/ProfilePicture'
import MyLink from '@/app/components/ui/MyLink'
import Paragraph from '@/app/components/ui/Paragraph'
import { FaArrowLeft } from 'react-icons/fa'

const ReviewHeader = ({ artist, data }) => {
  return (
    <div className="flex relative overflow-hidden">
      <div className="absolute inset-0 -z-[1] blur-lg">
        <img
          src={artist.artist_image}
          alt={artist.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className='flex flex-col md:flex-row gap-5 bg-black/30 w-full h-full py-10 pl-5'>
        <ProfilePicture avatar_url={artist.artist_image} type="avatar" />
        <div className="lg:space-y-2">
          <MyLink
            href={`/artists/${artist.id}`}
            text="Go to Artist Profile"
            icon={<FaArrowLeft />}
          />
          <ArtistName
            artistName={artist}
            className="leading-12 lg:leading-10 text-3xl lg:text-6xl lg:mt-5 uppercase"
          />
          <ArtistGenres genres={artist?.genres} />
          <Paragraph
            text={`${data.length} review${
              data.length !== 1 ? "s" : ""
            } from the community`}
          />
        </div>
      </div>
    </div>
  );
}

export default ReviewHeader