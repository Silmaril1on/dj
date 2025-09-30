"use client"
import { useState } from 'react'
import ProfilePicture from '@/app/components/materials/ProfilePicture'
import ArtistName from '@/app/components/materials/ArtistName'
import ArtistCountry from '@/app/components/materials/ArtistCountry'
import Paragraph from '@/app/components/ui/Paragraph'
import FlexBox from '@/app/components/containers/FlexBox'
import { slideTop } from '@/app/framer-motion/motionValues'
import { motion } from 'framer-motion'
import Image from 'next/image'
import ActionButtons from './ActionButtons'
import Title from '@/app/components/ui/Title'
import { truncateString } from '@/app/helpers/utils'

const SubmittionCard = ({ submissions, type = 'artist' }) => {
  const [loadingStates, setLoadingStates] = useState({})
  const [submissionsList, setSubmissionsList] = useState(submissions)
  const isClub = type === 'club'
  const isEvent = type === 'event'

  return (
    <div className="gap-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 overflow-hidden">
      {submissionsList?.map((submission, index) => (
        <motion.div
          key={submission.id}
          variants={slideTop}
          initial="hidden"
          animate="visible"
          transition={{ delay: index * 0.1 }}
          className="bg-stone-900 bordered p-2 group space-y-3"
        >
          <div className="relative w-full h-48 mb-4 overflow-hidden shadow-lg">
            <Image
              src={submission.artist_image}
              alt={submission.name}
              fill
              className="object-cover brightness-90 group-hover:brightness-100 duration-300"
            />
          </div>
          <div>
            {isClub || isEvent ? <Title className='uppercase' text={truncateString(submission.name, 20)} /> : <ArtistName artistName={submission} />}
            <ArtistCountry artistCountry={submission} />
            {isClub && submission.capacity && (
              <div className="mt-2">
                <p className="text-gold/80 text-sm font-medium">
                  Capacity: <span className="text-cream">{submission.capacity}</span>
                </p>
              </div>
            )}
          </div>
          <div className="border-t border-gold/20 pt-3">
            <Paragraph text="Submitted by:" />
            <FlexBox type="row-start" className="gap-2 items-center">
              <ProfilePicture
                avatar_url={submission.submitter.user_avatar}
                type="icon"
              />
              <div className="flex-1 text-xs min-w-0">
                <p className="text-gold ">
                  {submission.submitter.userName}
                </p>
                <p className=" text-gold/60">
                  {submission.submitter.email}
                </p>
              </div>
            </FlexBox>
          </div>
          <ActionButtons submission={submission} loadingStates={loadingStates} setLoadingStates={setLoadingStates} submissionsList={submissionsList} setSubmissionsList={setSubmissionsList} type={type} />
        </motion.div>
      ))}
    </div>
  )
}

export default SubmittionCard