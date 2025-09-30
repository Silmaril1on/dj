import React, { useState } from 'react'
import { FaStar } from "react-icons/fa6";
import { useDispatch, useSelector } from 'react-redux'
import { closeReportModal } from '@/app/features/reportsSlice'
import { selectUser } from '@/app/features/userSlice'
import Button from '../buttons/Button'
import Close from '../buttons/Close'
import { setError } from '@/app/features/modalSlice';

const ReportForm = ({ type }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const endpoint = type === "feedback" ? "/api/reports/feedback" : "/api/reports/bug";
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
     dispatch(setError({ type: 'success', message: type === 'feedback' ? 'Feedback submitted successfully!' : 'Bug report submitted successfully!' }));
      setTimeout(() => {
        dispatch(closeReportModal());
      }, 1200);
    }
  };

  return (
    <>
      <Close
        onClick={() => dispatch(closeReportModal())}
        className="absolute top-4 right-4"
      />
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-xl font-bold text-gold mb-2">
          {type === "feedback" ? "Submit Feedback" : "Report a Bug"}
        </h2>
        {type === "feedback" && (
          <div className="flex items-center gap-2">
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
          className='h-40'
        />

        <div className="flex gap-2">
          <Button
            text={loading ? "Submitting..." : "Submit"}
            type="submit"
            disabled={loading}
          />
        </div>
      </form>
    </>
  );
}

export default ReportForm