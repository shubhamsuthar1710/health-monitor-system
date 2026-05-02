// app/api/doctor/verify-sms-otp/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  const { sessionId, otp } = await request.json();
  
  const verifyUrl = `https://2factor.in/API/R1/?module=VERIFY_OTP&apikey=${process.env.TWOFACTOR_API_KEY}&otp=${otp}&session_id=${sessionId}`;
  
  const response = await fetch(verifyUrl);
  const result = await response.json();
  
  // 2Factor returns: { Status: "Success", Details: "OTP Matched" }
  return NextResponse.json({ verified: result.Status === 'Success' });
}