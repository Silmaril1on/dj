import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { SubmissionNotificationEmail } from '@/app/emails/SubmissionNotificationEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { email, userName, submissionType, status } = await request.json();

    // Validate required fields
    if (!email || !userName || !submissionType || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: email, userName, submissionType, status' },
        { status: 400 }
      );
    }

    // Validate submission type
    const validTypes = ['artist', 'club', 'event', 'festival'];
    if (!validTypes.includes(submissionType)) {
      return NextResponse.json(
        { error: 'Invalid submission type. Must be: artist, club, event, or festival' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['approved', 'declined'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: approved or declined' },
        { status: 400 }
      );
    }

    // Generate email subject
    const subject = status === 'approved' 
      ? `Your ${submissionType.charAt(0).toUpperCase() + submissionType.slice(1)} Submission Has Been Approved!`
      : `Update on Your ${submissionType.charAt(0).toUpperCase() + submissionType.slice(1)} Submission`;

    // Send email
    const { data, error } = await resend.emails.send({
      from: 'SoundFolio <hello@updates.soundfolio.net>',
      to: email,
      subject: subject,
      html: SubmissionNotificationEmail({ 
        userName, 
        submissionType, 
        status 
      }),
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Email sent successfully',
      emailId: data.id 
    });

  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
