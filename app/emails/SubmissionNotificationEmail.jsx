export const SubmissionNotificationEmail = ({ 
  userName, 
  submissionType,
  status,
}) => {
  const isApproved = status === 'approved';
  const typeCapitalized = submissionType.charAt(0).toUpperCase() + submissionType.slice(1);
  
  const approvedContent = {
    title: 'Submission Approved!',
    greeting: `Congratulations, ${userName}!`,
    mainMessage: `Great news! Your ${submissionType} submission has been successfully reviewed and approved by our team.`,
    details: `Your ${submissionType} profile is now live on SoundFolio and visible to all users. You can start receiving bookings, reviews, ratings and connecting with the community. You can also update your artist profile, add albums, dates and schedule.`,
    callToAction: 'View Your Profile',
    buttonColor: '#d4af37',
  };

  const declinedContent = {
    title: 'Submission Update',
    greeting: `Hello ${userName},`,
    mainMessage: `Thank you for submitting your ${submissionType} to SoundFolio. After careful review, we're unable to approve your submission at this time.`,
    details: `This may be due to incomplete information, image quality requirements, or content guidelines. Please review our submission guidelines and feel free to resubmit with the necessary updates.`,
    callToAction: 'Review Guidelines',
    buttonColor: '#666666',
  };

  const content = isApproved ? approvedContent : declinedContent;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${content.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 2px solid #d4af37; max-width: 600px;">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #000000; padding: 30px; text-align: center;">
              <h1 style="color: #d4af37; margin: 0; font-size: 28px;">SoundFolio</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #d4af37; margin-top: 0; font-size: 24px;">${content.title}</h2>
              
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
                <strong>${content.greeting}</strong>
              </p>
              
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
                ${content.mainMessage}
              </p>
              
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                ${content.details}
              </p>

              ${isApproved ? `
              <!-- Success Banner -->
              <div style="background-color: #f0f8f0; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0;">
                <p style="color: #2e7d32; font-size: 14px; margin: 0; font-weight: bold;">
                  ✓ Your ${typeCapitalized} is Now Live!
                </p>
              </div>
              ` : `
              <!-- Info Banner -->
              <div style="background-color: #fff8e1; border-left: 4px solid #ffa726; padding: 15px; margin: 20px 0;">
                <p style="color: #e65100; font-size: 14px; margin: 0; font-weight: bold;">
                  ℹ Need Help? Contact our support team for assistance.
                </p>
              </div>
              `}

              <!-- Divider -->
              <div style="height: 2px; background-color: #d4af37; margin: 30px 0;"></div>

              <!-- Next Steps -->
              <h3 style="color: #333; font-size: 18px; margin: 0 0 16px;">What's Next?</h3>
              <ul style="color: #666; font-size: 14px; line-height: 1.8; margin: 0 0 24px; padding-left: 20px;">
                ${isApproved ? `
                  <li>Log in to your SoundFolio account to manage your profile</li>
                  <li>Update your availability and booking preferences</li>
                  <li>Start connecting with ${submissionType === 'artist' ? 'venues and promoters' : 'artists and fans'}</li>
                  <li>Share your profile with your network</li>
                ` : `
                  <li>Review our submission guidelines carefully</li>
                  <li>Update your profile with complete information</li>
                  <li>Ensure all images meet quality requirements</li>
                  <li>Submit your ${submissionType} again when ready</li>
                `}
              </ul>

              <!-- Support Message -->
              <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0 0 8px;">
                If you have any questions or need assistance, our support team is here to help.
              </p>
              <p style="color: #999; font-size: 12px; margin: 0;">
                Email us at <a href="mailto:support@soundfolio.net" style="color: #d4af37; text-decoration: none;">support@soundfolio.net</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1c1c1c; padding: 20px 30px; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0 0 8px;">© ${new Date().getFullYear()} SoundFolio. All rights reserved.</p>
              <p style="color: #999; font-size: 12px; margin: 0;">Discover DJs, Artists, Clubs & Book Amazing Talents</p>
              <p style="color: #d4af37; font-size: 12px; margin: 8px 0 0;">
                <a href="${process.env.PROJECT_URL || 'https://soundfolio.net'}" style="color: #d4af37; text-decoration: none;">Visit SoundFolio</a>
              </p>
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
