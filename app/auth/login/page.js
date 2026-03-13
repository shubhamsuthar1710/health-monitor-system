"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Heart, Loader2, Home } from "lucide-react";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      
      let loginEmail = identifier;
      
      // Check if input is a patient ID (8 digits)
      if (/^\d{8}$/.test(identifier)) {
        console.log("Searching for patient_id:", identifier);
        
        // FIXED: Use .maybeSingle() instead of .single() to avoid 406 error
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('patient_id', identifier)
          .maybeSingle();
        
        console.log("Profile query result:", profile);
        console.log("Profile query error:", profileError);
        
        if (profileError) {
          console.error("Database error:", profileError);
          setError("Database error. Please try again.");
          setIsLoading(false);
          return;
        }
        
        if (!profile) {
          setError("Invalid Patient ID");
          setIsLoading(false);
          return;
        }
        
        loginEmail = profile.email;
        console.log("Found email:", loginEmail);
      }
      
      // Attempt login with email and password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (signInError) {
        console.error("Sign in error:", signInError);
        setError("Invalid email/patient ID or password");
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      {/* Home Button */}
      <Link href="/" className="absolute top-4 left-4 z-10">
        <Button variant="outline" size="sm" className="gap-2">
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">Home</span>
        </Button>
      </Link>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Heart className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>
            Sign in with your email or Patient ID
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
              <Label htmlFor="identifier">Email or Patient ID</Label>
              <Input
                id="identifier"
                type="text"
                placeholder="email@example.com or 10000001"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                disabled={isLoading}
              />
              {identifier && /^\d{8}$/.test(identifier) && (
                <p className="text-xs text-muted-foreground mt-1">
                  Logging in with Patient ID
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
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

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link 
              href="/auth/sign-up" 
              className="text-primary hover:underline font-medium"
            >
              Create one
            </Link>
          </div>
          <div className="mt-4 text-center border-t pt-4">
  <p className="text-xs text-muted-foreground mb-2">Are you a healthcare provider?</p>
  <Link 
    href="/auth/doctor/signup" 
    className="text-sm text-primary hover:underline font-medium"
  >
    Register as a Doctor →
  </Link>
</div>
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              New users get a unique 8-digit Patient ID after signup
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}