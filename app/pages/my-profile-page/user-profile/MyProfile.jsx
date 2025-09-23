"use client"
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import UserProfileForm from './profile-form/UserProfileForm'
import UserProfile from './profile/UserProfile'
import { useSelector } from 'react-redux'
import { selectUser } from '@/app/features/userSlice'

const MyProfile = ({ profile }) => {
  const [showEditForm, setShowEditForm] = useState(false)
  const [currentProfile, setCurrentProfile] = useState(profile)
  const reduxProfile = useSelector(selectUser)

  useEffect(() => {
    if (reduxProfile) {
      setCurrentProfile(reduxProfile)
    }
  }, [reduxProfile])

  useEffect(() => {
    const handleProfileUpdate = (event) => {
      setCurrentProfile(event.detail.profile)
    }
    window.addEventListener('profile-updated', handleProfileUpdate)
    return () => window.removeEventListener('profile-updated', handleProfileUpdate)
  }, [])
  const toggleEditForm = () => {
    setShowEditForm(!showEditForm)
  }

  return (
    <div className="space-y-8">
      <UserProfile
        profile={currentProfile}
        onUpdateClick={toggleEditForm}
        isEditing={showEditForm}
      />
      <AnimatePresence>
        {showEditForm && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <UserProfileForm
              profile={profile}
              onCancel={() => setShowEditForm(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MyProfile