import FlexBox from '@/app/components/containers/FlexBox'
import ProfilePicture from '@/app/components/materials/ProfilePicture'
import Dot from '@/app/components/ui/Dot'
import SpanText from '@/app/components/ui/SpanText'
import Title from '@/app/components/ui/Title'
import { capitalizeFirst, formatTime } from '@/app/helpers/utils'
import { FaStar } from 'react-icons/fa'

const ListHeader = ({ review, userScore }) => {
  return (
    <FlexBox type="row-between">
      <FlexBox className="gap-4">
        <ProfilePicture avatar_url={review.users?.user_avatar} />
        <div>
          <Title size="sm" color="chino" text={capitalizeFirst(review.review_title)} />
          <FlexBox className="gap-2" type="row-start">
            <SpanText size="xs" text={`by ${review.users?.userName}`} />
            <Dot />
            <SpanText size="xs" text={formatTime(review.created_at)} />
          </FlexBox>
        </div>
      </FlexBox>
      <div className='center gap-1'>
        <FaStar className='dark:text-gold' />
        <SpanText size="md" text={`${userScore}/10`} />
      </div>
    </FlexBox>
  )
}

export default ListHeader