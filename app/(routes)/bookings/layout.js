import React from 'react'

export const metadata = {
  title: "Soundfolio | My Bookings",
  description:
    "Manage your booking requests and responses on Soundfolio. View, accept, or decline bookings with ease.",
};

const BookingsLayout = ({ children }) => {
    return (
      <div>
        {children}
      </div>
    );
};

export default BookingsLayout