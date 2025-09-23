import React from 'react'

const Paragraph = ({ text, className = '' }) => {
    return (
        <p className={`text-chino text-[10px] secondary font-medium ${className}`}>{text}</p>
    )
}

export default Paragraph