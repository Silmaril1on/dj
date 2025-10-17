import React from 'react'
import Authenticator2Fa from './2fa/Authenticator2Fa'
import PasswordChange from './password-change/PasswordChange'

const Security = () => {
  return (
      <div className='grid grid-cols-1 lg:grid-cols-2 px-3 lg:px-4 gap-4'>
          <Authenticator2Fa />
          <PasswordChange />
    </div>
  )
}

export default Security