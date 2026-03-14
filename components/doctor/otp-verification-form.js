"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Clock, CheckCircle } from "lucide-react";

export function OTPVerification() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes in seconds
  const [pendingAccess, setPendingAccess] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Get pending access from session storage
    const stored = sessionStorage.getItem('pendingAccess');
    if (stored) {
      const data = JSON.parse(stored);
      setPendingAccess(data);
      
      // Calculate time left
      const expiresAt = new Date(data.expiresAt);
      const now = new Date();
      const secondsLeft = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeLeft(secondsLeft);
    } else {
      router.push('/doctor/access');
    }
  }, [router]);

  useEffect(() => {
    if (timeLeft <= 0) {
      setError("OTP has expired. Please request a new one.");
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste
      const pastedOtp = value.slice(0, 6).split('');
      const newOtp = [...otp];
      pastedOtp.forEach((digit, i) => {
        if (i < 6 && /^\d$/.test(digit)) {
          newOtp[i] = digit;
        }
      });
      setOtp(newOtp);
      
      // Focus next empty or last input
      const nextIndex = Math.min(5, pastedOtp.length);
      const nextInput = document.getElementById(`otp-${nextIndex}`);
      if (nextInput) nextInput.focus();
    } else if (/^\d$/.test(value) || value === "") {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    if (timeLeft <= 0) {
      setError("OTP has expired. Please request a new one.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();

      // Verify OTP
      const { data: accessRequest, error: requestError } = await supabase
        .from('access_requests')
        .select('*')
        .eq('doctor_id', pendingAccess.doctorId)
        .eq('patient_id', pendingAccess.patientId)
        .eq('otp_code', otpCode)
        .eq('status', 'pending')
        .gt('otp_expires_at', new Date().toISOString())
        .single();

      if (requestError || !accessRequest) {
        setError("Invalid or expired OTP. Please try again.");
        return;
      }

      // Mark OTP as used
      await supabase
        .from('access_requests')
        .update({ 
          status: 'approved',
          otp_used_at: new Date().toISOString()
        })
        .eq('id', accessRequest.id);

      // Check for existing active session
      const { data: existingSession } = await supabase
        .from('doctor_sessions')
        .select('*')
        .eq('patient_id', pendingAccess.patientId)
        .is('terminated_at', null)
        .single();

      if (existingSession) {
        // Terminate existing session
        await supabase
          .from('doctor_sessions')
          .update({ 
            terminated_at: new Date().toISOString(),
            terminated_by: 'new_session'
          })
          .eq('id', existingSession.id);
      }

      // Create new session (expires in 30 minutes)
      const sessionExpiry = new Date();
      sessionExpiry.setMinutes(sessionExpiry.getMinutes() + 30);

      const { data: session, error: sessionError } = await supabase
        .from('doctor_sessions')
        .insert({
          doctor_id: pendingAccess.doctorId,
          patient_id: pendingAccess.patientId,
          access_request_id: accessRequest.id,
          expires_at: sessionExpiry.toISOString(),
          last_activity_at: new Date().toISOString()
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Store session info
      sessionStorage.setItem('activeSession', JSON.stringify({
        sessionId: session.id,
        patientId: pendingAccess.patientId,
        patientName: pendingAccess.patientName,
        expiresAt: sessionExpiry.toISOString()
      }));

      // Clear pending access
      sessionStorage.removeItem('pendingAccess');

      // Redirect to patient view
      router.push(`/doctor/access/session/${pendingAccess.patientId}`);

    } catch (error) {
      console.error("Verification error:", error);
      setError("Failed to verify OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!pendingAccess) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verify Access</CardTitle>
        <CardDescription>
          Enter the 6-digit code sent to {pendingAccess.patientName}'s email
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timer */}
        <div className="flex items-center justify-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className={timeLeft < 60 ? "text-destructive font-medium" : ""}>
            Code expires in {formatTime(timeLeft)}
          </span>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* OTP Input */}
        <div className="flex justify-center gap-2">
          {otp.map((digit, index) => (
            <Input
              key={index}
              id={`otp-${index}`}
              type="text"
              inputMode="numeric"
              pattern="\d*"
              maxLength={6}
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-12 text-center text-lg font-mono"
              disabled={isLoading || timeLeft <= 0}
            />
          ))}
        </div>

        <Button 
          onClick={handleVerify} 
          className="w-full"
          disabled={isLoading || otp.join("").length !== 6 || timeLeft <= 0}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Verify & Access Records
            </>
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Didn't receive the code?{" "}
          <button 
            onClick={() => router.push('/doctor/access')}
            className="text-primary hover:underline"
          >
            Request again
          </button>
        </p>
      </CardContent>
    </Card>
  );
}