"use client"
import SectionContainer from '@/app/components/containers/SectionContainer'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectUser } from '@/app/features/userSlice'
import SpanText from '@/app/components/ui/SpanText'
import { FaCheckCircle, FaExclamationTriangle, FaEnvelope } from 'react-icons/fa'
import { motion } from 'framer-motion'
import { setError } from '@/app/features/modalSlice'
import EmailTag from '@/app/components/ui/EmailTag'

const VerifyAccount = () => {
  const user = useSelector(selectUser)
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false)

  const handleSendVerification = async () => {
    setLoading(true)
    setMessage('')
    setMessageType('')

    try {
      const response = await fetch('/api/resend/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id })
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification email')
      }
      dispatch(
        setError({
          message: "Verification email sent! Please check your inbox.",
          type: "success"
        })
      );
    } catch (error) {
      dispatch(setError({message: error, type: "error"}))
    } finally {
      setLoading(false)
    }
  }

  return (
    <SectionContainer
      className="bg-stone-900"
      title="Verify Account"
      description="Verify your email address"
    >
      <div className="space-y-6 w-full h-full">
        {/* Email Status */}
        <div className="flex items-center justify-between p-4 bg-stone-950 border border-gold/20">
            <div>
              <SpanText text="Email Address" size="xs" color="cream" />
              <EmailTag email={user?.email} />
            </div>
          <div className="flex items-center gap-2">
            {user?.email_verified ? (
              <>
                <FaCheckCircle className="text-green-500" />
                <SpanText
                  text="Verified"
                  className="text-green-500 font-medium"
                />
              </>
            ) : (
              <>
                <FaExclamationTriangle className="text-crimson" />
                <SpanText
                  text="Verify Email"
                  className="text-crimson font-medium"
                />
              </>
            )}
          </div>
        </div>

        {/* Verification Message */}
        {!user?.email_verified && (
          <div className="p-4 bg-orange-500/10 border border-orange-500/30">
            <SpanText
              text="Your email address is not verified. Verify your email to:"
              className="text-cream mb-2 block"
            />
            <ul className="list-disc list-inside space-y-1 text-cream/80 text-sm">
              <li>Receive important account notifications</li>
              <li>Reset your password if needed</li>
              <li>Access all platform features</li>
              <li>Increase your account security</li>
            </ul>
          </div>
        )}

        {/* Send Verification Button */}
        {!user?.email_verified && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSendVerification}
            disabled={loading}
            className={`w-full bg-gold text-black font-bold py-3 px-6 hover:bg-gold/90 duration-300 flex items-center justify-center gap-2 ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <FaEnvelope />
                <span>Send Verification Email</span>
              </>
            )}
          </motion.button>
        )}
      </div>
    </SectionContainer>
  );
}

export default VerifyAccount