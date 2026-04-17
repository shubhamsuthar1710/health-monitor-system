"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Fingerprint, Copy, Check, Activity, ArrowRight, Sparkles } from "lucide-react";

export default function SignUpSuccessPage() {
  const [patientId, setPatientId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatientId = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('patient_id')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setPatientId(profile.patient_id);
        }
      }
      setLoading(false);
    };

    fetchPatientId();
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(patientId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedId = patientId?.replace(/(\d{4})(\d{4})/, '$1 $2');

  return (
    <div className="min-h-screen flex">
      {/* Left Side */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary to-primary/80">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Welcome to HealthTrack!</h1>
            <p className="text-white/80 max-w-md">
              Your account has been created. Verify your email to start tracking your health.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <Card className="w-full max-w-md border-0 shadow-none">
          <CardHeader className="text-center pb-2">
            <Link href="/" className="flex items-center gap-2 mb-4 lg:hidden justify-center">
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <span className="font-semibold text-lg">HealthTrack</span>
            </Link>
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-primary/10">
                <Heart className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
            <CardDescription>We've sent you a confirmation link</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground text-center">
              Please check your email and click the confirmation link to activate your account.
            </p>

            {!loading && patientId && (
              <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-5 border border-primary/20">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Fingerprint className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Your Patient ID</h3>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="bg-background px-4 py-3 rounded-lg border font-mono text-xl tracking-wider">
                    {formattedId}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyToClipboard}
                    className="flex-shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Save this ID - use it to login or share with doctors
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Button asChild className="w-full">
                <Link href="/dashboard">
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/auth/login">Back to Login</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}