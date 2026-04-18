"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Clock, 
  LogOut, 
  User, 
  Pill, 
  AlertTriangle, 
  Heart, 
  Users,
  FileText,
  Activity,
  Thermometer,
  Droplets,
  Scale,
  Phone,
  Calendar,
  ArrowLeft,
  Shield
} from "lucide-react";

function formatDate(dateString) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString();
}

function formatDateTime(dateString) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString();
}

function getEntryIcon(entryType) {
  switch (entryType) {
    case 'blood_pressure': return Heart;
    case 'heart_rate': return Activity;
    case 'temperature': return Thermometer;
    case 'blood_sugar': return Droplets;
    case 'weight': return Scale;
    default: return Activity;
  }
}

function getEntryLabel(entryType) {
  switch (entryType) {
    case 'blood_pressure': return 'Blood Pressure';
    case 'heart_rate': return 'Heart Rate';
    case 'temperature': return 'Temperature';
    case 'blood_sugar': return 'Blood Sugar';
    case 'weight': return 'Weight';
    default: return entryType;
  }
}

export function PatientFullView({ patientId, sessionId, patientData, doctorName, sessionExpiresAt }) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const router = useRouter();

  useEffect(() => {
    const calculateTimeLeft = () => {
      const expiresAt = new Date(sessionExpiresAt);
      const now = new Date();
      const secondsLeft = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeLeft(secondsLeft);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [sessionExpiresAt]);

  const handleEndSession = () => {
    router.push('/doctor/dashboard');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const { profile, medications, allergies, conditions, familyHistory, healthEntries, emergencyContacts } = patientData;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/doctor/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-lg font-semibold">{profile?.full_name || 'Patient'}</h1>
              <p className="text-sm text-muted-foreground">Patient ID: {profile?.patient_id || patientId.slice(0, 8)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200">
              <Clock className="h-4 w-4 text-amber-600" />
              <span className={`text-sm font-medium ${timeLeft < 300 ? 'text-red-600' : 'text-amber-700'}`}>
                Session: {formatTime(timeLeft)}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={handleEndSession} className="gap-2">
              <LogOut className="h-4 w-4" />
              End Session
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Patient Info Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{profile?.full_name || 'Unknown'}</h2>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span>ID: {profile?.patient_id || 'N/A'}</span>
                    {profile?.date_of_birth && <span>DOB: {formatDate(profile.date_of_birth)}</span>}
                    {profile?.blood_type && <span className="font-medium text-primary">Blood: {profile.blood_type}</span>}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {profile?.height_cm && (
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Height</p>
                    <p className="font-medium">{profile.height_cm} cm</p>
                  </div>
                )}
                {profile?.weight_kg && (
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Weight</p>
                    <p className="font-medium">{profile.weight_kg} kg</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 w-full justify-start overflow-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="vitals">Vitals</TabsTrigger>
            <TabsTrigger value="medications">Medications</TabsTrigger>
            <TabsTrigger value="allergies">Allergies</TabsTrigger>
            <TabsTrigger value="conditions">Conditions</TabsTrigger>
            <TabsTrigger value="history">Family History</TabsTrigger>
            <TabsTrigger value="emergency">Emergency</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Quick Stats */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Pill className="h-4 w-4 text-violet-500" />
                    Medications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{medications.filter(m => m.is_active).length}</p>
                  <p className="text-sm text-muted-foreground">Active</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Allergies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{allergies.length}</p>
                  <p className="text-sm text-muted-foreground">Recorded</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    Conditions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{conditions.length}</p>
                  <p className="text-sm text-muted-foreground">Chronic</p>
                </CardContent>
              </Card>

              {/* Recent Vitals */}
              <Card className="md:col-span-2 lg:col-span-3">
                <CardHeader>
                  <CardTitle className="text-base">Recent Vitals</CardTitle>
                </CardHeader>
                <CardContent>
                  {healthEntries.length > 0 ? (
                    <div className="space-y-3">
                      {healthEntries.slice(0, 5).map((entry, i) => {
                        const Icon = getEntryIcon(entry.entry_type);
                        return (
                          <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <Icon className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{getEntryLabel(entry.entry_type)}</p>
                                <p className="text-xs text-muted-foreground">{formatDateTime(entry.recorded_at)}</p>
                              </div>
                            </div>
                            <p className="font-semibold">{entry.value} {entry.unit}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No health entries recorded</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Vitals Tab */}
          <TabsContent value="vitals">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">All Health Entries</CardTitle>
              </CardHeader>
              <CardContent>
                {healthEntries.length > 0 ? (
                  <div className="space-y-3">
                    {healthEntries.map((entry, i) => {
                      const Icon = getEntryIcon(entry.entry_type);
                      return (
                        <div key={i} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-primary/10">
                              <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{getEntryLabel(entry.entry_type)}</p>
                              <p className="text-sm text-muted-foreground">{formatDateTime(entry.recorded_at)}</p>
                              {entry.notes && <p className="text-xs text-muted-foreground mt-1">{entry.notes}</p>}
                            </div>
                          </div>
                          <p className="text-xl font-bold">{entry.value} {entry.unit}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No health entries recorded</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Medications Tab */}
          <TabsContent value="medications">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Medications</CardTitle>
              </CardHeader>
              <CardContent>
                {medications.length > 0 ? (
                  <div className="space-y-3">
                    {medications.map((med, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{med.name}</p>
                            {med.is_active ? (
                              <Badge className="bg-green-100 text-green-700">Active</Badge>
                            ) : (
                              <Badge variant="outline">Inactive</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{med.dosage} - {med.frequency}</p>
                          {med.notes && <p className="text-xs text-muted-foreground mt-1">{med.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No medications recorded</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Allergies Tab */}
          <TabsContent value="allergies">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Allergies</CardTitle>
              </CardHeader>
              <CardContent>
                {allergies.length > 0 ? (
                  <div className="space-y-3">
                    {allergies.map((allergy, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-amber-100">
                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-medium">{allergy.allergen}</p>
                            <p className="text-sm text-muted-foreground capitalize">Severity: {allergy.severity}</p>
                            {allergy.reaction && <p className="text-xs text-muted-foreground mt-1">Reaction: {allergy.reaction}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No allergies recorded</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Conditions Tab */}
          <TabsContent value="conditions">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Chronic Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                {conditions.length > 0 ? (
                  <div className="space-y-3">
                    {conditions.map((condition, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-red-100">
                            <Heart className="h-5 w-5 text-red-600" />
                          </div>
                          <div>
                            <p className="font-medium">{condition.condition_name}</p>
                            {condition.diagnosed_date && (
                              <p className="text-sm text-muted-foreground">Diagnosed: {formatDate(condition.diagnosed_date)}</p>
                            )}
                            {condition.notes && <p className="text-xs text-muted-foreground mt-1">{condition.notes}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No chronic conditions recorded</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Family History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Family History</CardTitle>
              </CardHeader>
              <CardContent>
                {familyHistory.length > 0 ? (
                  <div className="space-y-3">
                    {familyHistory.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-blue-100">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{item.condition}</p>
                            <p className="text-sm text-muted-foreground capitalize">Relationship: {item.relationship}</p>
                            {item.age_of_onset && <p className="text-xs text-muted-foreground">Age of onset: {item.age_of_onset}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No family history recorded</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Emergency Tab */}
          <TabsContent value="emergency">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Phone className="h-5 w-5 text-red-500" />
                  Emergency Contacts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {emergencyContacts.length > 0 ? (
                  <div className="space-y-3">
                    {emergencyContacts.map((contact, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-red-100">
                            <Phone className="h-5 w-5 text-red-600" />
                          </div>
                          <div>
                            <p className="font-medium">{contact.name}</p>
                            <p className="text-sm text-muted-foreground capitalize">{contact.relation}</p>
                          </div>
                        </div>
                        <p className="font-semibold text-lg">{contact.phone}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No emergency contacts recorded</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}