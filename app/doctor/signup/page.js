// // i will give you multiple code to see if u found the loop this is login
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

  // Check existing session on mount
  useEffect(() => {
    setMounted(true);
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Check user profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role, full_name, date_of_birth') // Check for required fields
          .eq('id', session.user.id)
          .single();

        if (!error && profile) {
          if (profile.role === 'doctor') {
            // Doctor trying to access patient page - sign them out
            await supabase.auth.signOut();
          } else if (profile.role === 'patient') {
            // Check if profile is complete
            const isProfileComplete = profile.full_name && profile.date_of_birth;
            
            if (isProfileComplete) {
              // Existing user with complete profile - go to dashboard
              router.push('/dashboard');
            } else {
              // Existing user with incomplete profile - go to complete profile
              router.push('/auth/complete-profile');
            }
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
        error: error instanceof Error ? error.message : "Google login failed", 
        isLoading: false 
      });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    updateState({ isLoading: true, error: null });

    try {
      let loginEmail = state.email;

      // Handle Patient ID login
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

      // First, check if account exists (without logging in)
      // This prevents "new user" from logging in
      const { data: existingUser, error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: state.password,
      });

      if (signInError) {
        // Check if error is because user doesn't exist
        if (signInError.message.includes('Invalid login credentials')) {
          // Try to check if email exists in auth system
          const { data: { users } } = await supabase.auth.admin.listUsers();
          const userExists = users?.find(u => u.email === loginEmail);
          
          if (!userExists) {
            throw new Error("No account found with this email. Please sign up first.");
          } else {
            throw new Error("Invalid password. Please try again.");
          }
        }
        throw signInError;
      }

      // Get user and check profile
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error("Failed to get user information");
      }

      // Check user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, full_name, date_of_birth')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        // Profile doesn't exist - this shouldn't happen if signup worked
        // But if it does, redirect to complete profile
        router.push('/auth/complete-profile');
        router.refresh();
        return;
      }

      // Check if user is a doctor
      if (profile.role === 'doctor') {
        await supabase.auth.signOut();
        throw new Error("Please use the doctor login portal");
      }

      // Check if user is a patient
      if (profile.role === 'patient') {
        // Check if profile is complete
        const isProfileComplete = profile.full_name && profile.date_of_birth;
        
        if (isProfileComplete) {
          // Existing user with complete profile - go to dashboard
          router.push('/dashboard');
          router.refresh();
        } else {
          // Existing user with incomplete profile - go to complete profile
          router.push('/auth/complete-profile');
          router.refresh();
        }
      } else {
        throw new Error("Invalid user role");
      }
      
    } catch (error) {
      updateState({ 
        error: error instanceof Error ? error.message : "Invalid credentials" 
      });
      updateState({ isLoading: false });
    } finally {
      // Only set loading false if not redirected
      setTimeout(() => {
        updateState({ isLoading: false });
      }, 100);
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
          {/* Google Sign In */}
          <div className="space-y-4">
            <Button
              onClick={handleGoogleLogin}
              variant="outline"
              size="lg"
              className="w-full gap-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 shadow-sm"
              disabled={state.isLoading}
            >
              <Chrome className="h-5 w-5" />
              <span className="font-medium">Continue with Google</span>
            </Button>

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
          </div>

          {/* Email/Patient ID Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {state.error && (
              <Alert variant="destructive" className="animate-in fade-in-50 duration-200">
                <AlertDescription className="text-sm">
                  {state.error}
                </AlertDescription>
              </Alert>
            )}

            <Tabs
              value={state.loginMethod}
              onValueChange={(value) => updateState({ loginMethod: value })}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 p-1">
                <TabsTrigger value="email" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Mail className="h-4 w-4" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="patientId" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
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
                      value={state.email}
                      onChange={(e) => updateState({ email: e.target.value })}
                      className="pl-9 h-11"
                      required={state.loginMethod === "email"}
                      disabled={state.isLoading}
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
                      value={state.patientId}
                      onChange={(e) => updateState({ patientId: e.target.value.replace(/\D/g, '').slice(0, 8) })}
                      maxLength={8}
                      className="pl-9 font-mono h-11"
                      required={state.loginMethod === "patientId"}
                      disabled={state.isLoading}
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
                  value={state.password}
                  onChange={(e) => updateState({ password: e.target.value })}
                  className="pl-9 h-11"
                  required
                  disabled={state.isLoading}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={state.isLoading}
            >
              {state.isLoading ? (
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

          {/* Sign Up Link - Important for new users */}
          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                href="/auth/sign-up"
                className="text-primary hover:underline font-semibold transition-colors"
              >
                Sign up here
              </Link>
            </p>
          </div>

          {/* Footer Links */}
          <div className="space-y-4 pt-2">
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

            <Button
              variant="outline"
              className="w-full gap-2"
              asChild
            >
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
// } this is the sign in "use client";

// import { useState, useEffect } from "react";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { getSupabaseBrowserClient } from "@/lib/supabase/client";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Heart, Loader2, Mail, Lock, Fingerprint, Stethoscope, Chrome } from "lucide-react";

// export default function PatientLoginPage() {
//   const [loginMethod, setLoginMethod] = useState("email");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [patientId, setPatientId] = useState("");
//   const [error, setError] = useState(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [mounted, setMounted] = useState(false);
  
//   const router = useRouter();
//   const supabase = getSupabaseBrowserClient();

//   useEffect(() => {
//     setMounted(true);
//     checkExistingSession();
//   }, []);

//   const checkExistingSession = async () => {
//     try {
//       const { data: { session } } = await supabase.auth.getSession();
      
//       if (session) {
//         // Check if user is a doctor
//         const { data: profile } = await supabase
//           .from('profiles')
//           .select('role')
//           .eq('id', session.user.id)
//           .single();

//         if (profile?.role === 'doctor') {
//           router.push('/doctor/dashboard');
//         } else {
//           router.push('/dashboard');
//         }
//       }
//     } catch (error) {
//       console.error("Session check failed:", error);
//     }
//   };

//   // Google Sign-In Handler
//   const handleGoogleLogin = async () => {
//     setIsLoading(true);
//     setError(null);
    
//     try {
//       const { error } = await supabase.auth.signInWithOAuth({
//         provider: "google",
//         options: {
//           redirectTo: `${window.location.origin}/auth/callback`,
//           queryParams: {
//             access_type: 'offline',
//             prompt: 'consent',
//           },
//         },
//       });

//       if (error) throw error;
      
//     } catch (error) {
//       setError(error.message || "Google login failed");
//       setIsLoading(false);
//     }
//   };

//   // Email/Patient ID Login Handler
//   const handleLogin = async (e) => {
//     e.preventDefault();
//     setError(null);
//     setIsLoading(true);

//     try {
//       let loginEmail = email;

//       // Handle Patient ID login
//       if (loginMethod === "patientId") {
//         const { data: profile, error: profileError } = await supabase
//           .from('profiles')
//           .select('email')
//           .eq('patient_id', patientId)
//           .maybeSingle();

//         if (profileError || !profile) {
//           throw new Error("Invalid Patient ID. Please check and try again.");
//         }
//         loginEmail = profile.email;
//       }

//       // Attempt sign in
//       const { error: signInError } = await supabase.auth.signInWithPassword({
//         email: loginEmail,
//         password: password,
//       });

//       if (signInError) throw signInError;

//       // Get user role from profile
//       const { data: { user } } = await supabase.auth.getUser();
//       const { data: profile } = await supabase
//         .from('profiles')
//         .select('role')
//         .eq('id', user.id)
//         .single();

//       // Redirect based on role
//       if (profile?.role === 'doctor') {
//         await supabase.auth.signOut();
//         throw new Error("Please use the doctor login portal");
//       }

//       // Successful patient login
//       router.push('/dashboard');
//       router.refresh();
      
//     } catch (error) {
//       setError(error.message || "Invalid credentials");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Don't render until mounted to prevent hydration issues
//   if (!mounted) {
//     return null;
//   }

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
//       <Card className="w-full max-w-md shadow-xl border-0">
//         <CardHeader className="text-center space-y-4">
//           <div className="flex justify-center">
//             <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-lg">
//               <Heart className="h-10 w-10 text-primary" strokeWidth={1.5} />
//             </div>
//           </div>
//           <div>
//             <CardTitle className="text-3xl font-bold tracking-tight">
//               Welcome Back
//             </CardTitle>
//             <CardDescription className="text-base mt-2">
//               Sign in to access your health records
//             </CardDescription>
//           </div>
//         </CardHeader>

//         <CardContent className="space-y-6">
//           {/* Google Sign In Button */}
//           <Button
//             onClick={handleGoogleLogin}
//             variant="outline"
//             size="lg"
//             className="w-full gap-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 shadow-sm"
//             disabled={isLoading}
//           >
//             <Chrome className="h-5 w-5" />
//             <span className="font-medium">Continue with Google</span>
//           </Button>

//           {/* Divider */}
//           <div className="relative">
//             <div className="absolute inset-0 flex items-center">
//               <span className="w-full border-t" />
//             </div>
//             <div className="relative flex justify-center text-xs uppercase">
//               <span className="bg-background px-3 text-muted-foreground">
//                 Or continue with email
//               </span>
//             </div>
//           </div>

//           {/* Email/Patient ID Login Form */}
//           <form onSubmit={handleLogin} className="space-y-5">
//             {error && (
//               <Alert variant="destructive" className="animate-in fade-in-50 duration-200">
//                 <AlertDescription className="text-sm">
//                   {error}
//                 </AlertDescription>
//               </Alert>
//             )}

//             <Tabs
//               value={loginMethod}
//               onValueChange={setLoginMethod}
//               className="w-full"
//             >
//               <TabsList className="grid w-full grid-cols-2 p-1">
//                 <TabsTrigger 
//                   value="email" 
//                   className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
//                 >
//                   <Mail className="h-4 w-4" />
//                   Email
//                 </TabsTrigger>
//                 <TabsTrigger 
//                   value="patientId" 
//                   className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
//                 >
//                   <Fingerprint className="h-4 w-4" />
//                   Patient ID
//                 </TabsTrigger>
//               </TabsList>

//               <TabsContent value="email" className="space-y-4 mt-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="email" className="text-sm font-medium">
//                     Email Address
//                   </Label>
//                   <div className="relative">
//                     <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                     <Input
//                       id="email"
//                       type="email"
//                       placeholder="you@example.com"
//                       value={email}
//                       onChange={(e) => setEmail(e.target.value)}
//                       className="pl-9 h-11"
//                       required={loginMethod === "email"}
//                       disabled={isLoading}
//                       autoComplete="email"
//                     />
//                   </div>
//                 </div>
//               </TabsContent>

//               <TabsContent value="patientId" className="space-y-4 mt-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="patientId" className="text-sm font-medium">
//                     Patient ID
//                   </Label>
//                   <div className="relative">
//                     <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                     <Input
//                       id="patientId"
//                       placeholder="Enter 8-digit ID"
//                       value={patientId}
//                       onChange={(e) => setPatientId(e.target.value.replace(/\D/g, '').slice(0, 8))}
//                       maxLength={8}
//                       className="pl-9 font-mono h-11"
//                       required={loginMethod === "patientId"}
//                       disabled={isLoading}
//                       autoComplete="off"
//                     />
//                   </div>
//                   <p className="text-xs text-muted-foreground">
//                     Your unique 8-digit identifier from your profile
//                   </p>
//                 </div>
//               </TabsContent>
//             </Tabs>

//             <div className="space-y-2">
//               <div className="flex items-center justify-between">
//                 <Label htmlFor="password" className="text-sm font-medium">
//                   Password
//                 </Label>
//                 <Link
//                   href="/auth/forgot-password"
//                   className="text-xs text-primary hover:underline transition-colors"
//                 >
//                   Forgot password?
//                 </Link>
//               </div>
//               <div className="relative">
//                 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                 <Input
//                   id="password"
//                   type="password"
//                   placeholder="Enter your password"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   className="pl-9 h-11"
//                   required
//                   disabled={isLoading}
//                   autoComplete="current-password"
//                 />
//               </div>
//             </div>

//             <Button
//               type="submit"
//               size="lg"
//               className="w-full gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
//               disabled={isLoading}
//             >
//               {isLoading ? (
//                 <>
//                   <Loader2 className="h-4 w-4 animate-spin" />
//                   Signing in...
//                 </>
//               ) : (
//                 <>
//                   <Heart className="h-4 w-4" />
//                   Sign In
//                 </>
//               )}
//             </Button>
//           </form>

//           {/* Footer Links */}
//           <div className="space-y-4 pt-2">
//             <div className="text-center">
//               <p className="text-sm text-muted-foreground">
//                 Don't have an account?{" "}
//                 <Link
//                   href="/auth/sign-up"
//                   className="text-primary hover:underline font-medium transition-colors"
//                 >
//                   Create an account
//                 </Link>
//               </p>
//             </div>

//             <div className="relative">
//               <div className="absolute inset-0 flex items-center">
//                 <span className="w-full border-t" />
//               </div>
//               <div className="relative flex justify-center text-xs uppercase">
//                 <span className="bg-background px-3 text-muted-foreground">
//                   Healthcare Provider?
//                 </span>
//               </div>
//             </div>

//             <Button variant="outline" className="w-full gap-2" asChild>
//               <Link href="/doctor/login">
//                 <Stethoscope className="h-4 w-4" />
//                 Doctor Login Portal
//               </Link>
//             </Button>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// } this is callback 
// import { createServerClient } from '@supabase/ssr'
// import { cookies } from 'next/headers'
// import { NextResponse } from 'next/server'

// export async function GET(request) {
//   const requestUrl = new URL(request.url)
//   const code = requestUrl.searchParams.get('code')
//   const token = requestUrl.searchParams.get('token')
//   const type = requestUrl.searchParams.get('type')
//   const error = requestUrl.searchParams.get('error')
//   const errorDescription = requestUrl.searchParams.get('error_description')
  
//   console.log('Auth callback received:', { 
//     code: !!code, 
//     token: !!token, 
//     type, 
//     error, 
//     errorDescription 
//   });
  
//   // If there's an error, redirect to verify page
//   if (error) {
//     console.error('Auth error:', error, errorDescription);
//     const errorParams = new URLSearchParams(requestUrl.searchParams);
//     errorParams.delete('code');
//     errorParams.delete('token');
//     return NextResponse.redirect(
//       new URL(`/auth/verify?${errorParams.toString()}`, request.url)
//     )
//   }
  
//   // Handle email verification token (from signup email)
//   if (token && type === 'signup') {
//     try {
//       const cookieStore = await cookies()
//       const supabase = createServerClient(
//         process.env.NEXT_PUBLIC_SUPABASE_URL,
//         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
//         {
//           cookies: {
//             get(name) {
//               return cookieStore.get(name)?.value
//             },
//             set(name, value, options) {
//               try {
//                 cookieStore.set({ name, value, ...options })
//               } catch (error) {
//                 console.error('Cookie set error:', error)
//               }
//             },
//             remove(name, options) {
//               try {
//                 cookieStore.set({ name, value: '', ...options })
//               } catch (error) {
//                 console.error('Cookie remove error:', error)
//               }
//             },
//           },
//         }
//       )

//       // Verify the OTP token
//       const { error: verifyError } = await supabase.auth.verifyOtp({
//         token_hash: token,
//         type: 'signup'
//       })

//       if (verifyError) {
//         console.error('Token verification failed:', verifyError);
//         const errorParams = new URLSearchParams();
//         errorParams.set('error', verifyError.message);
//         errorParams.set('error_code', verifyError.code || 'verification_failed');
//         return NextResponse.redirect(
//           new URL(`/auth/verify?${errorParams.toString()}`, request.url)
//         )
//       }

//       console.log('Email verified successfully');
      
//       // Get the now-verified user
//       const { data: { user }, error: userError } = await supabase.auth.getUser()
      
//       if (userError || !user) {
//         console.error('Error getting user after verification:', userError);
//         return NextResponse.redirect(
//           new URL('/auth/verify?error=User not found after verification', request.url)
//         )
//       }

//       // Check if profile exists
//       const { data: profile } = await supabase
//         .from('profiles')
//         .select('role')
//         .eq('id', user.id)
//         .single()

//       // Redirect to complete profile (patient flow)
//       return NextResponse.redirect(new URL('/auth/complete-profile', request.url))
      
//     } catch (error) {
//       console.error('Error in token verification:', error)
//       const errorParams = new URLSearchParams();
//       errorParams.set('error', 'Verification failed. Please try again.');
//       return NextResponse.redirect(
//         new URL(`/auth/verify?${errorParams.toString()}`, request.url)
//       )
//     }
//   }
  
//   // Handle OAuth code exchange (Google login)
//   if (code) {
//     try {
//       const cookieStore = await cookies()
//       const supabase = createServerClient(
//         process.env.NEXT_PUBLIC_SUPABASE_URL,
//         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
//         {
//           cookies: {
//             get(name) {
//               return cookieStore.get(name)?.value
//             },
//             set(name, value, options) {
//               try {
//                 cookieStore.set({ name, value, ...options })
//               } catch (error) {
//                 console.error('Cookie set error:', error)
//               }
//             },
//             remove(name, options) {
//               try {
//                 cookieStore.set({ name, value: '', ...options })
//               } catch (error) {
//                 console.error('Cookie remove error:', error)
//               }
//             },
//           },
//         }
//       )

//       const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
//       if (exchangeError) {
//         console.error('Error exchanging code:', exchangeError);
//         const errorParams = new URLSearchParams();
//         errorParams.set('error', exchangeError.message);
//         return NextResponse.redirect(
//           new URL(`/auth/verify?${errorParams.toString()}`, request.url)
//         )
//       }

//       console.log('OAuth code exchanged successfully');
      
//     } catch (error) {
//       console.error('Error in OAuth callback:', error)
//       const errorParams = new URLSearchParams();
//       errorParams.set('error', 'Failed to complete OAuth verification');
//       return NextResponse.redirect(
//         new URL(`/auth/verify?${errorParams.toString()}`, request.url)
//       )
//     }
//   }

//   // Get the current user to determine redirect (for OAuth flow)
//   try {
//     const cookieStore = await cookies()
//     const supabase = createServerClient(
//       process.env.NEXT_PUBLIC_SUPABASE_URL,
//       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
//       {
//         cookies: {
//           get(name) {
//             return cookieStore.get(name)?.value
//           },
//           set(name, value, options) {
//             try {
//               cookieStore.set({ name, value, ...options })
//             } catch (error) {
//               console.error('Cookie set error:', error)
//             }
//           },
//           remove(name, options) {
//             try {
//               cookieStore.set({ name, value: '', ...options })
//             } catch (error) {
//               console.error('Cookie remove error:', error)
//             }
//           },
//         },
//       }
//     )
    
//     const { data: { user }, error: userError } = await supabase.auth.getUser()

//     if (userError || !user) {
//       console.error('Error getting user:', userError);
//       const errorParams = new URLSearchParams();
//       errorParams.set('error', userError?.message || 'User lookup failed');
//       return NextResponse.redirect(new URL(`/auth/verify?${errorParams.toString()}`, request.url))
//     }

//     console.log('User found:', user.email);
    
//     // Check user role from profiles table
//     const { data: profile, error: profileError } = await supabase
//       .from('profiles')
//       .select('role')
//       .eq('id', user.id)
//       .single()

//     if (profileError) {
//       console.error('Error fetching profile:', profileError);
//       // Profile doesn't exist yet - trigger hasn't run or user just signed up
//       // For OAuth, we need to create the profile or redirect to complete it
//       console.log('Profile not found, redirecting to complete profile');
//       return NextResponse.redirect(new URL('/auth/complete-profile', request.url))
//     }

//     // Check role and redirect accordingly
//     if (profile?.role === 'doctor') {
//       console.log('User is a doctor, redirecting to doctor dashboard');
//       return NextResponse.redirect(new URL('/doctor/dashboard', request.url))
//     } else if (profile?.role === 'patient') {
//       console.log('User is a patient, redirecting to complete profile');
//       return NextResponse.redirect(new URL('/auth/complete-profile', request.url))
//     } else {
//       // Fallback for unknown role
//       console.log('Unknown role, redirecting to complete profile');
//       return NextResponse.redirect(new URL('/auth/complete-profile', request.url))
//     }
    
//   } catch (error) {
//     console.error('Error in user redirect:', error)
//     const errorParams = new URLSearchParams();
//     errorParams.set('error', 'Failed to process user session');
//     return NextResponse.redirect(new URL(`/auth/verify?${errorParams.toString()}`, request.url))
//   }
// } and this is verfiy 
// "use client";

// import { useEffect, useState } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import Link from "next/link";
// import { getSupabaseBrowserClient } from "@/lib/supabase/client";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Loader2, Mail, CheckCircle2, XCircle, RefreshCw, ArrowLeft } from "lucide-react";

// export default function VerifyPage() {
//   const [status, setStatus] = useState('checking');
//   const [email, setEmail] = useState('');
//   const [error, setError] = useState('');
//   const [errorCode, setErrorCode] = useState('');
//   const [errorDescription, setErrorDescription] = useState('');
//   const [countdown, setCountdown] = useState(0);
//   const [errorType, setErrorType] = useState('');
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const supabase = getSupabaseBrowserClient();

//   useEffect(() => {
//     checkVerificationStatus();
//   }, []);

//   // Auto-verify token if present in URL
//   const token = searchParams.get('token');
//   const typeParam = searchParams.get('type');
//   useEffect(() => {
//     if (token && typeParam) {
//       verifyToken(token, typeParam);
//     }
//   }, [token, typeParam]);

//   useEffect(() => {
//     if (countdown > 0) {
//       const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
//       return () => clearTimeout(timer);
//     }
//   }, [countdown]);

//   const checkVerificationStatus = async () => {
//     try {
//       const { data: { session } } = await supabase.auth.getSession();
      
//       if (session) {
//         setStatus('verified');
        
//         const { data: doctor } = await supabase
//           .from('doctors')
//           .select('verification_status')
//           .eq('user_id', session.user.id)
//           .single();

//         if (doctor) {
//           setTimeout(() => router.push('/doctor/pending'), 3000);
//         } else {
//           setTimeout(() => router.push('/dashboard'), 3000);
//         }
//         return;
//       }

//       // Parse all auth error params
//       const errorParam = searchParams.get('error');
//       const errorCodeParam = searchParams.get('error_code');
//       const errorDescParam = searchParams.get('error_description');
//       const token = searchParams.get('token');
//       const type = searchParams.get('type');

//       const savedEmail = localStorage.getItem('pendingVerificationEmail');
//       if (savedEmail) {
//         setEmail(savedEmail);
//       }

//       if (errorCodeParam || errorParam) {
//         setErrorCode(errorCodeParam || errorParam);
//         setErrorDescription(errorDescParam || errorParam || 'Verification failed');
//         setErrorType(errorCodeParam === 'otp_expired' ? 'expired' : 'invalid');
//         setStatus(errorCodeParam === 'otp_expired' ? 'expired' : 'error');
//       } else if (token) {
//         // Direct token verification
//         setStatus('verifying_token');
//       } else {
//         setStatus('unverified');
//       }
      
//     } catch (error) {
//       console.error('Error checking status:', error);
//       setStatus('error');
//       setError('Failed to check verification status');
//     }
//   };

//   const resendVerification = async () => {
//     if (!email) {
//       setError('Please enter your email address');
//       return;
//     }

//     setStatus('resending');
//     setError('');

//     try {
//       // 🔧 DEVELOPMENT BYPASS - remove this block in production
//       if (process.env.NODE_ENV === 'development') {
//         console.log('🔧 DEV MODE: Simulating email send to', email);
        
//         // Simulate a successful resend
//         setTimeout(() => {
//           setStatus('sent');
//           setCountdown(60);
//           localStorage.setItem('pendingVerificationEmail', email);
          
//           // Optional: show a fake verification link in console
//           const fakeToken = crypto.randomUUID();
//           console.log('Fake verification link:', `${window.location.origin}/auth/callback?code=${fakeToken}`);
//         }, 1000);
        
//         return; // Skip actual API call
//       }

//       // 🚀 PRODUCTION CODE - actually send email
//       const { error } = await supabase.auth.resend({
//         type: 'signup',
//         email: email,
//         options: {
//           emailRedirectTo: `${window.location.origin}/auth/callback`,
//         },
//       });

//       if (error) throw error;

//       localStorage.setItem('pendingVerificationEmail', email);
//       setStatus('sent');
//       setCountdown(60);
      
//     } catch (error) {
//       console.error('Error resending verification:', error);
      
//       // Handle specific error messages
//       if (error.message?.includes('rate limit')) {
//         setError('Too many requests. Please wait a while before trying again.');
//       } else if (error.message?.includes('already confirmed')) {
//         setError('This email is already verified. Please login.');
//       } else {
//         setError(error.message || 'Failed to resend verification email');
//       }
      
//       setStatus('unverified');
//     }
//   };

//   const handleManualVerification = async () => {
//     setStatus('checking');
//     await checkVerificationStatus();
//   };

//   const verifyToken = async (token, type) => {
//     try {
//       setStatus('verifying_token');
//       const { data, error } = await supabase.auth.verifyOtp({
//         token,
//         type: type === 'signup' ? 'signup' : 'email'
//       });

//       if (error) throw error;

//       if (data.user) {
//         setStatus('verified');
//         localStorage.removeItem('pendingVerificationEmail');
//       }
//     } catch (error) {
//       console.error('Token verification failed:', error);
//       setError(error.message || 'Invalid verification token');
//       setStatus('error');
//     }
//   };

//   // Loading state
//   if (status === 'checking') {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-background p-4">
//         <Card className="w-full max-w-md">
//           <CardContent className="pt-6">
//             <div className="text-center py-8">
//               <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
//               <p className="text-lg font-medium">Checking verification status...</p>
//               <p className="text-sm text-muted-foreground mt-2">
//                 Please wait while we verify your email.
//               </p>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     );
//   }

//   // Verified state
//   if (status === 'verified') {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-background p-4">
//         <Card className="w-full max-w-md">
//           <CardHeader className="text-center">
//             <div className="flex justify-center mb-4">
//               <div className="p-3 rounded-full bg-green-100">
//                 <CheckCircle2 className="h-12 w-12 text-green-600" />
//               </div>
//             </div>
//             <CardTitle className="text-2xl font-bold">Email Verified!</CardTitle>
//             <CardDescription className="text-base mt-2">
//               Your email has been successfully verified.
//             </CardDescription>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             <Alert>
//               <AlertDescription>
//                 Redirecting you to your dashboard in a few seconds...
//               </AlertDescription>
//             </Alert>
//             <Button asChild className="w-full">
//               <Link href="/dashboard">
//                 Go to Dashboard Now
//               </Link>
//             </Button>
//           </CardContent>
//         </Card>
//       </div>
//     );
//   }

//   // Expired link state - special UX for otp_expired
//   if (status === 'expired') {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-background p-4">
//         <Card className="w-full max-w-md">
//           <CardHeader className="text-center">
//             <div className="flex justify-center mb-4">
//               <div className="p-3 rounded-full bg-orange-100">
//                 <XCircle className="h-8 w-8 text-orange-600" />
//               </div>
//             </div>
//             <CardTitle className="text-2xl font-bold">Verification Link Expired</CardTitle>
//             <CardDescription className="text-base mt-2">
//               The link has expired. Request a new one to continue.
//             </CardDescription>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             <Alert variant="destructive">
//               <AlertDescription>{errorDescription}</AlertDescription>
//             </Alert>
            
//             <div className="space-y-2">
//               <Label htmlFor="email">Your Email</Label>
//               <Input
//                 id="email"
//                 type="email"
//                 placeholder="Enter your email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//               />
//             </div>

//             <Button 
//               onClick={resendVerification} 
//               className="w-full gap-2"
//               disabled={!email || countdown > 0}
//             >
//               {countdown > 0 ? `Wait ${countdown}s` : (
//                 <>
//                   <RefreshCw className="h-4 w-4" />
//                   Send New Verification Link
//                 </>
//               )}
//             </Button>

//             <Button asChild variant="outline" className="w-full">
//               <Link href="/auth/login">
//                 Back to Login
//               </Link>
//             </Button>
//           </CardContent>
//         </Card>
//       </div>
//     );
//   }

//   // Sent state (email resent)
//   if (status === 'sent') {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-background p-4">
//         <Card className="w-full max-w-md">
//           <CardHeader className="text-center">
//             <div className="flex justify-center mb-4">
//               <div className="p-3 rounded-full bg-green-100">
//                 <Mail className="h-8 w-8 text-green-600" />
//               </div>
//             </div>
//             <CardTitle className="text-2xl font-bold">Verification Email Sent</CardTitle>
//             <CardDescription className="text-base mt-2">
//               We've sent a new verification link to <strong>{email}</strong>
//             </CardDescription>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             <Alert>
//               <AlertDescription>
//                 Please check your email and click the verification link. The link will expire in 24 hours.
//               </AlertDescription>
//             </Alert>
            
//             {countdown > 0 && (
//               <p className="text-sm text-center text-muted-foreground">
//                 You can request another email in {countdown} seconds
//               </p>
//             )}

//             <div className="flex flex-col gap-3">
//               <Button 
//                 onClick={handleManualVerification} 
//                 variant="outline" 
//                 className="gap-2"
//               >
//                 <RefreshCw className="h-4 w-4" />
//                 I've Verified My Email
//               </Button>
//               <Button asChild variant="ghost" size="sm">
//                 <Link href="/auth/login">
//                   Go to Login
//                 </Link>
//               </Button>
//             </div>

//             {/* Dev mode hint */}
//             {process.env.NODE_ENV === 'development' && (
//               <p className="text-xs text-center text-blue-600 mt-2">
//                 🔧 Dev mode: No actual email sent. Check console for fake link.
//               </p>
//             )}
//           </CardContent>
//         </Card>
//       </div>
//     );
//   }

//   // Default unverified/error state
//   return (
//     <div className="min-h-screen flex items-center justify-center bg-background p-4">
//       <Card className="w-full max-w-md">
//         <CardHeader className="text-center">
//           <div className="flex justify-center mb-4">
//             <div className="p-3 rounded-full bg-yellow-100">
//               <Mail className="h-8 w-8 text-yellow-600" />
//             </div>
//           </div>
//           <CardTitle className="text-2xl font-bold">Email Verification Required</CardTitle>
//           <CardDescription className="text-base mt-2">
//             {error || "Please verify your email address to continue."}
//           </CardDescription>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           {error && (
//             <Alert variant="destructive">
//               <AlertDescription>{error}</AlertDescription>
//             </Alert>
//           )}
          
//           <div className="bg-muted p-4 rounded-lg text-sm">
//             <p className="font-medium mb-2">Why do I need to verify?</p>
//             <p className="text-muted-foreground">
//               Email verification helps us ensure the security of your account and 
//               allows us to send you important notifications about your health data.
//             </p>
//           </div>

//           <div className="space-y-4">
//             <div className="space-y-2">
//               <Label htmlFor="email">Your Email Address</Label>
//               <Input
//                 id="email"
//                 type="email"
//                 placeholder="Enter your email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 disabled={status === 'resending'}
//               />
//             </div>

//             <Button 
//               onClick={resendVerification} 
//               className="w-full gap-2"
//               disabled={status === 'resending' || !email || countdown > 0}
//             >
//               {status === 'resending' ? (
//                 <>
//                   <Loader2 className="h-4 w-4 animate-spin" />
//                   Sending...
//                 </>
//               ) : countdown > 0 ? (
//                 `Wait ${countdown}s`
//               ) : (
//                 <>
//                   <RefreshCw className="h-4 w-4" />
//                   Resend Verification Email
//                 </>
//               )}
//             </Button>

//             <div className="relative">
//               <div className="absolute inset-0 flex items-center">
//                 <span className="w-full border-t" />
//               </div>
//               <div className="relative flex justify-center text-xs uppercase">
//                 <span className="bg-background px-2 text-muted-foreground">
//                   Or
//                 </span>
//               </div>
//             </div>

//             <Button asChild variant="outline" className="w-full">
//               <Link href="/auth/login">
//                 <ArrowLeft className="h-4 w-4 mr-2" />
//                 Back to Login
//               </Link>
//             </Button>
//           </div>

//           <p className="text-xs text-center text-muted-foreground mt-4">
//             Didn't receive the email? Check your spam folder or try again.
//           </p>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }