import Button from '@/app/components/buttons/Button'
import FlexBox from '@/app/components/containers/FlexBox'

const BookingFooter = () => {


  return (
    <FlexBox type="row-between" className="border-t border-gold/30">
      <Button href="/bookings" size="small" type="bold" text="View All" />
    </FlexBox>
  )
}

export default BookingFooter