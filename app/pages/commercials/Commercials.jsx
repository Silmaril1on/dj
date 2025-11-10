import SoundCloudPoster from './SoundCloudPoster'
import Twinkls from './Twinkles'
import SoundfolioAnimation from './SoundfolioAnimation'
import Shorties from './Shorties'

const Commercials = () => {
  return (
     <div className='min-h-screen w-full relative'>
       <Twinkls />
       {/* <Shorties /> */}
       {/* <SoundCloudPoster /> */}
       <SoundfolioAnimation tracklist={true} />
   </div>
  )
}


export default Commercials