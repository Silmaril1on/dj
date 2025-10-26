"use client"
import { motion } from 'framer-motion'
import { MdEvent, MdAccessTime, MdCalendarToday } from 'react-icons/md'
import ArtistCountry from '@/app/components/materials/ArtistCountry'
import SectionContainer from '@/app/components/containers/SectionContainer'
import Title from '@/app/components/ui/Title'
import MyLink from '@/app/components/ui/MyLink'
import FlexBox from '@/app/components/containers/FlexBox'
import ErrorCode from '@/app/components/ui/ErrorCode'
import { formatTime } from '@/app/helpers/utils'

const ArtistSchedule = ({ data, title = "Upcoming Dates", description = "Stay updated with upcoming dates" }) => {
  if (!data || data.length === 0) {
    return <div className='w-auto center py-20 bg-stone-900 mt-4 mx-3 '> 
      <ErrorCode title="No Upcoming Dates" description="There are no upcoming dates available at the moment." />
    </div>
  }

  return (
    <SectionContainer title={title} description={description} className="mt-10">
      <div className="w-full lg:w-[70%] space-y-4 my-5">
        {data.map((schedule, index) => (
          <motion.div
            key={schedule.id}
            initial={{ opacity: 0, x: -100 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="bg-stone-900  lg:py-2 px-2 lg:px-4 bordered hover:scale-105 "
          >
            <div className="grid grid-cols-2 lg:grid-cols-[4fr_2fr] items-center">
             <section className='grid grid-cols-1 lg:grid-cols-3 gap-1 lg:gap-0'>
               {/* Date */}
              <div className="flex items-center gap-2 text-gold pointer-events-none">
                <MdCalendarToday size={18} />
                <span className="font-semibold text-xs lg:text-lg">
                  {formatTime(schedule.date)}
                </span>
              </div>
              {/* Time */}
              <div className="flex justify-start lg:justify-center items-center gap-2 text-xs lg:text-base text-chino font-bold pointer-events-none">
                <MdAccessTime  />
                <span>{schedule.time}</span>
              </div>
                 {/* Location */}
              <div className="flex justify-start lg:justify-center items-center gap-2 text-chino pointer-events-none">
                <ArtistCountry
                  artistCountry={{
                    country: schedule.country,
                    city: schedule.city,
                  }}
                />
              </div>
             </section>

           

              {/* Club/Venue Name */}
              <div className="flex flex-col items-end justify-evenly">
                <Title text={schedule.club_name} />
                <FlexBox type="row-center" className="gap-4">
                  {schedule.event_link && (
                    <MyLink
                      color="chino"
                      icon={<MdEvent />}
                      href={schedule.event_link}
                      text="View Event"
                      target="_blank"
                    />
                  )}
                  {schedule.id && (
                    <MyLink
                      color="chino"
                      icon={<MdEvent />}
                      href={`/events/${schedule.id}`}
                      text="View Event Page"
                    />
                  )}
                </FlexBox>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </SectionContainer>
  );
}

export default ArtistSchedule