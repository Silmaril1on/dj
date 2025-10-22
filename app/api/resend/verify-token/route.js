import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  
  try {
    if (!token) {
      return NextResponse.redirect(`${process.env.PROJECT_URL}/`);
    }

    // Hash the incoming token to compare with stored hashed token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find the verification token using hashed version
    const { data: tokenData, error: tokenError } = await supabase
      .from('verification_tokens')
      .select('*')
      .eq('token', hashedToken)
      .is('verified_at', null)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.redirect(`${process.env.PROJECT_URL}/`);
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);

    if (now > expiresAt) {
      return NextResponse.redirect(`${process.env.PROJECT_URL}/`);
    }

    // Update user's email_verified status
    const { error: updateError } = await supabase
      .from('users')
      .update({
        email_verified: true,
        email_verified_at: new Date().toISOString()
      })
      .eq('id', tokenData.user_id);

    if (updateError) {
      console.error('User update error:', updateError);
      return NextResponse.redirect(`${process.env.PROJECT_URL}/`);
    }

    // Mark token as verified
    await supabase
      .from('verification_tokens')
      .update({ verified_at: new Date().toISOString() })
      .eq('token', hashedToken);

    // Send notification to user
    await supabase
      .from('notifications')
      .insert({
        user_id: tokenData.user_id,
        type: 'Email verification',
        title: 'Email Verified Successfully',
        message: 'Your email has been verified! You now have access to all platform features.',
        read: false
      });

    // Redirect to home page
    return NextResponse.redirect(`${process.env.PROJECT_URL}/`);

  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.redirect(`${process.env.PROJECT_URL}/`);
  }
}