import React from 'react'
import Authenticator2Fa from './2fa/Authenticator2Fa'
import PasswordChange from './password-change/PasswordChange'
import VerifyAccount from './verify-account/VerifyAccount'

const Security = () => {
  return (
      <div className='grid grid-cols-1 lg:grid-cols-3 px-3 lg:px-4 gap-4'>
          <Authenticator2Fa />
      <PasswordChange />
      <VerifyAccount />
    </div>
  )
}

export default Security