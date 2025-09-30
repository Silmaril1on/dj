import Reports from '@/app/pages/administration/reports/Reports';

const FeedbacksSlot = async () => {
  let feedbacks = [];
  try {
    const res = await fetch(
      `${process.env.PROJECT_URL}/api/reports/feedback?status=pending`,
      { cache: "no-store" }
    );
    const data = await res.json();
    if (data.feedbacks) feedbacks = data.feedbacks;
  } catch {}
  return <Reports data={feedbacks} type="feedback" />;
};

export default FeedbacksSlot;