"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Fingerprint, Mail } from "lucide-react";

export function PatientAccessRequest() {
  const [patientId, setPatientId] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const router = useRouter();

  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleRequestAccess = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();

      // 1. Verify patient exists
      const { data: patient, error: patientError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('patient_id', patientId)
        .single();

      if (patientError || !patient) {
        setError("Patient not found. Please check the ID and try again.");
        return;
      }

      // 2. Get current doctor
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: doctor, error: doctorError } = await supabase
        .from('doctors')
        .select('id, full_name')
        .eq('user_id', user.id)
        .single();

      if (doctorError || !doctor) {
        setError("Doctor profile not found. Please complete registration.");
        return;
      }

      // 3. Check if doctor is verified
      const { data: verification } = await supabase
        .from('doctors')
        .select('verification_status')
        .eq('user_id', user.id)
        .single();

      if (verification?.verification_status !== 'verified') {
        setError("Your account is pending verification. You cannot access patient records yet.");
        return;
      }

      // 4. Generate OTP and expiry (20 minutes)
      const otp = generateOTP();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 20);

      // 5. Store access request (reusing your edit_confirmations pattern)
      const { error: requestError } = await supabase
        .from('access_requests')
        .insert({
          doctor_id: doctor.id,
          patient_id: patient.id,
          patient_patient_id: patientId,
          otp_code: otp,
          otp_expires_at: expiresAt.toISOString(),
          status: 'pending'
        });

      if (requestError) {
        // If table doesn't exist, create it via migration
        console.error("Access request error:", requestError);
        setError("Access request system not fully configured.");
        return;
      }

      // 6. Send OTP via email (using your existing email system)
      const response = await fetch('/api/send-doctor-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientEmail: patient.email,
          patientName: patient.full_name,
          doctorName: doctor.full_name,
          otp: otp
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send OTP email');
      }

      // 7. Store session info and redirect
      sessionStorage.setItem('pendingAccess', JSON.stringify({
        patientId: patient.id,
        patientName: patient.full_name,
        doctorId: doctor.id,
        patientIdNumber: patientId,
        expiresAt: expiresAt.toISOString()
      }));

      setOtpSent(true);
      
      // Redirect to OTP verification page
      setTimeout(() => {
        router.push('/doctor/access/verify-otp');
      }, 1500);

    } catch (error) {
      console.error("Access request error:", error);
      setError(error.message || "Failed to request access. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="h-5 w-5" />
          Access Patient Records
        </CardTitle>
        <CardDescription>
          Enter the patient's 8-digit ID to request access
        </CardDescription>
      </CardHeader>
      <CardContent>
        {otpSent ? (
          <div className="text-center py-4">
            <Mail className="h-12 w-12 text-primary mx-auto mb-3" />
            <h3 className="font-medium">OTP Sent!</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Redirecting to verification page...
            </p>
          </div>
        ) : (
          <form onSubmit={handleRequestAccess} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="patientId">Patient ID</Label>
              <Input
                id="patientId"
                placeholder="Enter 8-digit ID (e.g., 12345678)"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                maxLength={8}
                pattern="\d{8}"
                required
                disabled={isLoading}
                className="text-center text-lg font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Patient ID is an 8-digit number displayed on their profile
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Request Access"
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}