import ReviewList from './ReviewList';

const UsersReviewPage = ({ reviewsData }) => {

  return (
    <div className="space-y-6 h-full">
      <ReviewList reviewsData={reviewsData} />
    </div>
  )
}

export default UsersReviewPage