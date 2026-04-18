"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Key, CheckCircle2, AlertCircle, Clock } from "lucide-react";

export function OTPVerification({ requestId, patientId, patientName, onVerify, onCancel }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes in seconds
  const [success, setSuccess] = useState(false);
  
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    if (timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
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
      const pasted = value.slice(0, 6).split('');
      const newOtp = [...otp];
      pasted.forEach((digit, i) => {
        if (i < 6 && /^\d$/.test(digit)) {
          newOtp[i] = digit;
        }
      });
      setOtp(newOtp);
      
      // Auto-submit if all digits filled
      if (pasted.length === 6 && pasted.every(d => /^\d$/.test(d))) {
        setTimeout(() => handleVerify(), 100);
      }
    } else if (/^\d$/.test(value) || value === "") {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
      
      // Auto-submit if all digits filled
      if (newOtp.every(d => d !== "") && value) {
        setTimeout(() => handleVerify(), 100);
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
      // Verify OTP
      const { data: request, error: verifyError } = await supabase
        .from('access_requests')
        .select('*')
        .eq('id', requestId)
        .eq('otp_code', otpCode)
        .eq('status', 'pending')
        .gt('otp_expires_at', new Date().toISOString())
        .single();

      if (verifyError || !request) {
        throw new Error("Invalid OTP. Please try again.");
      }

      // Mark OTP as used
      await supabase
        .from('access_requests')
        .update({ status: 'approved', otp_used_at: new Date().toISOString() })
        .eq('id', requestId);

      // Create session (30 minutes)
      const sessionExpiry = new Date();
      sessionExpiry.setMinutes(sessionExpiry.getMinutes() + 30);

      const { data: session, error: sessionError } = await supabase
        .from('doctor_sessions')
        .insert({
          doctor_id: request.doctor_id,
          patient_id: patientId,
          access_request_id: requestId,
          expires_at: sessionExpiry.toISOString(),
          last_activity_at: new Date().toISOString()
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      setSuccess(true);
      
      // Store session info
      sessionStorage.setItem('activeDoctorSession', JSON.stringify({
        sessionId: session.id,
        patientId: patientId,
        patientName: patientName,
        expiresAt: sessionExpiry.toISOString()
      }));

      // Notify parent component
      if (onVerify) {
        onVerify({ sessionId: session.id, patientId });
      }
      
      // Redirect to patient view after 1 second
      setTimeout(() => {
        router.push(`/doctor/view-patient/${patientId}?session=${session.id}`);
      }, 1000);
      
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold">Access Granted!</h3>
          <p className="text-sm text-muted-foreground">Redirecting to patient records...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5 text-primary" />
          Enter Verification Code
        </CardTitle>
        <CardDescription>
          Please enter the 6-digit code sent to {patientName}'s email
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
            <AlertCircle className="h-4 w-4" />
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
              className="w-12 h-12 text-center text-xl font-mono"
              disabled={isLoading || timeLeft <= 0}
              autoFocus={index === 0}
            />
          ))}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleVerify} disabled={otp.some(d => d === "") || isLoading || timeLeft <= 0} className="flex-1">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify & Access"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}