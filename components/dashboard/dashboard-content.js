"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Heart, Pill, AlertTriangle, Phone, Plus, Clock, Thermometer, Droplets, Scale } from "lucide-react";
import Link from "next/link";
import { QuickEntryDialog } from "./quick-entry-dialog";
import { useState, useEffect } from "react";

const entryTypeIcons = {
  blood_pressure: Heart,
  heart_rate: Activity,
  temperature: Thermometer,
  blood_sugar: Droplets,
  weight: Scale,
};

const entryTypeLabels = {
  blood_pressure: "Blood Pressure",
  heart_rate: "Heart Rate",
  temperature: "Temperature",
  blood_sugar: "Blood Sugar",
  weight: "Weight",
};

function formatEntryValue(entry) {
  if (entry.value === null) return "N/A";
  return `${entry.value} ${entry.unit || ""}`.trim();
}

// FIXED: Use useEffect to handle client-side only date formatting
function useFormattedDate(dateString) {
  const [formattedDate, setFormattedDate] = useState("");

  useEffect(() => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
      setFormattedDate("Just now");
    } else if (diffHours < 24) {
      setFormattedDate(`${diffHours}h ago`);
    } else if (diffDays < 7) {
      setFormattedDate(`${diffDays}d ago`);
    } else {
      setFormattedDate(date.toLocaleDateString());
    }
  }, [dateString]);

  return formattedDate;
}

// FIXED: Simple component to handle date formatting
function EntryDate({ dateString }) {
  const formattedDate = useFormattedDate(dateString);
  
  // Return a placeholder during SSR, then update on client
  if (!formattedDate) {
    return <span className="text-xs text-muted-foreground">Just now</span>;
  }
  
  return <span className="text-xs text-muted-foreground">{formattedDate}</span>;
}

export function DashboardContent({ 
  user, 
  profile, 
  recentEntries, 
  medications, 
  allergies, 
  emergencyContact,
}) {
  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // FIXED: Ensure we only show dynamic content after client hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  const firstName = profile?.full_name?.split(" ")[0] || user.email?.split("@")[0] || "there";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {firstName}
          </h1>
          <p className="text-muted-foreground">Here's your health overview</p>
        </div>
        <Button onClick={() => setIsQuickEntryOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Quick Entry
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-1/10">
                <Activity className="h-5 w-5 text-chart-1" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recent Entries</p>
                <p className="text-2xl font-semibold">{recentEntries.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-2/10">
                <Pill className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Medications</p>
                <p className="text-2xl font-semibold">{medications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-3/10">
                <AlertTriangle className="h-5 w-5 text-chart-3" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Known Allergies</p>
                <p className="text-2xl font-semibold">{allergies.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-4/10">
                <Heart className="h-5 w-5 text-chart-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Blood Type</p>
                <p className="text-2xl font-semibold">
                  {profile?.blood_type || "Not set"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Health Entries</CardTitle>
              <CardDescription>Your latest recorded health data</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/timeline">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentEntries.length > 0 ? (
              <div className="space-y-3">
                {recentEntries.map((entry) => {
                  const Icon = entryTypeIcons[entry.entry_type] || Activity;
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-background">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {entryTypeLabels[entry.entry_type] || entry.entry_type}
                          </p>
                          {/* FIXED: Use the new EntryDate component */}
                          <EntryDate dateString={entry.recorded_at} />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatEntryValue(entry)}</p>
                        {entry.notes && (
                          <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                            {entry.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No health entries yet</p>
                <Button
                  variant="link"
                  className="mt-2"
                  onClick={() => setIsQuickEntryOpen(true)}
                >
                  Add your first entry
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Pill className="h-4 w-4" />
                  Current Medications
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/profile#medications">Edit</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {medications.length > 0 ? (
                <div className="space-y-2">
                  {medications.slice(0, 3).map((med) => (
                    <div key={med.id} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{med.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {med.dosage}
                      </span>
                    </div>
                  ))}
                  {medications.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{medications.length - 3} more
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No medications added
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Allergies
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/profile#allergies">Edit</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {allergies.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {allergies.map((allergy) => (
                    <Badge
                      key={allergy.id}
                      variant={allergy.severity === "severe" ? "destructive" : "secondary"}
                    >
                      {allergy.allergen}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No allergies recorded
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Emergency Contact
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/settings#emergency">Edit</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {emergencyContact ? (
                <div>
                  <p className="font-medium text-sm">{emergencyContact.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {emergencyContact.relationship}
                  </p>
                  <p className="text-sm mt-1">{emergencyContact.phone}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No emergency contact set
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <QuickEntryDialog open={isQuickEntryOpen} onOpenChange={setIsQuickEntryOpen} />
    </div>
  );
}