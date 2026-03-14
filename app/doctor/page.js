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
import { 
  Stethoscope, 
  Loader2, 
  Mail, 
  Lock, 
  User, 
  FileText,
  Building2,
  MapPin,
  Calendar,
  ArrowLeft
} from "lucide-react";

export default function DoctorSignUpPage() {
  // ... your existing component code
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    licenseNumber: "",
    licenseCountry: "",
    licenseState: "",
    licenseExpiry: "",
    specialty: "",
    hospitalAffiliation: ""
  });
  
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setError("Full name is required");
      return false;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!formData.email.includes('@')) {
      setError("Please enter a valid email");
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
    if (!formData.licenseNumber.trim()) {
      setError("License number is required");
      return false;
    }
    if (!formData.licenseCountry.trim()) {
      setError("Country is required");
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
      const supabase = getSupabaseBrowserClient();
      
      // 1. Sign up the user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/doctor/verify-email`,
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

      // 2. Create doctor profile in doctors table
      const { error: doctorError } = await supabase
        .from('doctors')
        .insert({
          user_id: authData.user.id,
          full_name: formData.fullName,
          email: formData.email,
          license_number: formData.licenseNumber,
          license_country: formData.licenseCountry,
          license_state: formData.licenseState || null,
          license_expiry: formData.licenseExpiry || null,
          specialty: formData.specialty || null,
          hospital_affiliation: formData.hospitalAffiliation || null,
          verification_status: 'pending'
        });

      if (doctorError) {
        console.error("Doctor profile error:", doctorError);
        
        // If doctor table doesn't exist, show setup error
        if (doctorError.code === '42P01') {
          setError("Doctor registration system is being set up. Please try again in a few minutes.");
        } else {
          setError("Failed to create doctor profile. Please contact support.");
        }
        
        // Clean up the auth user if doctor profile creation fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        return;
      }

      // 3. Sign out immediately (they need to verify email)
      await supabase.auth.signOut();

      setSuccess(true);
      
    } catch (error) {
      console.error("Registration error:", error);
      setError(error.message || "Failed to register. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-green-100">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
            <CardDescription className="text-base mt-2">
              We've sent a verification link to <strong>{formData.email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg text-sm">
              <p className="font-medium mb-2">Next steps:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Click the verification link in your email</li>
                <li>Wait for admin approval (you'll receive another email)</li>
                <li>Once verified, you can login and access patient records</li>
              </ol>
            </div>
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
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Stethoscope className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Doctor Registration</CardTitle>
          <CardDescription>
            Register to access patient records. Your credentials will be verified by our team.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg flex items-center gap-2">
                <User className="h-4 w-4" />
                Personal Information
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name <span className="text-destructive">*</span></Label>
                <Input
                  id="fullName"
                  placeholder="Dr. John Doe"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="doctor@hospital.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-9"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Min. 6 characters"
                      value={formData.password}
                      onChange={handleChange}
                      className="pl-9"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="pl-9"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Medical License Information */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-medium text-lg flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Medical License Information
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="licenseNumber">License Number <span className="text-destructive">*</span></Label>
                <Input
                  id="licenseNumber"
                  placeholder="Medical license number"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="licenseCountry">Country <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="licenseCountry"
                      placeholder="e.g., United States"
                      value={formData.licenseCountry}
                      onChange={handleChange}
                      className="pl-9"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="licenseState">State/Province</Label>
                  <Input
                    id="licenseState"
                    placeholder="e.g., California"
                    value={formData.licenseState}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="licenseExpiry">License Expiry Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="licenseExpiry"
                    type="date"
                    value={formData.licenseExpiry}
                    onChange={handleChange}
                    className="pl-9"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-medium text-lg flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Professional Information
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="specialty">Specialty</Label>
                <Input
                  id="specialty"
                  placeholder="e.g., Cardiology"
                  value={formData.specialty}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hospitalAffiliation">Hospital/Clinic</Label>
                <Input
                  id="hospitalAffiliation"
                  placeholder="e.g., City General Hospital"
                  value={formData.hospitalAffiliation}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="pt-4">
              <p className="text-xs text-muted-foreground mb-4">
                <span className="text-destructive">*</span> Required fields
              </p>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Register as Doctor"
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Already have a doctor account?{" "}
              <Link href="/auth/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
            <p className="text-xs text-muted-foreground">
              <Link href="/" className="hover:underline">
                ← Back to patient sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}