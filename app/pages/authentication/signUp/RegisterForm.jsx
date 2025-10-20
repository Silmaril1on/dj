"use client"
import SubmissionForm from '@/app/components/forms/SubmissionForm'
import handleAuthError from '@/app/helpers/handleAuthErrors'
import { validateSignupForm } from '@/app/helpers/validateForm'
import { checkPasswordStrength } from '@/app/helpers/validatePwd'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { setError } from '@/app/features/modalSlice'
import { setUser } from '@/app/features/userSlice'
import { openWelcomeModal } from '@/app/features/welcomeSlice' // Add this
import { setUserCookie } from '@/app/helpers/cookieUtils'
import { formConfigs } from '@/app/helpers/formData/formConfigs'

const RegisterForm = ({ }) => {
  const dispatch = useDispatch()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: '',
    color: 'red'
  })

  const formConfig = {
    ...formConfigs.signUp,
    fields: {
      ...formConfigs.signUp.fields,
      password: {
        type: "password",
        required: true,
        placeholder: "Enter your password",
        autoComplete: "new-password",
        icon: "lock",
        onChange: (value) => {
          setPasswordStrength(checkPasswordStrength(value))
        }
      },
      confirmPassword: {
        type: "password",
        required: true,
        placeholder: "Confirm your password",
        autoComplete: "new-password",
        icon: "lock"
      }
    }
  }

  // Custom validation using existing validateSignupForm
  const customValidation = (formData) => {
    return null;
  }

  const handleSubmit = async (formData) => {
    setIsLoading(true)
    dispatch(setError(''))
    const formDataObj = {
      email: formData.get('email'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
      userName: formData.get('userName')
    }
    const validation = validateSignupForm(formDataObj, passwordStrength)
    if (!validation.isValid) {
      dispatch(setError({
        message: validation.errors[0].message,
        type: 'error'
      }))
      setIsLoading(false)
      return
    }
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formDataObj.email,
          password: formDataObj.password,
          userName: formDataObj.userName
        })
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Sign up failed')
      }
      dispatch(setUser(data.user))
      setUserCookie(data.user)
      
      dispatch(openWelcomeModal({
        userName: formDataObj.userName,
        email: formDataObj.email
      }))
      
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
      submitButtonText="Sign Up"
      customValidation={customValidation}
      showPasswordStrength={true}
    />
  )
}

export default RegisterForm