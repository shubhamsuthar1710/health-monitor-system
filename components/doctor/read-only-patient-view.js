"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Clock, 
  LogOut, 
  Eye, 
  User, 
  Pill, 
  AlertTriangle, 
  Heart, 
  Users,
  FileText,
  Download
} from "lucide-react";

export function ReadOnlyPatientView({ patientId, sessionId, patientData }) {
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes in seconds
  const [activeTab, setActiveTab] = useState("profile");
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    // Calculate time left from session expiry
    const stored = sessionStorage.getItem('activeSession');
    if (stored) {
      const session = JSON.parse(stored);
      const expiresAt = new Date(session.expiresAt);
      const now = new Date();
      const secondsLeft = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeLeft(secondsLeft);
    }

    // Set up activity heartbeat
    const heartbeat = setInterval(async () => {
      await supabase
        .from('doctor_sessions')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', sessionId);
    }, 60000); // Update every minute

    // Check session expiry every second
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          clearInterval(heartbeat);
          router.push('/doctor/access?expired=true');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(heartbeat);
    };
  }, [sessionId, router, supabase]);

  const handleEndSession = async () => {
    await supabase
      .from('doctor_sessions')
      .update({ 
        terminated_at: new Date().toISOString(),
        terminated_by: 'doctor'
      })
      .eq('id', sessionId);

    sessionStorage.removeItem('activeSession');
    router.push('/doctor/access');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Session Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-full">
              <Eye className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                  Read Only Access
                </Badge>
                <span className="text-sm text-amber-700">
                  You're viewing {patientData.profile?.full_name || 'patient'}'s records
                </span>
              </div>
              <p className="text-xs text-amber-600 mt-1">
                All actions are logged for security purposes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-700" />
              <span className={`text-sm font-medium ${timeLeft < 60 ? "text-destructive" : "text-amber-700"}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleEndSession}
              className="border-amber-300 hover:bg-amber-100"
            >
              <LogOut className="h-4 w-4 mr-2" />
              End Session
            </Button>
          </div>
        </div>
      </div>

      {/* Patient Info Header */}
      <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
        <Avatar className="h-16 w-16 border-2 border-primary">
          <AvatarImage src={patientData.profile?.avatar_url} />
          <AvatarFallback className="bg-primary/10 text-xl">
            {patientData.profile?.full_name?.charAt(0) || "P"}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{patientData.profile?.full_name || "Patient"}</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-sm text-muted-foreground">
              Patient ID: {patientData.profile?.patient_id}
            </p>
            {patientData.profile?.blood_type && (
              <Badge variant="outline">{patientData.profile.blood_type}</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="medications" className="gap-2">
            <Pill className="h-4 w-4" />
            Medications
          </TabsTrigger>
          <TabsTrigger value="allergies" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Allergies
          </TabsTrigger>
          <TabsTrigger value="conditions" className="gap-2">
            <Heart className="h-4 w-4" />
            Conditions
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Basic health profile</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">{patientData.profile?.full_name || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{patientData.profile?.email || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">{formatDate(patientData.profile?.date_of_birth)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Blood Type</p>
                  <p className="font-medium">{patientData.profile?.blood_type || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Height</p>
                  <p className="font-medium">{patientData.profile?.height_cm ? `${patientData.profile.height_cm} cm` : "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Weight</p>
                  <p className="font-medium">{patientData.profile?.weight_kg ? `${patientData.profile.weight_kg} kg` : "Not specified"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medications Tab */}
        <TabsContent value="medications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Medications</CardTitle>
              <CardDescription>Active prescriptions and medications</CardDescription>
            </CardHeader>
            <CardContent>
              {patientData.medications.length > 0 ? (
                <div className="space-y-3">
                  {patientData.medications.map((med) => (
                    <div key={med.id} className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{med.name}</p>
                        <Badge variant={med.is_active ? "default" : "secondary"}>
                          {med.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {[med.dosage, med.frequency].filter(Boolean).join(" - ") || "No dosage details"}
                      </p>
                      {med.notes && (
                        <p className="text-xs text-muted-foreground mt-2">{med.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No medications recorded
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Allergies Tab */}
        <TabsContent value="allergies" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Allergies</CardTitle>
              <CardDescription>Known allergic reactions</CardDescription>
            </CardHeader>
            <CardContent>
              {patientData.allergies.length > 0 ? (
                <div className="space-y-3">
                  {patientData.allergies.map((allergy) => (
                    <div key={allergy.id} className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{allergy.allergen}</p>
                        {allergy.severity && (
                          <Badge variant={
                            allergy.severity === "high" ? "destructive" : 
                            allergy.severity === "medium" ? "default" : "secondary"
                          }>
                            {allergy.severity}
                          </Badge>
                        )}
                      </div>
                      {allergy.reaction && (
                        <p className="text-sm text-muted-foreground mt-1">{allergy.reaction}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No allergies recorded
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conditions Tab */}
        <TabsContent value="conditions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Chronic Conditions</CardTitle>
              <CardDescription>Ongoing health conditions</CardDescription>
            </CardHeader>
            <CardContent>
              {patientData.conditions.length > 0 ? (
                <div className="space-y-3">
                  {patientData.conditions.map((condition) => (
                    <div key={condition.id} className="p-3 rounded-lg bg-muted/50">
                      <p className="font-medium">{condition.condition_name}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {condition.diagnosed_date
                          ? `Diagnosed: ${new Date(condition.diagnosed_date).toLocaleDateString()}`
                          : "Diagnosis date not specified"}
                      </p>
                      {condition.notes && (
                        <p className="text-xs text-muted-foreground mt-2">{condition.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No conditions recorded
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Medical Documents</CardTitle>
              <CardDescription>Uploaded files and records</CardDescription>
            </CardHeader>
            <CardContent>
              {patientData.documents.length > 0 ? (
                <div className="space-y-3">
                  {patientData.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{doc.title || doc.file_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {doc.document_type?.replace('_', ' ') || 'Other'}
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            {doc.file_size ? `${Math.round(doc.file_size / 1024)} KB` : ''}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" asChild>
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No documents uploaded
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Read-only footer */}
      <div className="text-center text-xs text-muted-foreground border-t pt-4">
        <p>
          This is a read-only view. All actions are logged and monitored. 
          Session expires automatically after 30 minutes of inactivity.
        </p>
      </div>
    </div>
  );
}