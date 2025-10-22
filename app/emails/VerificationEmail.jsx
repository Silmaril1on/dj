import * as React from 'react';

export const VerificationEmail = ({ userName, verificationLink }) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify Your SoundFolio Account</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 2px solid #d4af37; max-width: 600px;">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #000000; padding: 30px; text-align: center;">
              <h1 style="color: #d4af37; margin: 0; font-size: 28px;"> SoundFolio</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #d4af37; margin-top: 0; font-size: 24px;">Verify Your Email Address</h2>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">Hello ${userName},</p>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
                Thank you for joining SoundFolio! To complete your account setup and unlock all features,
                please verify your email address by clicking the button below.
              </p>
              
              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${verificationLink}" style="display: inline-block; padding: 15px 40px; background-color: #d4af37; color: #000000; text-decoration: none; font-weight: bold; font-size: 16px;">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <div style="height: 2px; background-color: #d4af37; margin: 20px 0;"></div>

              <!-- Fallback Link -->
              <p style="color: #666; font-size: 14px; margin: 0 0 8px;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="word-break: break-all; color: #d4af37; font-size: 12px; margin: 0 0 30px;">
                ${verificationLink}
              </p>
              <p style="color: #999; font-size: 12px; margin: 0;">
                This verification link will expire in 24 hours. If you didn't create an account with SoundFolio,
                you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1c1c1c; padding: 20px 30px; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0 0 8px;">© ${new Date().getFullYear()} SoundFolio. All rights reserved.</p>
              <p style="color: #999; font-size: 12px; margin: 0;">Discover DJs, Artists, and Book Amazing Talents</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};