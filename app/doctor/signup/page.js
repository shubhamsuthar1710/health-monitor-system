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
import { 
  Stethoscope, Loader2, Mail, Lock, User, ArrowLeft, CheckCircle2, Chrome, Heart, Activity, Shield, Clock, BadgeCheck
} from "lucide-react";

export default function DoctorSignUpPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
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
          if (profile.is_profile_complete) {
            router.push('/doctor/dashboard');
          } else {
            router.push('/doctor/complete-profile');
          }
        }
      }
    } catch (error) {
      console.error("Session check failed:", error);
    }
  };

  // Google Sign-Up Handler
  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use cookie to store the role (more reliable than URL params for OAuth)
      document.cookie = "signup_role=doctor; path=/; max-age=3600";
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          data: {
            full_name: formData.fullName,
            user_type: 'doctor',
            role: 'doctor'
          },
        },
      });
      if (error) throw error;
    } catch (error) {
      setError(error.message || "Google sign up failed");
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setError("Full name is required");
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError("Valid email is required");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Set cookie for role
      document.cookie = "signup_role=doctor; path=/; max-age=3600";
      
      // Sign up the user with doctor metadata (only basic info)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: formData.fullName,
            user_type: 'doctor',
            role: 'doctor'
          },
        },
      });

      if (authError) {
        if (authError.message.includes("User already registered")) {
          setError("This email is already registered. Please login instead.");
        } else {
          throw authError;
        }
        return;
      }

      if (!authData.user) {
        throw new Error("Failed to create user account");
      }

      // Profile will be auto-created by database trigger with is_profile_complete = false
      localStorage.setItem('pendingVerificationEmail', formData.email);
      await supabase.auth.signOut();
      setSuccess(true);
      
    } catch (error) {
      console.error("Registration error:", error);
      setError(error.message || "Failed to register. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-3 rounded-2xl bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
              <CardDescription className="text-base mt-2">
                We've sent a verification link to <strong>{formData.email}</strong>
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Next Steps:
              </h3>
              <ol className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <span className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</span>
                  <span>Click the verification link in your email</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</span>
                  <span>After verification, login to complete your license information</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</span>
                  <span>Access your doctor dashboard</span>
                </li>
              </ol>
            </div>

            <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
              <AlertDescription className="text-blue-700 dark:text-blue-300 text-sm">
                <strong>Note:</strong> After email verification, you'll need to complete your license information.
              </AlertDescription>
            </Alert>

            <div className="flex flex-col gap-3">
              <Button asChild className="w-full">
                <Link href="/doctor/login">Go to Doctor Login</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex lg:flex-row flex-col">
      {/* Left Side - Info - Doctor Theme */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-800 min-h-screen overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid-doctor-signup" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid-doctor-signup)"/>
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
              <h1 className="text-4xl font-bold">Join as Doctor</h1>
            </div>
            <p className="text-white/80 text-lg mb-8">
              Register to securely access patient records and provide better care to your patients.
            </p>
            <div className="flex items-center gap-6 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Secure Access</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Verified</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Back to Home Button */}
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 lg:hidden">
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>

          <Card className="w-full max-w-md shadow-xl border-0">
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-lg">
                  <Stethoscope className="h-10 w-10 text-primary" />
                </div>
              </div>
              <div>
                <CardTitle className="text-3xl font-bold tracking-tight">
                  Doctor Registration
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  Join our network of healthcare providers
                </CardDescription>
              </div>
            </CardHeader>

        <CardContent className="space-y-6">
          {/* Google Sign Up Button */}
          <Button
            onClick={handleGoogleSignUp}
            variant="outline"
            size="lg"
            className="w-full gap-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 shadow-sm"
            disabled={isLoading}
          >
            <Chrome className="h-5 w-5" />
            <span className="font-medium">Continue with Google</span>
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground">
                Or register with email
              </span>
            </div>
          </div>

          {/* Registration Form - Simple like patient */}
          <form onSubmit={handleSignUp} className="space-y-5">
            {error && (
              <Alert variant="destructive" className="animate-in fade-in-50 duration-200">
                <AlertDescription className="text-sm">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  placeholder="Dr. John Doe"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="pl-9 h-11"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="doctor@hospital.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-9 h-11"
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
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-9 h-11"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="pl-9 h-11"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <Stethoscope className="mr-2 h-4 w-4" />
                  Register as Doctor
                </>
              )}
            </Button>
          </form>

          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground">
              Already have a doctor account?{" "}
              <Link href="/doctor/login" className="text-primary hover:underline font-semibold">
                Sign in here
              </Link>
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground">
                Patient?
              </span>
            </div>
          </div>

          <Button variant="outline" className="w-full gap-2" asChild>
            <Link href="/auth/sign-up">
              <Heart className="h-4 w-4" />
              Patient Sign Up
            </Link>
          </Button>
        </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}