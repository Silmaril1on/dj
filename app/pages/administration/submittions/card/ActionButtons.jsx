import Button from "@/app/components/buttons/Button";
import FlexBox from "@/app/components/containers/FlexBox";
import { openEvaluationModal } from "@/app/features/evaluationSlice";
import { setError } from "@/app/features/modalSlice";
import { MdCheck, MdClose, MdVisibility } from "react-icons/md";
import { useDispatch } from "react-redux";

const ActionButtons = ({
  submission,
  loadingStates,
  submissionsList,
  setLoadingStates,
  setSubmissionsList,
  type = "artist",
}) => {
  const dispatch = useDispatch();
  const apiEndpoint = `/api/admin/submitted-data/${type}`;

  const handleView = (submission) => {
    dispatch(openEvaluationModal({ ...submission, __type: type }));
  };

  const handleAction = async (entityId, action) => {
    const loadingKey = `${entityId}_${action}`;
    setLoadingStates((prev) => ({ ...prev, [loadingKey]: true }));
    try {
      const response = await fetch(apiEndpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: entityId, action }),
      });
      if (response.ok) {
        const submission = submissionsList.find((s) => s.id === entityId);
        if (submission?.submitter) {
          await sendNotification(submission.submitter, action);
          await sendEmailNotification(submission.submitter, action);
        }
        setSubmissionsList((prev) =>
          prev.filter((submission) => submission.id !== entityId),
        );
        dispatch(
          setError({
            message: `${type.charAt(0).toUpperCase() + type.slice(1)} ${action}d successfully`,
            type: "success",
          }),
        );
      } else {
        console.error("Failed to update submission");
      }
    } catch (error) {
      console.error("Error updating submission:", error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  const sendNotification = async (submitter, action) => {
    try {
      const message =
        action === "approve"
          ? `Dear ${submitter.userName}, congratulations! Your submitted ${type} has been reviewed and approved. Your ${type} is now live on our platform.`
          : `Dear ${submitter.userName}, we have reviewed your submitted ${type}. Unfortunately, it doesn't meet our current requirements. Please feel free to submit again with proper details.`;
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: submitter.id,
          type: "submission approve",
          title: "Submission Approved",
          message: message,
          read: false,
        }),
      });
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

  const sendEmailNotification = async (submitter, action) => {
    try {
      const status = action === "approve" ? "approved" : "declined";
      const response = await fetch("/api/resend/send-submission-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: submitter.email,
          userName: submitter.userName,
          submissionType: type,
          status: status,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to send email:", errorData);
      }
    } catch (error) {
      console.error("Error sending email notification:", error);
    }
  };

  return (
    <FlexBox className="gap-2 *:w-full">
      <Button
        text="View"
        icon={<MdVisibility />}
        size="small"
        onClick={() => handleView(submission)}
      />
      <Button
        text="Approve"
        icon={<MdCheck />}
        size="small"
        type="success"
        onClick={() => handleAction(submission.id, "approve")}
        loading={loadingStates[`${submission.id}_approve`]}
      />
      <Button
        text="Decline"
        icon={<MdClose />}
        size="small"
        type="remove"
        onClick={() => handleAction(submission.id, "decline")}
        loading={loadingStates[`${submission.id}_decline`]}
      />
    </FlexBox>
  );
};

export default ActionButtons;
