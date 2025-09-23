"use client"
import SubmissionForm from '@/app/components/forms/SubmissionForm'
import handleAuthError from '@/app/helpers/handleAuthErrors'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { setError } from '@/app/features/modalSlice'
import { setUser } from '@/app/features/userSlice'
import { setUserCookie } from '@/app/helpers/cookieUtils'
import { formConfigs } from '@/app/helpers/formData/formConfigs'

const SignInForm = () => {
  const router = useRouter()
  const dispatch = useDispatch()
  const [isLoading, setIsLoading] = useState(false)

  const formConfig = {
    ...formConfigs.signIn,
    fields: {
      email: {
        ...formConfigs.signIn.fields.email,
        required: false,
      },
      password: {
        ...formConfigs.signIn.fields.password,
        required: false,
      },
    }
  }

  const handleSubmit = async (formData) => {
    setIsLoading(true)
    dispatch(setError(''))
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.get('email'),
          password: formData.get('password')
        })
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Sign in failed')
      }
      dispatch(setUser(data.user))
      setUserCookie(data.user)
      dispatch(setError({ message: 'Signed in successfully!', type: 'success' }))
      router.push('/')
    } catch (error) {
      const userFriendlyError = handleAuthError(error)
      dispatch(setError({ message: userFriendlyError, type: 'error' }))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SubmissionForm
      formConfig={formConfig}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      submitButtonText="Sign In"
    />
  )
}

export default SignInForm
