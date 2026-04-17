"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Activity, CheckCircle2, Clock, Shield } from "lucide-react";

export default function DoctorPendingPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    const checkAndRedirect = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: doctor } = await supabase
          .from('doctors')
          .select('verification_status')
          .eq('user_id', user.id)
          .single();

        if (doctor) {
          router.push('/doctor/dashboard');
        } else {
          router.push('/doctor/signup');
        }
      } else {
        router.push('/doctor/login');
      }
    };

    checkAndRedirect();
  }, [router, supabase]);

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-blue-700 to-blue-900">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-6">
              <Clock className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Verification Pending</h1>
            <p className="text-white/80 max-w-md">
              Your doctor verification is being processed. Please wait while we review your credentials.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <Card className="w-full max-w-md border-0 shadow-none">
          <CardHeader className="text-center">
            <Link href="/" className="flex items-center gap-2 mb-4 lg:hidden justify-center">
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <span className="font-semibold text-lg">HealthTrack</span>
            </Link>
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-yellow-100">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Verification Pending</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <p className="text-muted-foreground">
              Your doctor profile is being verified. This usually takes a few minutes.
            </p>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="font-medium">What's next?</span>
              </div>
              <ul className="text-sm text-muted-foreground text-left space-y-2">
                <li>1. We review your medical license</li>
                <li>2. You'll receive a confirmation email</li>
                <li>3. Access your doctor dashboard</li>
              </ul>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href="/doctor/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}