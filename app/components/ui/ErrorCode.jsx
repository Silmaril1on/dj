import React from 'react'

const ErrorCode = ({
    title = "Something went wrong",
    description = "An error occurred while loading data",
    action = null
}) => {
    return (
        <div className='center flex-col items-center space-y-1'>
            <h1 className="text-lg font-semibold text-gold">{title}</h1>
            <p className="secondary font-light text-xs text-cream text-center">{description}</p>
            {action}
        </div>
    )
}

export default ErrorCode