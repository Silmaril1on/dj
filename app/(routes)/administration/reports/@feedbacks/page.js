import Reports from "@/app/(routes)/administration/reports/Reports";
import { getFeedbacks } from "@/app/lib/services/admin/reports/bugsAndFeedbacks";

export const dynamic = "force-dynamic";

const FeedbacksSlot = async () => {
  let feedbacks = [];
  try {
    feedbacks = await getFeedbacks({ status: "pending" });
  } catch (e) {
    console.error("[FeedbacksSlot]", e);
  }
  return <Reports data={feedbacks} type="feedback" />;
};

export default FeedbacksSlot;
