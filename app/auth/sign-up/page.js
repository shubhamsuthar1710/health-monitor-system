// "use client";
// //complete code for sign-up page with supabase auth and form validation
// import { useState } from "react";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { getSupabaseBrowserClient } from "@/lib/supabase/client";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { Heart, Loader2, Mail, Lock, User } from "lucide-react";

// export default function SignUpPage() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [fullName, setFullName] = useState("");
//   const [error, setError] = useState(null);
//   const [isLoading, setIsLoading] = useState(false);
  
//   const router = useRouter();

//   const handleSignUp = async (e) => {
//     e.preventDefault();
//     setError(null);

//     // Validation
//     if (password !== confirmPassword) {
//       setError("Passwords do not match");
//       return;
//     }

//     if (password.length < 6) {
//       setError("Password must be at least 6 characters");
//       return;
//     }

//     setIsLoading(true);

//     try {
//       const supabase = getSupabaseBrowserClient();
      
//       // Sign up the user with Supabase Auth
//       const { data, error: authError } = await supabase.auth.signUp({
//         email,
//         password,
//         options: {
// emailRedirectTo: `${window.location.origin}/auth/callback?next=/auth/complete-profile`,
//           data: {
//             full_name: fullName,
//           },
//         },
//       });
//       router.push("/auth/check-email");
      
//     } catch (error) {
//       setError(error.message);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-background p-4">
//       <Card className="w-full max-w-md">
//         <CardHeader className="text-center">
//           <div className="flex justify-center mb-4">
//             <div className="p-3 rounded-full bg-primary/10">
//               <Heart className="h-8 w-8 text-primary" />
//             </div>
//           </div>
//           <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
//           <CardDescription>
//             Sign up to start your health journey
//           </CardDescription>
//         </CardHeader>

//         <CardContent>
//           <form onSubmit={handleSignUp} className="space-y-4">
//             {error && (
//               <Alert variant="destructive">
//                 <AlertDescription>{error}</AlertDescription>
//               </Alert>
//             )}

//             <div className="space-y-2">
//               <Label htmlFor="fullName">Full Name</Label>
//               <div className="relative">
//                 <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                 <Input
//                   id="fullName"
//                   placeholder="shubham suthar"
//                   value={fullName}
//                   onChange={(e) => setFullName(e.target.value)}
//                   className="pl-9"
//                   required
//                   disabled={isLoading}
//                 />
//               </div>
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="email">Email</Label>
//               <div className="relative">
//                 <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                 <Input
//                   id="email"
//                   type="email"
//                   placeholder="you@example.com"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   className="pl-9"
//                   required
//                   disabled={isLoading}
//                 />
//               </div>
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="password">Password</Label>
//               <div className="relative">
//                 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                 <Input
//                   id="password"
//                   type="password"
//                   placeholder="Create a password"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   className="pl-9"
//                   required
//                   disabled={isLoading}
//                 />
//               </div>
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="confirmPassword">Confirm Password</Label>
//               <div className="relative">
//                 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                 <Input
//                   id="confirmPassword"
//                   type="password"
//                   placeholder="Confirm your password"
//                   value={confirmPassword}
//                   onChange={(e) => setConfirmPassword(e.target.value)}
//                   className="pl-9"
//                   required
//                   disabled={isLoading}
//                 />
//               </div>
//             </div>

//             <Button type="submit" className="w-full" disabled={isLoading}>
//               {isLoading ? (
//                 <>
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                   Creating account...
//                 </>
//               ) : (
//                 "Sign Up"
//               )}
//             </Button>
//           </form>

//           <div className="mt-6 text-center text-sm text-muted-foreground">
//             Already have an account?{" "}
//             <Link href="/auth/login" className="text-primary hover:underline font-medium">
//               Sign in
//             </Link>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Loader2, Mail, Lock, Fingerprint, Stethoscope, Chrome } from "lucide-react";

export default function PatientLoginPage() {
  const [loginMethod, setLoginMethod] = useState("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [patientId, setPatientId] = useState("");
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
        // Check if user is a doctor
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profile?.role === 'doctor') {
          router.push('/doctor/dashboard');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (error) {
      console.error("Session check failed:", error);
    }
  };

  // Google Sign-In Handler
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
        },
      });

      if (error) throw error;
      
    } catch (error) {
      setError(error.message || "Google login failed");
      setIsLoading(false);
    }
  };

  // Email/Patient ID Login Handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      let loginEmail = email;

      // Handle Patient ID login
      if (loginMethod === "patientId") {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('patient_id', patientId)
          .maybeSingle();

        if (profileError || !profile) {
          throw new Error("Invalid Patient ID. Please check and try again.");
        }
        loginEmail = profile.email;
      }

      // Attempt sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password,
      });

      if (signInError) throw signInError;

      // Get user role from profile
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      // Redirect based on role
      if (profile?.role === 'doctor') {
        await supabase.auth.signOut();
        throw new Error("Please use the doctor login portal");
      }

      // Successful patient login
      router.push('/dashboard');
      router.refresh();
      
    } catch (error) {
      setError(error.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-lg">
              <Heart className="h-10 w-10 text-primary" strokeWidth={1.5} />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold tracking-tight">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Sign in to access your health records
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Google Sign In Button */}
          <Button
            onClick={handleGoogleLogin}
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
                Or continue with email
              </span>
            </div>
          </div>

          {/* Email/Patient ID Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <Alert variant="destructive" className="animate-in fade-in-50 duration-200">
                <AlertDescription className="text-sm">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <Tabs
              value={loginMethod}
              onValueChange={setLoginMethod}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 p-1">
                <TabsTrigger 
                  value="email" 
                  className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Mail className="h-4 w-4" />
                  Email
                </TabsTrigger>
                <TabsTrigger 
                  value="patientId" 
                  className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Fingerprint className="h-4 w-4" />
                  Patient ID
                </TabsTrigger>
              </TabsList>

              <TabsContent value="email" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 h-11"
                      required={loginMethod === "email"}
                      disabled={isLoading}
                      autoComplete="email"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="patientId" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="patientId" className="text-sm font-medium">
                    Patient ID
                  </Label>
                  <div className="relative">
                    <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="patientId"
                      placeholder="Enter 8-digit ID"
                      value={patientId}
                      onChange={(e) => setPatientId(e.target.value.replace(/\D/g, '').slice(0, 8))}
                      maxLength={8}
                      className="pl-9 font-mono h-11"
                      required={loginMethod === "patientId"}
                      disabled={isLoading}
                      autoComplete="off"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your unique 8-digit identifier from your profile
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-primary hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 h-11"
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Heart className="h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          {/* Footer Links */}
          <div className="space-y-4 pt-2">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link
                  href="/auth/sign-up"
                  className="text-primary hover:underline font-medium transition-colors"
                >
                  Create an account
                </Link>
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-3 text-muted-foreground">
                  Healthcare Provider?
                </span>
              </div>
            </div>

            <Button variant="outline" className="w-full gap-2" asChild>
              <Link href="/doctor/login">
                <Stethoscope className="h-4 w-4" />
                Doctor Login Portal
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}