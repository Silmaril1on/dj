"use client"
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MdEvent, MdAccessTime, MdCalendarToday } from 'react-icons/md'
import ArtistCountry from '@/app/components/materials/ArtistCountry'
import SectionContainer from '@/app/components/containers/SectionContainer'
import Title from '@/app/components/ui/Title'
import MyLink from '@/app/components/ui/MyLink'
import FlexBox from '@/app/components/containers/FlexBox'
import ErrorCode from '@/app/components/ui/ErrorCode'
import { formatBirthdate } from '@/app/helpers/utils'
import Spinner from '@/app/components/ui/Spinner'

const ArtistSchedule = ({ 
  artistId, 
  clubId, 
  data: passedData, 
  title = "Upcoming Dates", 
  description = "Stay updated with upcoming dates" 
}) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (passedData) {
      setData(passedData)
      setLoading(false)
      return
    }

    const fetchSchedule = async () => {
      try {
        setLoading(true)
        let response
        // Determine which API endpoint to use
        if (artistId) {
          response = await fetch(`/api/artists/${artistId}/schedule`)
        } else if (clubId) {
          response = await fetch(`/api/club/${clubId}/events`)
        } else {
          setError('No ID provided')
          setLoading(false)
          return
        }
        const result = await response.json()
        if (result.success) {
          setData(result.data || [])
        } else {
          setError(result.error)
        }
      } catch (err) {
        console.error('Error fetching schedule:', err)
        setError('Failed to load schedule')
      } finally {
        setLoading(false)
      }
    }

    if (artistId || clubId) {
      fetchSchedule()
    }
  }, [artistId, clubId, passedData])

  if (loading) {
    return (
      <div className='w-auto center py-20 bg-stone-900 mt-4 mx-3 min-h-[400px]'>
        <Spinner type="logo" />
      </div>
    )
  }

  if (error || !data || data.length === 0) {
    return null
  }

  return (
    <SectionContainer title={title} description={description} className="mt-10">
      <div className="w-full lg:w-[70%] space-y-2 lg:space-y-4 my-5">
        {data.map((schedule, index) => (
          <motion.div
            key={schedule.id}
            initial={{ opacity: 0, x: -100 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="bg-stone-900 py-1 lg:py-2 px-2 lg:px-4 bordered lg:hover:scale-105 "
          >
            <div className="grid grid-cols-2 lg:grid-cols-[4fr_2fr] items-center">
             <section className='grid grid-cols-1 lg:grid-cols-3 gap-1 lg:gap-0'>
               {/* Date */}
              <div className="flex items-center gap-2 text-gold pointer-events-none">
                <MdCalendarToday size={18} />
                <span className="font-semibold text-xs lg:text-lg">
                  {formatBirthdate(schedule.date)}
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

           

              {/* Club/Venue Name or Event Name */}
              <div className="flex flex-col items-end justify-evenly">
                <Title text={clubId ? schedule.event_name : schedule.club_name} className='pointer-events-none' />
                {clubId && schedule.artists && (
                  <div className="text-xs text-chino mb-2">
                    Artists: {Array.isArray(schedule.artists) ? schedule.artists.join(', ') : schedule.artists}
                  </div>
                )}
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
                  {schedule.event_id && (
                    <MyLink
                      color="chino"
                      icon={<MdEvent />}
                      href={`/events/${schedule.event_id}`}
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