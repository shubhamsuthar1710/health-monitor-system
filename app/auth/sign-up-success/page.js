"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Heart, Fingerprint, Copy, Check } from "lucide-react";

export default function SignUpSuccessPage() {
  const [patientId, setPatientId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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

  // Format ID for display (add space in middle)
  const formattedId = patientId?.replace(/(\d{4})(\d{4})/, '$1 $2');

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
          <CardDescription>
            We've sent you a confirmation link
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Please check your email and click the confirmation link to activate your account.
            Once confirmed, you'll be able to access your health dashboard.
          </p>

          {/* Patient ID Display */}
          {!loading && patientId && (
            <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-5 border-2 border-primary/20">
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
              
              <p className="text-xs text-muted-foreground mt-3">
                Save this ID - you'll need it to login and share with doctors
              </p>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 p-4 bg-muted rounded-lg">
            <Heart className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Your health journey starts here</span>
          </div>

          <div className="space-y-2">
            <Button asChild variant="default" className="w-full">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/auth/login">Back to Login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}