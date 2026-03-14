"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Stethoscope, 
  Clock, 
  Mail, 
  RefreshCw,
  LogOut,
  CheckCircle2,
  XCircle
} from "lucide-react";

export default function DoctorPendingPage() {
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    checkDoctorStatus();
  }, []);

  const checkDoctorStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        router.push('/doctor/signup');
        return;
      }

      setDoctor(data);

      // If verified, redirect to dashboard
      if (data.verification_status === 'verified') {
        router.push('/doctor/dashboard');
      }
      
    } catch (error) {
      console.error("Error checking status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setChecking(true);
    await checkDoctorStatus();
    setChecking(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p>Checking verification status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-yellow-100">
              {doctor?.verification_status === 'rejected' ? (
                <XCircle className="h-8 w-8 text-destructive" />
              ) : (
                <Clock className="h-8 w-8 text-yellow-600" />
              )}
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {doctor?.verification_status === 'rejected' 
              ? 'Verification Failed' 
              : 'Verification Pending'}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {doctor?.verification_status === 'rejected' 
              ? 'Your application could not be verified'
              : 'Your doctor account is being reviewed'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {doctor?.verification_status === 'rejected' ? (
            <Alert variant="destructive">
              <AlertDescription>
                Your registration was rejected. Please contact support for more information.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <p className="text-sm">Email verified</p>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  <p className="text-sm">License verification in progress</p>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <p className="text-sm">You'll receive an email once verified</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground text-center">
                This usually takes 1-2 business days. We'll notify you at{' '}
                <strong>{doctor?.email}</strong> when your account is verified.
              </p>
            </>
          )}

          <div className="flex flex-col gap-3">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={checking}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
              {checking ? 'Checking...' : 'Check Status'}
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Need help? <Link href="/contact" className="text-primary hover:underline">Contact support</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}