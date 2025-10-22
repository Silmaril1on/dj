import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { VerificationEmail } from '@/app/emails/VerificationEmail';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

// Check if environment variables are set
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase environment variables');
}

if (!process.env.RESEND_API_KEY) {
  console.error('Missing RESEND_API_KEY environment variable');
}

if (!process.env.PROJECT_URL) {
  console.error('Missing PROJECT_URL environment variable');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email, userName, email_verified')
      .eq('id', userId)
      .single();

    if (userError) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already verified
    if (userData.email_verified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      );
    }

    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiry

    // Delete any existing tokens for this user
    const { error: deleteError } = await supabase
      .from('verification_tokens')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error deleting old tokens:', deleteError);
    }

    // Insert new verification token (store hashed version)
    const { error: tokenError } = await supabase
      .from('verification_tokens')
      .insert({
        user_id: userId,
        token: hashedToken,
        expires_at: expiresAt.toISOString()
      });

    if (tokenError) {
      return NextResponse.json(
        { error: 'Failed to create verification token' },
        { status: 500 }
      );
    }

    // Create verification link - points directly to API route
    const verificationLink = `${process.env.PROJECT_URL}/api/resend/verify-token?token=${token}`;

    // Generate HTML email
    const emailHTML = VerificationEmail({
      userName: userData.userName || 'User',
      verificationLink: verificationLink
    });

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "SoundFolio <hello@updates.soundfolio.net>",
      to: userData.email,
      subject: "Verify Your SoundFolio Account",
      html: emailHTML,
    });

    if (emailError) {
      return NextResponse.json(
        { error: `Failed to send verification email: ${emailError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully'
    });

  } catch (error) {
    console.log("errro from send-verification", error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}