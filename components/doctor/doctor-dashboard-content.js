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
    <div className="h-full p-2 overflow-hidden">
      <div className="h-full flex flex-col max-w-2xl mx-auto space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Stethoscope className="h-4 w-4 text-primary" />
            </div>
            <h1 className="text-lg font-bold">Doctor Dashboard</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        {/* Doctor Profile Card */}
        <Card className="flex-1 overflow-y-auto">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Doctor Profile</CardTitle>
                <CardDescription className="text-xs">Your professional information</CardDescription>
              </div>
              <Badge className="bg-green-100 text-green-700 border-green-200 gap-1 text-xs">
                <CheckCircle2 className="h-3 w-3" />
                Verified
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {/* Avatar and Basic Info */}
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-primary">
                <AvatarFallback className="bg-primary/10 text-lg">
                  {doctor.full_name?.charAt(0) || "D"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg font-bold">Dr. {doctor.full_name}</h2>
                <p className="text-xs text-muted-foreground">{doctor.specialty || "General Practitioner"}</p>
              </div>
            </div>

            {/* Doctor Details */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t">
              {/* Doctor ID */}
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                <Fingerprint className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Doctor ID</p>
                  <p className="font-mono text-xs font-medium">{doctor.doctor_id}</p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                <Mail className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-xs font-medium truncate">{doctor.email}</p>
                </div>
              </div>

              {/* License Info (Optional to show) */}
              {doctor.license_number && (
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg col-span-2">
                  <User className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">License</p>
                    <p className="text-xs font-medium">{doctor.license_number}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Account Info */}
            {/* Account Info */}
            <div className="text-xs text-muted-foreground pt-2 border-t">
              <p>Member since: {new Date(doctor.created_at).toLocaleDateString('en-CA')}</p>
            </div>
          </CardContent>
        </Card>

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