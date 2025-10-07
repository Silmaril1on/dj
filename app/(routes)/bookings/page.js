import Booking from '@/app/pages/bookings-page/Booking'
import { cookies } from 'next/headers'

export const dynamic = "force-dynamic";

const BookingsPage = async () => {
  let chatUsers = []
  let error = null

  try {
    const cookieStore = await cookies()
    
    const response = await fetch(`${process.env.PROJECT_URL}/api/booking-requests/user-requests`, {
      headers: {
        'Cookie': cookieStore.toString()
      },
      cache: 'no-store' 
    })
    
    const data = await response.json()
    
    if (response.ok) {
      chatUsers = data.bookingRequests || []
    } else {
      error = data.error
    }
  } catch (err) {
    error = 'Failed to fetch booking requests'
    console.error('Server-side fetch error:', err)
  }

  return (
    <Booking initialChatUsers={chatUsers} initialError={error} />
  )
}

export default BookingsPage