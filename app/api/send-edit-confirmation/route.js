import { Resend } from 'resend';
import { NextResponse } from 'next/server';

// Initialize Resend with error handling
const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.error('RESEND_API_KEY is not set in environment variables');
}

const resend = new Resend(resendApiKey);

export async function POST(request) {
  try {
    // Parse request body
    const body = await request.json();
    const { email, token, fullName } = body;

    console.log('Received request:', { email, token, fullName }); // Debug log

    // Validate required fields
    if (!email || !token) {
      return NextResponse.json(
        { error: 'Missing required fields: email and token are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if API key is configured
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      
      // For development, return success even without email
      if (process.env.NODE_ENV === 'development') {
        console.log('DEV MODE: Skipping email send');
        return NextResponse.json({ 
          success: true, 
          message: 'DEV MODE: Email would be sent',
          devMode: true,
          editUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/profile/edit?token=${token}`
        });
      }
      
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    // Construct the edit URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const editUrl = `${baseUrl}/dashboard/profile/edit?token=${token}`;

    console.log('Sending email to:', email); // Debug log
    console.log('Edit URL:', editUrl); // Debug log

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'HealthTrack <onboarding@resend.dev>', // Use Resend's default domain for testing
      to: email,
      subject: 'Confirm Your Profile Edit',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Edit Your Profile</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            
            <!-- Header -->
            <div style="padding: 40px 40px 20px 40px; text-align: center; border-bottom: 1px solid #e4e4e7;">
              <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); width: 64px; height: 64px; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 24px;">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <h1 style="font-size: 28px; font-weight: 700; color: #18181b; margin: 0 0 8px 0;">Edit Your Profile</h1>
              <p style="font-size: 16px; color: #71717a; margin: 0;">Hello ${fullName || 'there'},</p>
            </div>

            <!-- Content -->
            <div style="padding: 40px;">
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; margin-bottom: 32px;">
                <p style="font-size: 16px; line-height: 1.6; color: #334155; margin: 0 0 24px 0;">
                  We received a request to edit your profile information. Click the button below to securely edit your details:
                </p>
                
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${editUrl}" 
                     style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); 
                            color: #ffffff; 
                            padding: 16px 32px; 
                            border-radius: 12px; 
                            text-decoration: none; 
                            font-weight: 600; 
                            font-size: 16px;
                            display: inline-block;
                            box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
                    Edit Profile Now
                  </a>
                </div>

                <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin-top: 32px;">
                  <p style="font-size: 14px; font-weight: 600; color: #92400e; margin: 0 0 8px 0;">⚠️ Security Information</p>
                  <p style="font-size: 14px; color: #b45309; margin: 0;">
                    • This link will expire in <strong>30 minutes</strong><br>
                    • If you didn't request this, please ignore this email
                  </p>
                </div>
              </div>

              <div style="background-color: #f4f4f5; padding: 16px; border-radius: 8px;">
                <p style="font-size: 13px; color: #71717a; margin: 0 0 8px 0;">Or copy this link:</p>
                <p style="font-size: 13px; color: #2563eb; word-break: break-all; margin: 0; font-family: monospace;">
                  ${editUrl}
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div style="padding: 32px 40px 40px 40px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} HealthTrack. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to send email' },
        { status: 500 }
      );
    }

    console.log('Email sent successfully:', data); // Debug log

    return NextResponse.json({ 
      success: true, 
      message: 'Edit confirmation email sent successfully',
      id: data?.id 
    });
    
  } catch (error) {
    console.error('Error in send-edit-confirmation:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS if needed
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}