"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PatientAccessRequest } from "./patient-access-request";
import { OTPVerification } from "./otp-verification-form";
import { 
  Stethoscope, 
  LogOut, 
  User, 
  Mail, 
  Fingerprint,
  CheckCircle2
} from "lucide-react";

export function DoctorDashboardContent({ doctor }) {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [accessRequest, setAccessRequest] = useState(null);
  const [showOTP, setShowOTP] = useState(false);
  const handleAccessRequestSuccess = ({ requestId, patient }) => {
  setAccessRequest({ requestId, patientId: patient.id, patientName: patient.full_name });
  setShowOTP(true);
};

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Stethoscope className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Doctor Dashboard</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        {/* Doctor Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Doctor Profile</CardTitle>
                <CardDescription>Your professional information</CardDescription>
              </div>
              <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Verified
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar and Basic Info */}
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border-2 border-primary">
                <AvatarFallback className="bg-primary/10 text-xl">
                  {doctor.full_name?.charAt(0) || "D"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">Dr. {doctor.full_name}</h2>
                <p className="text-muted-foreground">{doctor.specialty || "General Practitioner"}</p>
              </div>
            </div>

            {/* Doctor Details */}
            <div className="grid gap-4 pt-4 border-t">
              {/* Doctor ID */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Fingerprint className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Doctor ID</p>
                  <p className="font-mono font-medium">{doctor.doctor_id}</p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{doctor.email}</p>
                </div>
              </div>

              {/* License Info (Optional to show) */}
              {doctor.license_number && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <User className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">License Number</p>
                    <p className="font-medium">{doctor.license_number}</p>
                    <p className="text-xs text-muted-foreground">{doctor.license_country}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Account Info */}
            <div className="text-xs text-muted-foreground pt-4 border-t">
              <p>Member since: {new Date(doctor.created_at).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Simple Footer Note */}
        <p className="text-center text-sm text-muted-foreground">
          More features coming soon...
        </p>

        {/* Access Request / OTP Verification */}
        {!showOTP ? (
          <PatientAccessRequest 
            onSuccess={handleAccessRequestSuccess} 
            doctorId={doctor.id} 
          />
        ) : (
          <OTPVerification 
            requestId={accessRequest.requestId}
            patientId={accessRequest.patientId}
            patientName={accessRequest.patientName}
            onCancel={() => setShowOTP(false)}
          />
        )}
      </div>
    </div>
  );
}