"use client";
import FlexBox from '@/app/components/containers/FlexBox'
import Paragraph from '@/app/components/ui/Paragraph'
import Title from '@/app/components/ui/Title'
import ReviewButton from '@/app/components/buttons/artist-buttons/ReviewButton';

const ReviewFooter = ({ artist, onReviewAdd }) => {

    return (
        <FlexBox type="column-start" className="bg-gold/20 p-5 gap-2">
            <Title size="lg" text="Share Your Experience" />
            <Paragraph text="Have you seen this artist perform? Share your review and help others discover great music!" />
            <ReviewButton artist={artist} desc="Write a Review" onReviewAdd={onReviewAdd} />
        </FlexBox>
    )
}

export default ReviewFooter