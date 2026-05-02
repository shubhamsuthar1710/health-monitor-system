import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { phoneNumber, patientName, otp, expiresIn } = await request.json();

    if (!phoneNumber || !otp) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Clean phone number (remove any non-digit characters)
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // Add country code if not present (assuming Indian numbers)
    const finalPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

    // Build 2Factor API URL
    const baseUrl = `https://2factor.in/API/R1/?module=SMS_OTP&apikey=${process.env.TWOFACTOR_API_KEY}&to=${finalPhone}`;
    const senderId = process.env.TWOFACTOR_SENDER || 'HEALTHTRK';
    const templateId = process.env.TWOFACTOR_TEMPLATE_ID ? `&template_id=${process.env.TWOFACTOR_TEMPLATE_ID}` : '';
    const message = `Your HealthTrack verification code is ${otp}. Valid for ${expiresIn || 20} minutes.`;
    const apiUrl = `${baseUrl}&from=${senderId}${templateId}&msg=${encodeURIComponent(message)}`;

    console.log("Sending SMS via 2Factor API...");

    const response = await fetch(apiUrl);
    const result = await response.json();

    console.log("2Factor SMS Response:", result);

    if (result.Status === 'Success') {
      return NextResponse.json({ 
        success: true, 
        sessionId: result.Details,
        message: 'OTP sent successfully via SMS'
      });
    } else {
      return NextResponse.json(
        { error: result.Details || 'Failed to send SMS' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error sending SMS:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send SMS' },
      { status: 500 }
    );
  }
}
