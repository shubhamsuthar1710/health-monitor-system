// "use client";

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
// import { Heart, Loader2, Mail, Lock, Fingerprint, Stethoscope } from "lucide-react";

// export default function PatientLoginPage() {
//   const [loginMethod, setLoginMethod] = useState("email");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [patientId, setPatientId] = useState("");
//   const [error, setError] = useState(null);
//   const [isLoading, setIsLoading] = useState(false);
  
//   const router = useRouter();
//   const supabase = getSupabaseBrowserClient();

//   // Check if user is already logged in
//   useEffect(() => {
//     const checkUser = async () => {
//       const { data: { session } } = await supabase.auth.getSession();
      
//       if (session) {
//         // Check if user is a patient (not a doctor)
//         const { data: doctor } = await supabase
//           .from('doctors')
//           .select('id')
//           .eq('user_id', session.user.id)
//           .maybeSingle();

//         if (!doctor) {
//           router.push('/dashboard');
//         }
//       }
//     };
    
//     checkUser();
//   }, [router, supabase]);

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     setError(null);
//     setIsLoading(true);

//     try {
//       let loginEmail = email;

//       if (loginMethod === "patientId") {
//         // Find user by patient ID
//         const { data: profile, error: profileError } = await supabase
//           .from('profiles')
//           .select('email')
//           .eq('patient_id', patientId)
//           .maybeSingle();

//         if (profileError || !profile) {
//           throw new Error("Invalid Patient ID");
//         }
//         loginEmail = profile.email;
//       }

//       // Attempt login
//       const { error: signInError } = await supabase.auth.signInWithPassword({
//         email: loginEmail,
//         password,
//       });

//       if (signInError) throw signInError;

//       // Verify this is a patient account
//       const { data: { user } } = await supabase.auth.getUser();
//       const { data: doctor } = await supabase
//         .from('doctors')
//         .select('id')
//         .eq('user_id', user.id)
//         .maybeSingle();

//       if (doctor) {
//         // This is a doctor - sign them out
//         await supabase.auth.signOut();
//         throw new Error("Please use the doctor login portal");
//       }

//       router.push('/dashboard');
//       router.refresh();
      
//     } catch (error) {
//       console.error("Login error:", error);
//       setError(error.message || "Invalid credentials");
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
//           <CardTitle className="text-2xl font-bold">Patient Login</CardTitle>
//           <CardDescription>
//             Sign in with your email or Patient ID
//           </CardDescription>
//         </CardHeader>

//         <CardContent>
//           <form onSubmit={handleLogin} className="space-y-4">
//             {error && (
//               <Alert variant="destructive">
//                 <AlertDescription>{error}</AlertDescription>
//               </Alert>
//             )}

//             <Tabs value={loginMethod} onValueChange={setLoginMethod} className="w-full">
//               <TabsList className="grid w-full grid-cols-2">
//                 <TabsTrigger value="email" className="gap-2">
//                   <Mail className="h-4 w-4" />
//                   Email
//                 </TabsTrigger>
//                 <TabsTrigger value="patientId" className="gap-2">
//                   <Fingerprint className="h-4 w-4" />
//                   Patient ID
//                 </TabsTrigger>
//               </TabsList>

//               <TabsContent value="email" className="space-y-4 mt-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="email">Email</Label>
//                   <div className="relative">
//                     <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                     <Input
//                       id="email"
//                       type="email"
//                       placeholder="you@example.com"
//                       value={email}
//                       onChange={(e) => setEmail(e.target.value)}
//                       className="pl-9"
//                       required={loginMethod === "email"}
//                       disabled={isLoading}
//                     />
//                   </div>
//                 </div>
//               </TabsContent>

//               <TabsContent value="patientId" className="space-y-4 mt-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="patientId">Patient ID</Label>
//                   <div className="relative">
//                     <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                     <Input
//                       id="patientId"
//                       placeholder="Enter 8-digit ID"
//                       value={patientId}
//                       onChange={(e) => setPatientId(e.target.value)}
//                       maxLength={8}
//                       pattern="\d{8}"
//                       className="pl-9 font-mono"
//                       required={loginMethod === "patientId"}
//                       disabled={isLoading}
//                     />
//                   </div>
//                   <p className="text-xs text-muted-foreground">
//                     Enter the 8-digit ID from your profile
//                   </p>
//                 </div>
//               </TabsContent>
//             </Tabs>

//             <div className="space-y-2">
//               <Label htmlFor="password">Password</Label>
//               <div className="relative">
//                 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                 <Input
//                   id="password"
//                   type="password"
//                   placeholder="Enter your password"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
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
//                   Signing in...
//                 </>
//               ) : (
//                 "Sign In"
//               )}
//             </Button>
//           </form>

//           <div className="mt-6 space-y-4">
//             <p className="text-center text-sm text-muted-foreground">
//               Don't have an account?{" "}
//               <Link href="/auth/sign-up" className="text-primary hover:underline font-medium">
//                 Sign up as Patient
//               </Link>
//             </p>
            
//             <div className="relative">
//               <div className="absolute inset-0 flex items-center">
//                 <span className="w-full border-t" />
//               </div>
//               <div className="relative flex justify-center text-xs uppercase">
//                 <span className="bg-background px-2 text-muted-foreground">
//                   Healthcare Provider?
//                 </span>
//               </div>
//             </div>
            
//             <Button variant="outline" className="w-full gap-2" asChild>
//               <Link href="/doctor/login">
//                 <Stethoscope className="h-4 w-4" />
//                 Go to Doctor Login
//               </Link>
//             </Button>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }
// "use client";

// import { useState, useEffect } from "react";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { getSupabaseBrowserClient } from "@/lib/supabase/client"; // ✅ Fixed import
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Heart, Loader2, Mail, Lock, Fingerprint, Stethoscope, Chrome } from "lucide-react";

// const INITIAL_STATE = {
//   email: "",
//   password: "",
//   patientId: "",
//   loginMethod: "email",
//   isLoading: false,
//   error: null,
// };

// export default function PatientLoginPage() {
//   const router = useRouter();
//   const supabase = getSupabaseBrowserClient(); // ✅ Fixed usage
//   const [state, setState] = useState(INITIAL_STATE);
//   const [mounted, setMounted] = useState(false);

//   // Check existing session on mount
//   useEffect(() => {
//     setMounted(true);
//     checkExistingSession();
//   }, []);

//   const checkExistingSession = async () => {
//     try {
//       const { data: { session } } = await supabase.auth.getSession();
      
//       if (session) {
//         const { data: profile } = await supabase
//           .from('profiles')
//           .select('id')
//           .eq('user_id', session.user.id)
//           .maybeSingle();

//         if (!profile) {
//           router.push('/dashboard');
//         }
//       }
//     } catch (error) {
//       console.error("Session check failed:", error);
//     }
//   };

//   const updateState = (updates) => {
//     setState(prev => ({ ...prev, ...updates }));
//   };

//   const handleGoogleLogin = async () => {
//     updateState({ isLoading: true, error: null });
    
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
//       updateState({ 
//         error: error instanceof Error ? error.message : "Google login failed", 
//         isLoading: false 
//       });
//     }
//   };

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     updateState({ isLoading: true, error: null });

//     try {
//       let loginEmail = state.email;

//       // Handle Patient ID login
//       if (state.loginMethod === "patientId") {
//         const { data: profile, error: profileError } = await supabase
//           .from('profiles')
//           .select('email')
//           .eq('patient_id', state.patientId)
//           .maybeSingle();

//         if (profileError || !profile) {
//           throw new Error("Invalid Patient ID. Please check and try again.");
//         }
//         loginEmail = profile.email;
//       }

//       // Attempt sign in
//       const { error: signInError } = await supabase.auth.signInWithPassword({
//         email: loginEmail,
//         password: state.password,
//       });

//       if (signInError) throw signInError;

//       // Verify user is not a doctor
//       const { data: { user } } = await supabase.auth.getUser();
//       const { data: profile } = await supabase
//         .from('profiles')
//         .select('id')
//         .eq('user_id', user.id)
//         .maybeSingle();

//       if (profile?.role === 'doctor') {
//         await supabase.auth.signOut();
//         throw new Error("Please use the doctor login portal");
//       }

//       // Successful login
//       router.push('/dashboard');
//       router.refresh();
      
//     } catch (error) {
//       updateState({ 
//         error: error instanceof Error ? error.message : "Invalid credentials" 
//       });
//     } finally {
//       updateState({ isLoading: false });
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
//           {/* Google Sign In */}
//           <div className="space-y-4">
//             <Button
//               onClick={handleGoogleLogin}
//               variant="outline"
//               size="lg"
//               className="w-full gap-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 shadow-sm"
//               disabled={state.isLoading}
//             >
//               <Chrome className="h-5 w-5" />
//               <span className="font-medium">Continue with Google</span>
//             </Button>

//             <div className="relative">
//               <div className="absolute inset-0 flex items-center">
//                 <span className="w-full border-t" />
//               </div>
//               <div className="relative flex justify-center text-xs uppercase">
//                 <span className="bg-background px-3 text-muted-foreground">
//                   Or continue with email
//                 </span>
//               </div>
//             </div>
//           </div>

//           {/* Email/Patient ID Login Form */}
//           <form onSubmit={handleLogin} className="space-y-5">
//             {state.error && (
//               <Alert variant="destructive" className="animate-in fade-in-50 duration-200">
//                 <AlertDescription className="text-sm">
//                   {state.error}
//                 </AlertDescription>
//               </Alert>
//             )}

//             <Tabs
//               value={state.loginMethod}
//               onValueChange={(value) => updateState({ loginMethod: value })}
//               className="w-full"
//             >
//               <TabsList className="grid w-full grid-cols-2 p-1">
//                 <TabsTrigger value="email" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
//                   <Mail className="h-4 w-4" />
//                   Email
//                 </TabsTrigger>
//                 <TabsTrigger value="patientId" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
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
//                       value={state.email}
//                       onChange={(e) => updateState({ email: e.target.value })}
//                       className="pl-9 h-11"
//                       required={state.loginMethod === "email"}
//                       disabled={state.isLoading}
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
//                       value={state.patientId}
//                       onChange={(e) => updateState({ patientId: e.target.value.replace(/\D/g, '').slice(0, 8) })}
//                       maxLength={8}
//                       className="pl-9 font-mono h-11"
//                       required={state.loginMethod === "patientId"}
//                       disabled={state.isLoading}
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
//                   value={state.password}
//                   onChange={(e) => updateState({ password: e.target.value })}
//                   className="pl-9 h-11"
//                   required
//                   disabled={state.isLoading}
//                   autoComplete="current-password"
//                 />
//               </div>
//             </div>

//             <Button
//               type="submit"
//               size="lg"
//               className="w-full gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
//               disabled={state.isLoading}
//             >
//               {state.isLoading ? (
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

//             <Button
//               variant="outline"
//               className="w-full gap-2"
//               asChild
//             >
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