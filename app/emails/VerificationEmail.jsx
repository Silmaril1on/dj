import { buildEmailBase } from "./EmailTemplate";

export const VerificationEmail = ({ userName, verificationLink }) => {
  return buildEmailBase({
    title: "Verify Your SoundFolio Account",
    badge: "Email Verification",
    heading: "Verify Your Email Address",
    bodyHtml: `
      <p style="color:#cccccc;font-size:15px;line-height:1.7;margin:0 0 16px;">
        Hello <strong style="color:#fff;">${userName}</strong>,
      </p>
      <p style="color:#cccccc;font-size:15px;line-height:1.7;margin:0 0 32px;">
        Thank you for joining SoundFolio! To complete your account setup and unlock
        all features, please verify your email address by clicking the button below.
      </p>
    `,
    ctaText: "Verify Email Address",
    ctaUrl: verificationLink,
    footerNote:
      "This verification link will expire in 24 hours. If you didn't create an account with SoundFolio, you can safely ignore this email.",
  });
};
