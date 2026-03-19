"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Stethoscope, Loader2, Mail, Lock, Heart, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function DoctorLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  // Check if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Check if user is a doctor
        const { data: doctor } = await supabase
          .from('doctors')
          .select('verification_status')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (doctor) {
          // Since we auto-verify, always go to dashboard
          router.push('/doctor/dashboard');
        }
      }
    };
    
    checkUser();
  }, [router, supabase]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Attempt login
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      // Verify this is a doctor account
      const { data: { user } } = await supabase.auth.getUser();
      const { data: doctor, error: doctorError } = await supabase
        .from('doctors')
        .select('verification_status, full_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (doctorError || !doctor) {
        // This is a patient - sign them out
        await supabase.auth.signOut();
        throw new Error("This email is not registered as a doctor. Please use patient login.");
      }

      // Since doctors are auto-verified, always redirect to dashboard
      router.push('/doctor/dashboard');
      
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Back to Home Button */}
      <Link href="/" className="absolute top-4 left-4">
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Home
        </Button>
      </Link>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Stethoscope className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Doctor Login</CardTitle>
          <CardDescription>
            Secure access for healthcare providers
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="doctor@hospital.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-6 space-y-4">
            {/* Quick info about auto-verification */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-700 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <span>Accounts are automatically verified after email confirmation</span>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Don't have a doctor account?{" "}
              <Link href="/doctor/signup" className="text-primary hover:underline font-medium">
                Register as Doctor
              </Link>
            </p>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Patient?
                </span>
              </div>
            </div>
            
            <Button variant="outline" className="w-full gap-2" asChild>
              <Link href="/auth/login">
                <Heart className="h-4 w-4" />
                Go to Patient Login
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}