import { buildEmailBase } from "./EmailTemplate";

export const SubmissionNotificationEmail = ({
  userName,
  submissionType,
  status,
}) => {
  const isApproved = status === "approved";
  const typeCapitalized =
    submissionType.charAt(0).toUpperCase() + submissionType.slice(1);

  const bodyHtml = isApproved
    ? `
      <p style="color:#cccccc;font-size:15px;line-height:1.7;margin:0 0 16px;">
        Congratulations, <strong style="color:#fff;">${userName}</strong>!
      </p>
      <p style="color:#cccccc;font-size:15px;line-height:1.7;margin:0 0 16px;">
        Your ${submissionType} submission has been successfully reviewed and approved
        by our team. Your profile is now live on SoundFolio and visible to all users.
      </p>
      <div style="background:#0d2b0d;border-left:3px solid #4caf50;padding:14px 18px;margin:0 0 32px;">
        <p style="color:#6fda6f;font-size:13px;margin:0;font-weight:bold;">
          &#10003; Your ${typeCapitalized} is Now Live!
        </p>
      </div>
    `
    : `
      <p style="color:#cccccc;font-size:15px;line-height:1.7;margin:0 0 16px;">
        Hello <strong style="color:#fff;">${userName}</strong>,
      </p>
      <p style="color:#cccccc;font-size:15px;line-height:1.7;margin:0 0 16px;">
        Thank you for submitting your ${submissionType} to SoundFolio. After careful
        review, we're unable to approve your submission at this time.
      </p>
      <p style="color:#cccccc;font-size:15px;line-height:1.7;margin:0 0 16px;">
        This may be due to incomplete information, image quality, or content
        guidelines. Please review our submission guidelines and resubmit.
      </p>
      <div style="background:#2d1500;border-left:3px solid #ffa726;padding:14px 18px;margin:0 0 32px;">
        <p style="color:#ffa726;font-size:13px;margin:0;font-weight:bold;">
          &#8505; Need help? Email us at
          <a href="mailto:hello.soundfolio@gmail.com"
            style="color:#fcb913;text-decoration:none;">hello.soundfolio@gmail.com</a>
        </p>
      </div>
    `;

  return buildEmailBase({
    title: isApproved
      ? "Submission Approved! &#8212; SoundFolio"
      : "Submission Update &#8212; SoundFolio",
    badge: isApproved ? "Submission Approved" : "Submission Update",
    heading: isApproved ? "Submission Approved!" : "Submission Update",
    subheading: isApproved ? `${typeCapitalized} is Now Live` : null,
    bodyHtml,
    ctaText: isApproved ? "View Your Profile" : "Review Guidelines",
    ctaUrl: "https://soundfolio.net",
    footerNote:
      "You are receiving this email because you submitted to SoundFolio.",
  });
};
