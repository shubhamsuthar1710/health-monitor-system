"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, RefreshCw, ArrowLeft, AlertCircle } from "lucide-react";

export default function VerifyPage() {
  const [status, setStatus] = useState('loading');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Check if user is doctor or patient
        const { data: doctor } = await supabase
          .from('doctors')
          .select('verification_status')
          .eq('user_id', session.user.id)
          .single();

        if (doctor) {
          router.push('/doctor/pending');
        } else {
          router.push('/dashboard');
        }
      } else {
        // Get email from URL params or localStorage
        const emailParam = searchParams.get('email');
        if (emailParam) {
          setEmail(emailParam);
        } else {
          // Try to get from localStorage
          const savedEmail = localStorage.getItem('pendingVerificationEmail');
          if (savedEmail) {
            setEmail(savedEmail);
          }
        }
        setStatus('unverified');
      }
    } catch (error) {
      console.error('Error checking session:', error);
      setStatus('error');
      setError('Failed to verify your email. Please try again.');
    }
  };

  const resendVerification = async () => {
    setStatus('sending');
    setError('');
    
    try {
      if (!email) {
        setError('Email address not found. Please try signing up again.');
        setStatus('unverified');
        return;
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      setStatus('sent');
      
      // Store email in localStorage
      localStorage.setItem('pendingVerificationEmail', email);
      
    } catch (error) {
      console.error('Error resending verification:', error);
      setError(error.message || 'Failed to resend verification email');
      setStatus('unverified');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p>Checking verification status...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <div className="flex flex-col gap-3">
              <Button asChild variant="outline">
                <Link href="/auth/login">
                  Go to Login
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-yellow-100">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Email Verification Required</CardTitle>
          <CardDescription className="text-base mt-2">
            The verification link has expired or is invalid.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="bg-muted p-4 rounded-lg text-sm">
            <p className="font-medium mb-2">What happened?</p>
            <p className="text-muted-foreground">
              Email verification links expire after 24 hours for security reasons. 
              If you didn't verify your email within that time, you'll need to request a new link.
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="email">Your Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <Button 
              onClick={resendVerification} 
              className="w-full gap-2"
              disabled={status === 'sending' || !email}
            >
              {status === 'sending' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Resend Verification Email
                </>
              )}
            </Button>

            <Button asChild variant="outline" className="w-full">
              <Link href="/auth/login">
                Back to Login
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Label({ children, htmlFor }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium">
      {children}
    </label>
  );
}

function Input({ id, type = "text", placeholder, value, onChange }) {
  return (
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2 border rounded-md"
    />
  );
}