"use client";
import Button from "@/app/components/buttons/Button";
import SectionContainer from "@/app/components/containers/SectionContainer";
import ProfilePicture from "@/app/components/materials/ProfilePicture";
import Paragraph from "@/app/components/ui/Paragraph";
import SpanText from "@/app/components/ui/SpanText";
import Title from "@/app/components/ui/Title";
import { setError } from "@/app/features/modalSlice";
import { formatTime } from "@/app/helpers/utils";
import { useState } from "react";
import { useDispatch } from "react-redux";

const Reports = ({ data = [], type = "bug" }) => {
  const [items, setItems] = useState(data || []);
  const dispatch = useDispatch();
  const [loadingId, setLoadingId] = useState(null);

  const handleAction = async (report) => {
    setLoadingId(report.id);
    if (type === "report") {
      await fetch(`/api/reports/bug`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: report.id }),
      });
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: report.user_id,
          userName: report.reporter?.userName || report.reporter?.email || "",
          email: report.reporter?.email || "",
          message:
            "Thank you for your bug report! We've fixed the issue you submitted.",
        }),
      });
      setItems((prev) => prev.filter((r) => r.id !== report.id));
      dispatch(
        setError({
          message: "Report resolved and user notified.",
          type: "success",
        }),
      );
    } else if (type === "contact") {
      await fetch(`/api/reports/bug`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: report.id }),
      });
      setItems((prev) => prev.filter((r) => r.id !== report.id));
      dispatch(setError({ message: "Message dismissed.", type: "success" }));
    } else if (type === "feedback") {
      await fetch("/api/reports/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: report.id }),
      });
      setItems((prev) =>
        prev.map((f) =>
          f.id === report.id ? { ...f, status: "approved" } : f,
        ),
      );
      dispatch(setError({ message: "Feedback approved.", type: "success" }));
    }
    setLoadingId(null);
  };

  return (
    <SectionContainer
      size="sm"
      title={
        type === "report"
          ? "Reports"
          : type === "feedback"
            ? "Feedbacks"
            : "Messages"
      }
      description={
        type === "report"
          ? "User submitted reports"
          : type === "feedback"
            ? "User feedbacks"
            : "User contact messages"
      }
      className="bg-stone-900"
    >
      {items.length === 0 && (
        <div>
          No{" "}
          {type === "report"
            ? "reports yet."
            : type === "feedback"
              ? "feedbacks."
              : "messages."}
        </div>
      )}
      {items.map((report) => (
        <div
          key={report.id}
          className="bg-stone-950 py-2 flex flex-col *:w-full items-center gap-2 px-3 w-full"
        >
          <div className="flex-1">
            <Title text={report.title} size="sm" />
            <Paragraph text={report.content} />
            {type === "feedback" && (
              <>
                <SpanText
                  text={`Rating: ${report.rating ?? "N/A"}`}
                  size="xs"
                  color="cream"
                />
                <SpanText
                  text={`Status: ${report.status}`}
                  size="xs"
                  color="cream"
                />
              </>
            )}
          </div>
          <article className="flex justify-between items-center border-t border-gold/30 pt-2">
            <div className="flex items-center gap-2">
              {type === "contact" ? (
                <div>
                  <Paragraph text={report.full_name} />
                  <div className="flex items-center gap-1">
                    <SpanText text="Email:" size="xs" />
                    <SpanText
                      text={report.user_email}
                      size="xs"
                      color="cream"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <ProfilePicture avatar_url={report.reporter?.user_avatar} />
                  <div>
                    <Paragraph text={report.reporter?.email} />
                    <div className="flex items-center gap-1">
                      <SpanText text="Submitted:" size="xs" />
                      <SpanText
                        text={formatTime(report.created_at)}
                        size="xs"
                        color="cream"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
            {(type === "report" ||
              type === "contact" ||
              (type === "feedback" && report.status !== "approved")) && (
              <Button
                loading={loadingId === report.id}
                text={
                  type === "report"
                    ? "Resolve"
                    : type === "contact"
                      ? "Dismiss"
                      : "Approve"
                }
                size="small"
                type="success"
                onClick={() => handleAction(report)}
              />
            )}
          </article>
        </div>
      ))}
    </SectionContainer>
  );
};

export default Reports;
