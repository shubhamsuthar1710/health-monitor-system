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
  const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes
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
      const pasted = value.slice(0, 6).split('');
      const newOtp = [...otp];
      pasted.forEach((digit, i) => {
        if (i < 6 && /^\d$/.test(digit)) {
          newOtp[i] = digit;
        }
      });
      setOtp(newOtp);
      
      if (pasted.length === 6 && pasted.every(d => /^\d$/.test(d))) {
        setTimeout(() => handleVerify(), 100);
      }
    } else if (/^\d$/.test(value) || value === "") {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
      
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
      // Hash the input OTP before verification
      const encoder = new TextEncoder();
      const data = encoder.encode(otpCode);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const otpHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Verify OTP using hashed value
      const { data: request, error: verifyError } = await supabase
        .from('access_requests')
        .select('*')
        .eq('id', requestId)
        .eq('otp_code', otpHash)
        .eq('status', 'pending')
        .gt('otp_expires_at', new Date().toISOString())
        .single();

      if (verifyError || !request) {
        throw new Error("Invalid OTP. Please try again.");
      }

      // Mark as used
      await supabase
        .from('access_requests')
        .update({ status: 'approved', otp_used_at: new Date().toISOString() })
        .eq('id', requestId);

      // Create session
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
      
      if (onVerify) {
        onVerify({ sessionId: session.id, patientId });
      }
      
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
        <CardContent className="pt-4 text-center">
          <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
          <h3 className="text-sm font-semibold">Access Granted!</h3>
          <p className="text-xs text-muted-foreground">Redirecting...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Key className="h-4 w-4 text-primary" />
          Enter Verification Code
        </CardTitle>
        <CardDescription className="text-xs">
          Please enter the 6-digit code sent to the patient
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="flex items-center justify-center gap-2 text-xs">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className={timeLeft < 60 ? "text-red-500 font-medium" : ""}>
            Code expires in {formatTime(timeLeft)}
          </span>
        </div>

        {error && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-3 w-3" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-center gap-1">
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
              className="w-10 h-10 text-center text-lg font-mono"
              disabled={isLoading || timeLeft <= 0}
              autoFocus={index === 0}
              required
            />
          ))}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} className="flex-1 text-sm py-1 h-8">
            Cancel
          </Button>
          <Button 
            onClick={handleVerify} 
            disabled={otp.some(d => d === "") || isLoading || timeLeft <= 0} 
            className="flex-1 text-sm py-1 h-8"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}