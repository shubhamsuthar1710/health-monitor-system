"use client";

import { useState } from "react";
import Link from "next/link";
import { PatientAccessRequest } from "./patient-access-request";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Stethoscope, 
  Users, 
  Clock, 
  History,
  LogOut,
  UserCircle,
  Activity
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function DoctorDashboardContent({ doctor, activeSessions, recentAccess }) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/');
    setIsLoggingOut(false);
  };

  return (
    <div className="container max-w-6xl py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Stethoscope className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Doctor Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, Dr. {doctor.full_name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Verified
          </Badge>
          <Button variant="ghost" size="icon" onClick={handleLogout} disabled={isLoggingOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSessions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently viewing patients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Doctor ID</CardTitle>
            <UserCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-mono font-bold">{doctor.doctor_id}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Use for identification
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Specialty</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{doctor.specialty || "General"}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {doctor.hospital_affiliation || "Independent"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Access Request - Takes 2 columns on large screens */}
        <div className="lg:col-span-2">
          <PatientAccessRequest />
        </div>

        {/* Quick Info - Takes 1 column */}
        <div className="space-y-6">
          {/* Active Sessions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Active Sessions
              </CardTitle>
              <CardDescription>
                Patients you're currently viewing
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeSessions > 0 ? (
                <Button asChild variant="outline" className="w-full">
                  <Link href="/doctor/sessions">
                    View {activeSessions} Active Session{activeSessions > 1 ? 's' : ''}
                  </Link>
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No active sessions
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Access
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentAccess.length > 0 ? (
                <div className="space-y-3">
                  {recentAccess.map((log) => (
                    <div key={log.id} className="text-sm">
                      <p className="font-medium">
                        {log.patient?.full_name || "Unknown Patient"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent activity
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/doctor/profile">
              <UserCircle className="h-4 w-4 mr-2" />
              View Profile
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/doctor/sessions">
              <Users className="h-4 w-4 mr-2" />
              Manage Sessions
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/doctor/history">
              <History className="h-4 w-4 mr-2" />
              Access History
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}