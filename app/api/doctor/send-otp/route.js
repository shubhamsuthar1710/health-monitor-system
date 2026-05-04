import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const emailHtmlTemplate = ({ patientName, otp, expiresIn }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HealthTrack Verification Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
            <!-- Header -->
            <tr>
              <td style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 32px 40px; text-align: center;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center">
                      <div style="width: 48px; height: 48px; background-color: rgba(255, 255, 255, 0.2); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                        </svg>
                      </div>
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">HealthTrack</h1>
                      <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.85); font-size: 14px;">Secure Health Records Access</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            
            <!-- Body -->
            <tr>
              <td style="padding: 40px;">
                <p style="margin: 0 0 24px 0; color: #1e293b; font-size: 16px; line-height: 1.5;">
                  Hello <strong>${patientName}</strong>,
                </p>
                <p style="margin: 0 0 32px 0; color: #475569; font-size: 16px; line-height: 1.5;">
                  A healthcare provider has requested access to your health records. Please share the verification code below with them.
                </p>
                
                <!-- OTP Box -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                  <tr>
                    <td align="center">
                      <p style="margin: 0 0 12px 0; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Your Verification Code</p>
                      <div style="font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace; font-size: 36px; font-weight: 700; letter-spacing: 12px; color: #0f172a;">${otp}</div>
                    </td>
                  </tr>
                </table>
                
                <!-- Expiry Notice -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                  <tr>
                    <td align="center">
                      <p style="margin: 0; color: #92400e; font-size: 14px;">
                        <strong>⏱ This code expires in ${expiresIn || 20} minutes</strong>
                      </p>
                    </td>
                  </tr>
                </table>
                
                <!-- Security Warning -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px;">
                  <tr>
                    <td>
                      <p style="margin: 0; color: #991b1b; font-size: 13px; line-height: 1.5;">
                        <strong>⚠️ Security Notice:</strong> Never share this code with anyone except the authorized healthcare provider. HealthTrack staff will never ask for this code.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            
            <!-- Footer -->
            <tr>
              <td style="background-color: #f1f5f9; padding: 24px 40px; text-align: center;">
                <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px;">
                  This is an automated message from HealthTrack. Please do not reply to this email.
                </p>
                <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                  © ${new Date().getFullYear()} HealthTrack. All rights reserved.
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

export async function POST(request) {
  try {
    const body = await request.json();
    const { patientEmail, patientName, otp, expiresIn } = body;

    if (!patientEmail || !otp) {
      return NextResponse.json(
        { error: 'Missing required fields: patientEmail and otp are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('RESEND_API_KEY is not configured');
      return NextResponse.json(
        { error: 'Email service is not configured. Please set RESEND_API_KEY.' },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from: 'HealthTrack <onboarding@resend.dev>',
      to: [patientEmail],
      subject: '🔐 Your HealthTrack Verification Code',
      html: emailHtmlTemplate({ patientName: patientName || 'Patient', otp, expiresIn })
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send email. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      emailId: data.id,
      message: 'OTP sent successfully via email'
    });
    
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}
