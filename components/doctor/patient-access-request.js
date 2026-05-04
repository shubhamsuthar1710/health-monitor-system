"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Fingerprint, Mail, CheckCircle2, AlertCircle, Smartphone, Send } from "lucide-react";

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function hashOTP(otp) {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function PatientAccessRequest({ onSuccess }) {
  const [patientId, setPatientId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [patientInfo, setPatientInfo] = useState(null);
  const [deliveryMethod, setDeliveryMethod] = useState("email"); // "email" or "sms"
  const [phoneNumber, setPhoneNumber] = useState("");
  
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

      // 2. Get doctor record from profiles table
      const { data: doctor, error: doctorError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', user.id)
        .eq('role', 'doctor')
        .single();

      if (doctorError || !doctor) {
        console.error("Doctor not found:", doctorError);
        throw new Error("Doctor record not found. Please complete your doctor registration first.");
      }

      const doctorId = doctor.id;
      console.log("Doctor ID:", doctorId);

      // 3. Validate patient ID format
      const trimmedPatientId = patientId.trim();
      if (!trimmedPatientId || trimmedPatientId.length !== 8 || !/^\d{8}$/.test(trimmedPatientId)) {
        throw new Error("Please enter a valid 8-digit Patient ID");
      }

      // 4. Find patient by ID
      const { data: patient, error: patientError } = await supabase
        .from('profiles')
        .select('id, email, full_name, date_of_birth, blood_type, phone')
        .eq('patient_id', trimmedPatientId)
        .single();

      if (patientError || !patient) {
        throw new Error("No patient found with this ID");
      }

      console.log("Patient found:", patient);

      // 5. Validate delivery method
      if (deliveryMethod === "sms") {
        if (!patient.phone) {
          throw new Error("Patient has not registered a phone number. Please use email OTP instead.");
        }
        // Store phone number for SMS
        setPhoneNumber(patient.phone);
      }

      // 6. Generate OTP
      const otp = generateOTP();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 20);

      // 7. Store access request
      const { data: request, error: requestError } = await supabase
        .from('access_requests')
        .insert({
          doctor_id: doctorId,
          patient_id: patient.id,
          patient_patient_id: trimmedPatientId,
          otp_code: otp,
          otp_expires_at: expiresAt.toISOString(),
          status: 'pending'
        })
        .select()
        .single();

      if (requestError) {
        console.error("Request error:", requestError);
        throw new Error(`Failed to create access request: ${requestError.message || requestError.code || 'Unknown error'}`);
      }

      console.log("Access request created:", request);

      // 8. Send OTP based on delivery method
      let otpSent = false;
      let actualDeliveryMethod = deliveryMethod;

      if (deliveryMethod === "sms") {
        // Send via 2Factor SMS
        const smsResponse = await fetch('/api/doctor/send-sms-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: patient.phone,
            patientName: patient.full_name,
            otp: otp,
            expiresIn: 20
          }),
        });

        const smsResult = await smsResponse.json();

        if (!smsResponse.ok) {
          console.error("SMS failed, trying email fallback:", smsResult);
          
          // Try email as fallback
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
            let emailErrorMsg = 'Unknown error';
            try {
              const emailErrorData = await emailResponse.json();
              emailErrorMsg = emailErrorData.error || emailErrorMsg;
            } catch {
              emailErrorMsg = await emailResponse.text();
            }
            throw new Error(`Failed to send OTP via SMS (${smsResult.error}) or email (${emailErrorMsg})`);
          }
          actualDeliveryMethod = "email";
          otpSent = true;
        } else {
          otpSent = true;
        }
      } else {
        // Send via Email (Resend)
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
          let emailErrorMsg = 'Failed to send OTP email';
          try {
            const errorData = await emailResponse.json();
            emailErrorMsg = errorData.error || emailErrorMsg;
          } catch {
            emailErrorMsg = await emailResponse.text();
          }
          throw new Error(emailErrorMsg);
        }
        otpSent = true;
      }

      if (!otpSent) {
        throw new Error("Failed to send OTP via selected method");
      }

      // 9. Store request info for OTP verification
      sessionStorage.setItem('pendingAccessRequest', JSON.stringify({
        requestId: request.id,
        patientId: patient.id,
        patientName: patient.full_name,
        patientEmail: patient.email,
        patientPhone: patient.phone,
        patientInfo: patient,
        expiresAt: expiresAt.toISOString(),
        deliveryMethod: actualDeliveryMethod
      }));

      setPatientInfo(patient);
      
      const deliveryMessage = actualDeliveryMethod === "sms" 
        ? `OTP sent via SMS to ${patient.phone}. Please ask the patient for the 6-digit code.`
        : `OTP sent to ${patient.email}. Please ask the patient for the 6-digit code.`;
      
      setSuccess(deliveryMessage);
      
      if (onSuccess) {
        onSuccess({ requestId: request.id, patient, deliveryMethod: actualDeliveryMethod });
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

          {/* Patient ID Input */}
          <div className="space-y-2">
            <Label htmlFor="patientId">Patient ID <span className="text-red-500">*</span></Label>
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

          {/* Delivery Method Selection */}
          <div className="space-y-2">
            <Label>Delivery Method</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="email"
                  checked={deliveryMethod === "email"}
                  onChange={(e) => setDeliveryMethod(e.target.value)}
                  className="w-4 h-4"
                  disabled={isLoading}
                />
                <Mail className="h-4 w-4" />
                <span className="text-sm">Email</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="sms"
                  checked={deliveryMethod === "sms"}
                  onChange={(e) => setDeliveryMethod(e.target.value)}
                  className="w-4 h-4"
                  disabled={isLoading}
                />
                <Smartphone className="h-4 w-4" />
                <span className="text-sm">SMS (Faster)</span>
              </label>
            </div>
            {deliveryMethod === "sms" && (
              <p className="text-xs text-muted-foreground">
                Patient must have a verified phone number in their profile
              </p>
            )}
          </div>

          {patientInfo && (
            <div className="bg-muted/50 p-3 rounded-lg space-y-1">
              <p className="text-sm font-medium">Patient Found:</p>
              <p className="text-sm">{patientInfo.full_name}</p>
              <p className="text-xs text-muted-foreground">{patientInfo.email}</p>
              {deliveryMethod === "sms" && patientInfo.phone && (
                <p className="text-xs text-muted-foreground">SMS to: {patientInfo.phone}</p>
              )}
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
                {deliveryMethod === "sms" ? (
                  <Send className="mr-2 h-4 w-4" />
                ) : (
                  <Mail className="mr-2 h-4 w-4" />
                )}
                Request Access & Send OTP via {deliveryMethod.toUpperCase()}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}