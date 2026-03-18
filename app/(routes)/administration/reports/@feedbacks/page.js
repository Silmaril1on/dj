import Reports from "@/app/pages/administration/reports/Reports";
import { cookies } from "next/headers";
import { getFeedbacks } from "@/app/lib/services/admin/reports/bugsAndFeedbacks";

export const dynamic = "force-dynamic";

const FeedbacksSlot = async () => {
  let feedbacks = [];
  try {
    const cookieStore = await cookies();
    feedbacks = await getFeedbacks(cookieStore, { status: "pending" });
  } catch {}
  return <Reports data={feedbacks} type="feedback" />;
};

export default FeedbacksSlot;
