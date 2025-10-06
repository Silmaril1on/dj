import React, { useState } from "react";
import { MdContentCopy, MdEmail } from "react-icons/md";

const EmailTag = ({ email = "" }) => {
  const [copied, setCopied] = useState(false);
  const lowerEmail = email.toLowerCase();

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(lowerEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const handleMailTo = (e) => {
    e.preventDefault();
    window.open(`mailto:${lowerEmail}`, "_blank");
  };

  if (!email) return null;

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stone-800 duration-300 text-gold text-xs cursor-pointer hover:bg-stone-700 transition"
      onClick={handleMailTo}
      title="Send email"
    >
      <MdEmail className="text-gold/70" />
      <span>{lowerEmail}</span>
      <button
        type="button"
        className="ml-1 text-gold/70 hover:text-gold"
        onClick={handleCopy}
        tabIndex={-1}
        title="Copy email"
      >
        <MdContentCopy size={14} />
      </button>
      {copied && <span className="ml-1 text-green-400">Copied!</span>}
    </span>
  );
};

export default EmailTag;