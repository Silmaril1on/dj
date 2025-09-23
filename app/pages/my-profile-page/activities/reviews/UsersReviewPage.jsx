import ReviewList from './ReviewList';

const UsersReviewPage = ({ reviewsData, error, currentPage }) => {

  return (
    <div className="space-y-6 p-4">
      <ReviewList reviewsData={reviewsData} />
    </div>
  )
}

export default UsersReviewPage