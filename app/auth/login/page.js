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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Chrome, Activity, Shield, Clock } from "lucide-react";

const INITIAL_STATE = {
  email: "",
  password: "",
  patientId: "",
  loginMethod: "email",
  isLoading: false,
  error: null,
};

export default function PatientLoginPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [state, setState] = useState(INITIAL_STATE);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role, is_profile_complete')
          .eq('id', session.user.id)  
          .single();

        if (!error && profile) {
          if (profile.role === 'doctor') {
            await supabase.auth.signOut();
          } else if (profile.role === 'patient') {
            router.push(profile.is_profile_complete ? '/dashboard' : '/auth/complete-profile');
          }
        }
      }
    } catch (error) {
      console.error("Session check failed:", error);
    }
  };

  const updateState = (updates) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const handleGoogleLogin = async () => {
    updateState({ isLoading: true, error: null });
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
    } catch (error) {
      updateState({ 
        error: error instanceof Error ? error.message : "Google login failed" 
      });
      updateState({ isLoading: false });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    updateState({ isLoading: true, error: null });

    try {
      let loginEmail = state.email;

      if (state.loginMethod === "patientId") {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('patient_id', state.patientId)
          .maybeSingle();

        if (profileError || !profile) {
          throw new Error("Invalid Patient ID. Please check and try again.");
        }
        loginEmail = profile.email;
      }

      const { data: existingUser, error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: state.password,
      });

      if (signInError) throw signInError;

      if (!existingUser?.user) {
        throw new Error("Login failed. Please try again.");
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, is_profile_complete')
        .eq('id', existingUser.user.id)
        .single();

      if (profileError || !profile) {
        throw new Error("Unable to verify your account. Please try a different login method.");
      }

      if (profile.role === 'doctor') {
        throw new Error("Please use the doctor login page.");
      }

      if (profile.is_profile_complete) {
        router.push('/dashboard');
        router.refresh();
      } else {
        router.push('/auth/complete-profile');
        router.refresh();
      }
      
    } catch (error) {
      updateState({ 
        error: error instanceof Error ? error.message : "Invalid credentials" 
      });
      updateState({ isLoading: false });
    } finally {
      setTimeout(() => {
        updateState({ isLoading: false });
      }, 100);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex lg:flex-row flex-col">
      <div className="hidden lg:flex lg:w-[45%] relative bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 min-h-screen overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)"/>
          </svg>
        </div>
        
        {/* Floating medical elements with subtle animation */}
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
          
          <div className="max-w-md">
            <div className="w-16 h-1 bg-white/60 rounded-full mb-6" />
            <h1 className="text-4xl font-semibold mb-5 leading-tight">
              Your health journey starts here
            </h1>
            <p className="text-white/85 text-lg leading-relaxed">
              Track your vitals, manage medications, and access your medical records — all in one secure place.
            </p>
          </div>
          
          <div className="flex items-center gap-8 text-sm text-white/70">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-full bg-white/20">
                <Shield className="h-3.5 w-3.5" />
              </div>
              <span>Secure & Private</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-full bg-white/20">
                <Clock className="h-3.5 w-3.5" />
              </div>
              <span>24/7 Access</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          <div className="animate-fade-in">
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 lg:hidden">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
              Home
            </Link>
            <Link href="/" className="flex items-center gap-2 mb-10 lg:hidden">
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <span className="font-semibold text-lg">HealthTrack</span>
            </Link>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-1.5">Welcome back</h2>
              <p className="text-muted-foreground">Sign in to continue to your health dashboard</p>
            </div>

            <Button
              onClick={handleGoogleLogin}
              variant="outline"
              size="lg"
              className="w-full mb-6 h-12 border-border hover:bg-accent transition-all duration-200"
              disabled={state.isLoading}
            >
              <Chrome className="h-5 w-5 mr-2.5 text-muted-foreground" />
              <span className="text-muted-foreground">Continue with Google</span>
            </Button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-background px-4 text-muted-foreground text-sm">or continue with email</span>
              </div>
            </div>

            {state.error && (
              <Alert variant="destructive" className="mb-6 animate-fade-in-up">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}

            <Tabs value={state.loginMethod} onValueChange={(v) => updateState({ loginMethod: v })} className="mb-6">
              <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted p-1">
                <TabsTrigger 
                  value="email" 
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
                >
                  Email
                </TabsTrigger>
                <TabsTrigger 
                  value="patientId"
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
                >
                  Patient ID
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="email" className="animate-fade-in-up">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={state.email}
                      onChange={(e) => updateState({ email: e.target.value })}
                      className="h-11 bg-background border-border focus:ring-primary/20"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                      <Link href="/auth/verify" className="text-sm text-primary hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={state.password}
                      onChange={(e) => updateState({ password: e.target.value })}
                      className="h-11 bg-background border-border focus:ring-primary/20"
                      required
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="patientId" className="animate-fade-in-up">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="patientId" className="text-sm font-medium">Patient ID</Label>
                    <Input
                      id="patientId"
                      type="text"
                      placeholder="Enter your Patient ID"
                      value={state.patientId}
                      onChange={(e) => updateState({ patientId: e.target.value })}
                      className="h-11 bg-background border-border focus:ring-primary/20"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="patientPassword" className="text-sm font-medium">Password</Label>
                    <Input
                      id="patientPassword"
                      type="password"
                      value={state.password}
                      onChange={(e) => updateState({ password: e.target.value })}
                      className="h-11 bg-background border-border focus:ring-primary/20"
                      required
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <Button 
              onClick={handleLogin}
              className="w-full mb-6 h-11 bg-primary hover:bg-primary/90 transition-all duration-200"
              size="lg"
              disabled={state.isLoading}
            >
              {state.isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/auth/sign-up" className="text-primary hover:underline font-medium">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}