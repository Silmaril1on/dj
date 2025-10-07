"use client"
import { useState } from 'react'
import ChatUsers from './ChatUsers'
import BookingsConversation from './converstaion/BookingsConversation'

const Booking = ({ initialChatUsers, initialError }) => {
  const [selectedBookingId, setSelectedBookingId] = useState(null)

  const handleSelectBooking = (bookingId) => {
    setSelectedBookingId(bookingId)
  }

  return (
    <div className="gap-4 h-full flex min-h-screen">
      <ChatUsers 
        initialChatUsers={initialChatUsers || []}
        onSelectBooking={handleSelectBooking}
        initialError={initialError}
      />
      <BookingsConversation 
        selectedBookingId={selectedBookingId}
        initialChatUsers={initialChatUsers || []}
      />
    </div>
  )
}

export default Booking