"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Stethoscope, Loader2, Heart, ArrowLeft, Chrome, Activity, Shield, Clock, BadgeCheck } from "lucide-react";

export default function DoctorLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    setMounted(true);
    checkExistingSession();
  }, []);
  

  const checkExistingSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, is_profile_complete')
          .eq('id', session.user.id)
          .single();

        if (profile?.role === 'doctor') {
          router.push(profile.is_profile_complete ? '/doctor/dashboard' : '/doctor/complete-profile');
        }
      }
    } catch (error) {
      console.error("Session check failed:", error);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          data: {
            user_type: 'doctor',
            role: 'doctor',
          },
        },
      });
      if (error) throw error;
    } catch (error) {
      setError(error.message || "Google login failed");
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!email.includes('@')) {
        throw new Error("Please enter a valid email address");
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          throw new Error("Invalid email or password");
        }
        throw signInError;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, is_profile_complete')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        throw new Error("Doctor profile not found");
      }

      if (profile.role !== 'doctor') {
        await supabase.auth.signOut();
        throw new Error("This account is not registered as a doctor");
      }

      router.push(profile.is_profile_complete ? '/doctor/dashboard' : '/doctor/complete-profile');
      router.refresh();
      
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex lg:flex-row flex-col">
      {/* Left Side - Info - Doctor Theme */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-800 min-h-screen overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid-doctor" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid-doctor)"/>
          </svg>
        </div>
        
        {/* Floating elements */}
        <div className="absolute top-32 left-16 w-20 h-20 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20 animate-pulse-soft" />
        <div className="absolute bottom-40 right-16 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute top-20 -left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Link href="/" className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
              <Activity className="h-6 w-6" />
            </div>
            <span className="font-semibold text-xl tracking-tight">HealthTrack</span>
          </Link>
          
          <div>
            <div className="flex items-center gap-3 mb-4">
              <BadgeCheck className="h-8 w-8" />
              <h1 className="text-4xl font-bold">For Doctors</h1>
            </div>
            <p className="text-white/80 text-lg mb-8">
              Access patient records, review medical history, and provide better care with complete context.
            </p>
            <div className="flex items-center gap-6 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Secure Access</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>24/7 Available</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="p-2 rounded-lg bg-primary/10">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <span className="font-semibold text-lg">HealthTrack</span>
          </Link>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Stethoscope className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Doctor Login</h2>
            </div>
            <p className="text-muted-foreground">Secure access for healthcare providers</p>
          </div>

          <Button
            onClick={handleGoogleLogin}
            variant="outline"
            size="lg"
            className="w-full mb-6"
            disabled={isLoading}
          >
            <Chrome className="h-5 w-5 mr-2" />
            Continue with Google
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-4 text-muted-foreground">or continue with email</span>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="doctor@hospital.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Not a doctor?{" "}</p>
            <Link href="/auth/login" className="text-primary hover:underline font-medium">
              Patient Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}