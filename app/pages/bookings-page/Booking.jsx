"use client"
import React, { useState } from 'react'
import ChatUsers from './ChatUsers'
import BookingsConversation from './converstaion/BookingsConversation'

const Booking = ({ initialChatUsers, initialError }) => {
  const [selectedBookingId, setSelectedBookingId] = useState(null)

  const handleSelectBooking = (bookingId) => {
    setSelectedBookingId(bookingId)
  }

  return (
    <div className='min-h-screen p-4 flex gap-4'>
      <ChatUsers 
        initialChatUsers={initialChatUsers} 
        initialError={initialError}
        onSelectBooking={handleSelectBooking}
      />
      <BookingsConversation 
        selectedBookingId={selectedBookingId} 
        initialChatUsers={initialChatUsers}
      />
    </div>
  )
}

export default Booking