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
import GlobalModal from "./GlobalModal";

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

const ReportForm = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { isOpen, type } = useSelector(selectReportsModal);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [fullName, setFullName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setRating(0);
    setHoveredRating(0);
    setFullName("");
    setContactEmail("");
  };

  const handleClose = () => {
    resetForm();
    dispatch(closeReportModal());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let endpoint, payload;

    if (type === "contact") {
      endpoint = "/api/reports/contact";
      payload = {
        full_name: fullName,
        user_email: contactEmail,
        title,
        content,
      };
    } else if (type === "feedback") {
      endpoint = "/api/reports/feedback";
      payload = {
        title,
        content,
        rating,
        user_id: user?.id,
        user_email: user?.email,
      };
    } else {
      endpoint = "/api/reports/bug";
      payload = { title, content, user_id: user?.id, user_email: user?.email };
    }

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
              : type === "contact"
                ? "Message sent! We'll get back to you soon."
                : "Report submitted successfully!",
        }),
      );
      resetForm();
      setTimeout(() => dispatch(closeReportModal()), 1200);
    }
  };

  const modalTitle =
    type === "feedback"
      ? "Submit Feedback"
      : type === "contact"
        ? "Contact Us"
        : "Report a Problem";

  const activeRating = hoveredRating || rating;

  return (
    <GlobalModal
      isOpen={isOpen}
      onClose={handleClose}
      title={modalTitle}
      maxWidth="w-xl"
      onSubmit={handleSubmit}
      submitText={loading ? "Submitting..." : "Submit"}
      loading={loading}
    >
      <div className="space-y-4">
        {/* ── Feedback: star rating ── */}
        {type === "feedback" && (
          <div className="bg-stone-900 border border-gold/15 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="bg-gold/20 border border-gold/30 px-3 py-1 min-w-[2.5rem] text-center">
                <span className="text-gold font-bold text-lg">
                  {rating || 0}
                </span>
              </div>
              <span className="text-chino text-sm">
                {rating > 0 ? RATING_LABELS[rating] : "No Rating Yet"}
              </span>
            </div>
            <div className="flex justify-start gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className={`transition-all duration-200 cursor-pointer ${
                    star <= activeRating
                      ? "text-yellow-400 scale-110"
                      : "text-gold/30"
                  } hover:scale-125`}
                >
                  <FaStar size={26} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Contact: name + email ── */}
        {type === "contact" && (
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Your Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Your Email Address"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              required
            />
          </div>
        )}

        {/* ── Shared: title + content ── */}
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder={
            type === "feedback"
              ? "Share your thoughts about Soundfolio..."
              : type === "contact"
                ? "How can we help you?"
                : "Describe the issue in detail..."
          }
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          className="h-36"
        />
      </div>
    </GlobalModal>
  );
};

export default ReportForm;
