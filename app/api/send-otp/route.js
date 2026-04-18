import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { patientEmail, patientName, otp, expiresIn } = await request.json();

    if (!patientEmail || !otp) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: 'HealthTrack <notifications@healthtrack.com>',
      to: patientEmail,
      subject: 'Doctor Access Request - Verification Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Doctor Access Request</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
          <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; padding: 40px; text-align: center;">
            <div style="background-color: #2563eb; width: 60px; height: 60px; border-radius: 30px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 24px;">
              <span style="color: white; font-size: 28px;">🏥</span>
            </div>
            
            <h1 style="font-size: 24px; font-weight: 600; margin: 0 0 8px;">Doctor Access Request</h1>
            <p style="color: #6b7280; margin: 0 0 32px;">A doctor is requesting access to your health records</p>
            
            <div style="background-color: #f3f4f6; padding: 24px; border-radius: 12px; margin-bottom: 32px;">
              <p style="font-size: 14px; color: #6b7280; margin: 0 0 8px;">Your verification code is:</p>
              <p style="font-size: 48px; font-weight: bold; letter-spacing: 8px; color: #2563eb; margin: 0;">${otp}</p>
              <p style="font-size: 14px; color: #6b7280; margin: 16px 0 0;">This code expires in ${expiresIn || 20} minutes</p>
            </div>
            
            <div style="background-color: #fef3c7; padding: 16px; border-radius: 8px; margin-bottom: 32px;">
              <p style="font-size: 14px; color: #92400e; margin: 0;">
                ⚠️ Never share this code with anyone. Only share it with your doctor in person or over a verified call.
              </p>
            </div>
            
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">
              If you didn't request this, please ignore this email.<br>
              © 2026 HealthTrack. All rights reserved.
            </p>
          </div>
        </body>
        </html>
      `
    });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
    
  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send OTP' },
      { status: 500 }
    );
  }
}