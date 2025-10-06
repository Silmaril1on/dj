import Booking from '@/app/pages/bookings-page/Booking'
import { cookies } from 'next/headers'

const BookingsPage = async () => {
  let chatUsers = []
  let error = null

  try {
    const response = await fetch(`${process.env.PROJECT_URL}/api/booking-requests/booking-users`, {
      headers: {
        'Cookie': (await cookies()).toString()
      }
    })
    
    const data = await response.json()
    
    if (response.ok) {
      chatUsers = data.chatUsers || []
    } else {
      error = data.error
    }
  } catch (err) {
    error = 'Failed to fetch chat users'
    console.error('Server-side fetch error:', err)
  }

  return (
    <Booking initialChatUsers={chatUsers} initialError={error} />
  )
}

export default BookingsPage