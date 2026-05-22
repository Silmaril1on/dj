"use client";
import { useState } from "react";
import GlobalModal from "./GlobalModal";

const TYPES = [
  {
    value: "artist",
    label: "Artist",
    color: "border-violet-400 text-violet-400 bg-violet-400/10",
  },
  {
    value: "club",
    label: "Club",
    color: "border-pink-400 text-pink-400 bg-pink-400/10",
  },
  {
    value: "festival",
    label: "Festival",
    color: "border-cyan-400 text-cyan-400 bg-cyan-400/10",
  },
];

const RecommendationModal = ({ isOpen, onClose, onSubmitted }) => {
  const [type, setType] = useState("artist");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClose = () => {
    setContent("");
    setError("");
    setType("artist");
    onClose();
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/forum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, content: content.trim() }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Failed to submit");
        return;
      }

      onSubmitted(json.post);
      handleClose();
    } catch {
      setError("Something went wrong, please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlobalModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Recommend"
      maxWidth="max-w-lg"
      onSubmit={handleSubmit}
      submitText={loading ? "Submitting..." : "Submit"}
      loading={loading}
      disabled={!content.trim()}
    >
      <div className="space-y-5">
        {/* Type selection */}
        <div className="space-y-2">
          <p className="text-chino text-xs uppercase">Type</p>
          <div className="flex gap-2">
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`px-4 cursor-pointer py-1.5 text-xs ${t.color} font-bold uppercase border duration-300 ${
                  type === t.value ? "opacity-100" : "opacity-60"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hint */}
        <p className="text-stone-500 text-xs leading-relaxed secondary">
          Mark names with <span className="text-gold font-semibold">#</span> so
          they can be identified — e.g.{" "}
          <span className="text-stone-400 italic">
            &quot;Please add #BorisBrejcha and #StephanBodzin&quot;
          </span>
        </p>

        {/* Textarea */}
        <div className="space-y-1">
          <label className="text-chino text-xs uppercase">
            Your recommendation
          </label>
          <textarea
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={500}
            placeholder={`e.g. "Please add #BorisBrejcha to the database"`}
          />
          <div className="flex justify-between items-center">
            {error ? <p className="text-red-400 text-xs">{error}</p> : <span />}
            <span className="text-stone-600 text-xs ml-auto">
              {content.length}/500
            </span>
          </div>
        </div>
      </div>
    </GlobalModal>
  );
};

export default RecommendationModal;
