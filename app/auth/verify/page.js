"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, CheckCircle2, XCircle, RefreshCw, ArrowLeft } from "lucide-react";

export default function VerifyPage() {
  const [status, setStatus] = useState('checking'); // checking, unverified, verified, error, resending
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    checkVerificationStatus();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const checkVerificationStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // User is logged in, email is verified
        setStatus('verified');
        
        // Check if user is doctor or patient
        const { data: doctor } = await supabase
          .from('doctors')
          .select('verification_status')
          .eq('user_id', session.user.id)
          .single();

        if (doctor) {
          // Auto-redirect after 3 seconds
          setTimeout(() => {
            router.push('/doctor/pending');
          }, 3000);
        } else {
          setTimeout(() => {
            router.push('/dashboard');
          }, 3000);
        }
        return;
      }

      // No session, check if we have email in localStorage
      const savedEmail = localStorage.getItem('pendingVerificationEmail');
      if (savedEmail) {
        setEmail(savedEmail);
      }

      // Check URL for error
      const errorParam = searchParams.get('error');
      if (errorParam) {
        setError(errorParam);
      }

      setStatus('unverified');
      
    } catch (error) {
      console.error('Error checking status:', error);
      setStatus('error');
      setError('Failed to check verification status');
    }
  };

  const resendVerification = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setStatus('resending');
    setError('');

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      // Save email to localStorage
      localStorage.setItem('pendingVerificationEmail', email);
      
      setStatus('sent');
      setCountdown(60); // 60 second cooldown
      
    } catch (error) {
      console.error('Error resending verification:', error);
      setError(error.message || 'Failed to resend verification email');
      setStatus('unverified');
    }
  };

  const handleManualVerification = async () => {
    setStatus('checking');
    await checkVerificationStatus();
  };

  // Loading state
  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-lg font-medium">Checking verification status...</p>
              <p className="text-sm text-muted-foreground mt-2">
                Please wait while we verify your email.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verified state
  if (status === 'verified') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Email Verified!</CardTitle>
            <CardDescription className="text-base mt-2">
              Your email has been successfully verified.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                Redirecting you to your dashboard in a few seconds...
              </AlertDescription>
            </Alert>
            <Button asChild className="w-full">
              <Link href="/dashboard">
                Go to Dashboard Now
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Sent state (email resent)
  if (status === 'sent') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-green-100">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Verification Email Sent</CardTitle>
            <CardDescription className="text-base mt-2">
              We've sent a new verification link to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                Please check your email and click the verification link. The link will expire in 24 hours.
              </AlertDescription>
            </Alert>
            
            {countdown > 0 && (
              <p className="text-sm text-center text-muted-foreground">
                You can request another email in {countdown} seconds
              </p>
            )}

            <div className="flex flex-col gap-3">
              <Button 
                onClick={handleManualVerification} 
                variant="outline" 
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                I've Verified My Email
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/auth/login">
                  Go to Login
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default unverified/error state
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-yellow-100">
              <Mail className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Email Verification Required</CardTitle>
          <CardDescription className="text-base mt-2">
            {error || "Please verify your email address to continue."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="bg-muted p-4 rounded-lg text-sm">
            <p className="font-medium mb-2">Why do I need to verify?</p>
            <p className="text-muted-foreground">
              Email verification helps us ensure the security of your account and 
              allows us to send you important notifications about your health data.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Your Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === 'resending'}
              />
            </div>

            <Button 
              onClick={resendVerification} 
              className="w-full gap-2"
              disabled={status === 'resending' || !email || countdown > 0}
            >
              {status === 'resending' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : countdown > 0 ? (
                `Wait ${countdown}s`
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Resend Verification Email
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>

            <Button asChild variant="outline" className="w-full">
              <Link href="/auth/login">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Link>
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground mt-4">
            Didn't receive the email? Check your spam folder or try again.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}