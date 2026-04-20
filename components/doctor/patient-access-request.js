"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Fingerprint, Mail, CheckCircle2, AlertCircle } from "lucide-react";

export function PatientAccessRequest({ onSuccess }) {
  const [patientId, setPatientId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [patientInfo, setPatientInfo] = useState(null);
  
  const supabase = getSupabaseBrowserClient();

  const handleRequestAccess = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setPatientInfo(null);
    setIsLoading(true);

    try {
      // 1. Get current doctor
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Please login again");

      // 2. Get doctor_id from profiles table (doctor info is stored in profiles)
      const { data: doctor, error: doctorError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .eq('role', 'doctor')
        .single();

      if (doctorError || !doctor) {
        console.error("Doctor not found in profiles table:", doctorError);
        throw new Error("Doctor record not found. Please complete your doctor registration first.");
      }

      const doctorId = doctor.id;

      if (!doctorId) {
        console.error("Doctor ID is null");
        throw new Error("Doctor profile not found. Please complete your registration.");
      }

      console.log("Doctor ID:", doctorId);

      // 3. Validate patient ID format
      if (!patientId || patientId.length !== 8 || !/^\d{8}$/.test(patientId)) {
        throw new Error("Please enter a valid 8-digit Patient ID");
      }

      // 4. Find patient by ID
      const { data: patient, error: patientError } = await supabase
        .from('profiles')
        .select('id, email, full_name, date_of_birth, blood_type')
        .eq('patient_id', patientId)
        .single();

      if (patientError || !patient) {
        throw new Error("No patient found with this ID");
      }

      console.log("Patient found:", patient);

      // 5. Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 20);

      // 6. Store access request
      const { data: request, error: requestError } = await supabase
        .from('access_requests')
        .insert({
          doctor_id: doctorId,  // Use the UUID from doctors or profiles table
          patient_id: patient.id,
          patient_patient_id: patientId,
          otp_code: otp,
          otp_expires_at: expiresAt.toISOString(),
          status: 'pending'
        })
        .select()
        .single();

      if (requestError) {
        console.error("Request error:", requestError);
        throw new Error(requestError.message);
      }

      console.log("Access request created:", request);

      // 7. Send OTP via email (API route)
      const emailResponse = await fetch('/api/doctor/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientEmail: patient.email,
          patientName: patient.full_name,
          otp: otp,
          expiresIn: 20
        }),
      });

      if (!emailResponse.ok) {
        const errorData = await emailResponse.json();
        throw new Error(errorData.error || "Failed to send OTP email");
      }

      // 8. Store request info for OTP verification
      sessionStorage.setItem('pendingAccessRequest', JSON.stringify({
        requestId: request.id,
        patientId: patient.id,
        patientName: patient.full_name,
        patientEmail: patient.email,
        patientInfo: patient,
        expiresAt: expiresAt.toISOString()
      }));

      setPatientInfo(patient);
      setSuccess(`OTP sent to ${patient.email}. Please ask the patient for the 6-digit code.`);
      
      if (onSuccess) {
        onSuccess({ requestId: request.id, patient });
      }
      
    } catch (error) {
      console.error("Access request error:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="h-5 w-5 text-primary" />
          Access Patient Records
        </CardTitle>
        <CardDescription>
          Enter the patient's 8-digit ID to request access
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRequestAccess} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="patientId">Patient ID</Label>
            <div className="relative">
              <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="patientId"
                placeholder="Enter 8-digit ID (e.g., 10000001)"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value.replace(/\D/g, '').slice(0, 8))}
                maxLength={8}
                className="pl-9 font-mono text-lg"
                required
                disabled={isLoading}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              The patient ID is displayed on the patient's profile card
            </p>
          </div>

          {patientInfo && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm font-medium">Patient Found:</p>
              <p className="text-sm">{patientInfo.full_name}</p>
              <p className="text-xs text-muted-foreground">{patientInfo.email}</p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending OTP...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Request Access & Send OTP
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}