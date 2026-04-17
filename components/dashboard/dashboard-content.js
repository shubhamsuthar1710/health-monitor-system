"use client";

import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  Heart, 
  Pill, 
  AlertTriangle, 
  Phone, 
  Plus, 
  Clock, 
  Thermometer, 
  Droplets, 
  Scale,
  Calendar,
  FileText,
  Settings,
  User,
  Bell,
  Menu,
  TrendingUp,
  ActivitySquare
} from "lucide-react";
import Link from "next/link";
import { QuickEntryDialog } from "./quick-entry-dialog";
import { useState, useEffect } from "react";

const entryTypeIcons = {
  blood_pressure: Heart,
  heart_rate: ActivitySquare,
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

function EntryDate({ dateString }) {
  const formattedDate = useFormattedDate(dateString);
  
  if (!formattedDate) {
    return <span className="text-xs text-muted-foreground">Loading...</span>;
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

  useEffect(() => {
    setIsClient(true);
  }, []);

  const firstName = profile?.full_name?.split(" ")[0] || user.email?.split("@")[0] || "there";
  
  const healthScore = profile ? 
    Math.min(100, 
      (profile.blood_type ? 20 : 0) +
      (profile.date_of_birth ? 20 : 0) +
      (profile.height_cm ? 20 : 0) +
      (profile.weight_kg ? 20 : 0) +
      (medications.length > 0 ? 10 : 0) +
      (allergies.length >= 0 ? 10 : 0)
    ) : 0;

  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 50) return "text-amber-500";
    return "text-rose-500";
  };

  const getScoreGradient = (score) => {
    if (score >= 80) return "from-emerald-500 to-emerald-600";
    if (score >= 50) return "from-amber-500 to-orange-500";
    return "from-rose-500 to-rose-600";
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden">
            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={firstName}
                width={56}
                height={56}
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-7 w-7 text-primary" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Welcome back, {firstName}</h1>
            <p className="text-muted-foreground text-sm">Here's your health overview</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild className="h-10 w-10 border-border hover:bg-accent transition-colors">
            <Link href="/dashboard/settings">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
          <Button onClick={() => setIsQuickEntryOpen(true)} className="gap-2 h-10 px-4 bg-primary hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Quick Entry</span>
          </Button>
          <Button variant="outline" size="icon" asChild className="h-11 w-11 border-border hover:bg-accent transition-colors overflow-hidden p-0">
            <Link href="/dashboard/profile">
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={firstName}
                  width={44}
                  height={44}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-5 w-5" />
              )}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { title: "Entries", value: recentEntries.length, icon: Activity, color: "bg-sky-50 text-sky-600", delay: 0 },
          { title: "Medications", value: medications.length, icon: Pill, color: "bg-violet-50 text-violet-600", delay: 100 },
          { title: "Allergies", value: allergies.length, icon: AlertTriangle, color: "bg-amber-50 text-amber-600", delay: 200 },
          { title: "Emergency", value: emergencyContact ? "1" : "0", icon: Phone, color: "bg-emerald-50 text-emerald-600", delay: 300 },
        ].map((stat, index) => (
          <Card key={stat.title} className={`animate-fade-in-up border-border/60 hover:border-border transition-colors animation-delay-${stat.delay}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-xl font-semibold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border/60 animate-fade-in-up animation-delay-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Recent Health Entries
                </CardTitle>
                <CardDescription>Your latest recorded health data</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
                <Link href="/dashboard/timeline">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentEntries.length > 0 ? (
              <div className="space-y-2">
                {recentEntries.map((entry, index) => {
                  const Icon = entryTypeIcons[entry.entry_type] || Activity;
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors animate-fade-in-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-lg bg-primary/8">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {entryTypeLabels[entry.entry_type] || entry.entry_type}
                          </p>
                          <EntryDate dateString={entry.recorded_at} />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">{formatEntryValue(entry)}</p>
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
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <Activity className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground mb-4">No health entries yet</p>
                <Button onClick={() => setIsQuickEntryOpen(true)} className="bg-primary hover:bg-primary/90 transition-colors">
                  <Plus className="h-4 w-4 mr-2" />
                  Add your first entry
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border/60 animate-fade-in-up animation-delay-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Pill className="h-4 w-4 text-violet-500" />
                Current Medications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {medications.length > 0 ? (
                <div className="space-y-2">
                  {medications.slice(0, 4).map((med) => (
                    <div key={med.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                      <div>
                        <p className="font-medium text-sm">{med.name}</p>
                        <p className="text-xs text-muted-foreground">{med.dosage}</p>
                      </div>
                      {med.is_active && (
                        <Badge variant="outline" className="text-xs bg-violet-50 text-violet-700 border-violet-200">Active</Badge>
                      )}
                    </div>
                  ))}
                  {medications.length > 4 && (
                    <Button variant="ghost" size="sm" className="w-full" asChild>
                      <Link href="/dashboard/profile#medications">
                        +{medications.length - 4} more
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No medications added
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 animate-fade-in-up animation-delay-400">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Allergies
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allergies.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {allergies.map((allergy) => (
                    <Badge
                      key={allergy.id}
                      variant={allergy.severity === "severe" ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {allergy.allergen}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No allergies recorded
                </p>
              )}
              <Button variant="outline" size="sm" className="w-full mt-3 border-border hover:bg-accent" asChild>
                <Link href="/dashboard/profile#allergies">Manage Allergies</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/60 animate-fade-in-up animation-delay-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Phone className="h-4 w-4 text-emerald-500" />
                Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent>
              {emergencyContact ? (
                <div className="p-3 rounded-xl bg-emerald-50/50">
                  <p className="font-medium">{emergencyContact.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {emergencyContact.relationship}
                  </p>
                  <p className="text-sm mt-2 font-medium">{emergencyContact.phone}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No emergency contact set
                </p>
              )}
              <Button variant="outline" size="sm" className="w-full mt-3 border-border hover:bg-accent" asChild>
                <Link href="/dashboard/settings#emergency">
                  {emergencyContact ? "Update Contact" : "Add Contact"}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-border/60 animate-fade-in-up animation-delay-500">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" asChild className="border-border hover:bg-accent transition-colors">
              <Link href="/dashboard/timeline">
                <Calendar className="h-4 w-4 mr-2" />
                View Timeline
              </Link>
            </Button>
            <Button variant="outline" asChild className="border-border hover:bg-accent transition-colors">
              <Link href="/dashboard/documents">
                <FileText className="h-4 w-4 mr-2" />
                My Documents
              </Link>
            </Button>
            <Button variant="outline" asChild className="border-border hover:bg-accent transition-colors">
              <Link href="/dashboard/profile">
                <User className="h-4 w-4 mr-2" />
                Edit Profile
              </Link>
            </Button>
            <Button variant="outline" asChild className="border-border hover:bg-accent transition-colors">
              <Link href="/dashboard/settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <QuickEntryDialog open={isQuickEntryOpen} onOpenChange={setIsQuickEntryOpen} />
    </div>
  );
}