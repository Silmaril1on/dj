import { formatBirthdate } from '@/app/helpers/utils';
import ArtistCountry from '@/app/components/materials/ArtistCountry';
import Dot from '@/app/components/ui/Dot';
import Title from '@/app/components/ui/Title'
import Image from 'next/image'
import Link from 'next/link';
import Motion from '@/app/components/containers/Motion';

const EventCard = ({ data }) => {

  return (
    <>
      {data.map((event, index) => {
        return (
          <Motion key={event.id} animation="fade" delay={index * 0.05} className="relative border border-gold/30 hover:border-gold/50 bg-stone-900 p-2 group cursor-pointer">
            <Link href={`events/${event.id}`}>
              <div className="h-80 brightness-75 group-hover:brightness-100 duration-300">
                <Image src={event.event_image} alt={event.event_name} className="w-full h-full object-cover" width={300} height={300} />
              </div>
              <div className="flex flex-col">
                <Title size="sm" color="cream" className="uppercase" text={event.event_name} />
                <p className='text-chino uppercase font-bold' >{formatBirthdate(event.date)}</p>
                <ArtistCountry artistCountry={event} />
              </div>
              <div className="flex flex-wrap">
                {event.artists.slice(0, 5).map((artist, index) => (
                  <div className='flex mr-2 space-x-1' key={index}>
                    <Title color="chino" className="uppercase" text={artist} />
                    {index < event.artists.length - 1 && <Dot />}
                  </div>
                ))}
              </div>
            </Link>
          </Motion>
        )
      })}
    </>
  )
}

export default EventCard