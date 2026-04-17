"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Activity } from "lucide-react";

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-6">
              <Heart className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Almost There!</h1>
            <p className="text-white/80 max-w-md">
              Verify your email to start tracking your health journey with HealthTrack.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <Card className="w-full max-w-md border-0 shadow-none">
          <CardHeader className="text-center pb-2">
            <Link href="/" className="flex items-center gap-2 mb-4 lg:hidden justify-center">
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <span className="font-semibold text-lg">HealthTrack</span>
            </Link>
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-primary/10">
                <Heart className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
            <CardDescription>We've sent you a confirmation link</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-muted-foreground">
                Please check your email and click the confirmation link to verify your account.
              </p>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              <p>Didn't receive the email?</p>
              <Button variant="link" className="text-primary">
                Resend verification email
              </Button>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href="/auth/login">Back to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}