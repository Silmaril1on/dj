"use client";
import React, { useState } from "react";
import { FaStar } from "react-icons/fa6";
import { useDispatch, useSelector } from "react-redux";
import {
  closeReportModal,
  selectReportsModal,
} from "@/app/features/reportsSlice";
import { selectUser } from "@/app/features/userSlice";
import { setError } from "@/app/features/modalSlice";
import GlobalModal from "../modals/GlobalModal";

const ReportForm = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { isOpen, type } = useSelector(selectReportsModal);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const endpoint =
      type === "feedback" ? "/api/reports/feedback" : "/api/reports/bug";
    const payload = {
      title,
      content,
      ...(type === "feedback" ? { rating } : {}),
      user_id: user?.id,
      user_email: user?.email,
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (res.ok) {
      dispatch(
        setError({
          type: "success",
          message:
            type === "feedback"
              ? "Feedback submitted successfully!"
              : "Bug report submitted successfully!",
        }),
      );
      setTimeout(() => {
        dispatch(closeReportModal());
      }, 1200);
    }
  };

  return (
    <GlobalModal
      isOpen={isOpen}
      onClose={() => dispatch(closeReportModal())}
      title={type === "feedback" ? "Submit Feedback" : "Contact Us"}
      maxWidth="w-xl"
      onSubmit={handleSubmit}
      submitText={loading ? "Submitting..." : "Submit"}
      loading={loading}
    >
      {type === "feedback" && (
        <div className="flex items-center gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              type="button"
              key={star}
              className={star <= rating ? "text-gold" : "text-stone-600"}
              onClick={() => setRating(star)}
            >
              <FaStar />
            </button>
          ))}
        </div>
      )}
      <div className="space-y-4">
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Describe your feedback or bug..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          className="h-40"
        />
      </div>
    </GlobalModal>
  );
};

export default ReportForm;
