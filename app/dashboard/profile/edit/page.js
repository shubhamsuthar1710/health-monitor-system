"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Calendar, Ruler, Weight, User, Mail, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function EditProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    date_of_birth: "",
    blood_type: "",
    height_cm: "",
    weight_kg: "",
    phone: "",
  });

  // Verify token and load profile
  useEffect(() => {
    const verifyTokenAndLoadProfile = async () => {
      if (!token) {
        setError("Invalid or missing verification token");
        setIsLoading(false);
        return;
      }

      const supabase = getSupabaseBrowserClient();
      
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          router.push('/auth/login');
          return;
        }

        setUser(user);

        // Verify the token from edit_confirmations table
        const { data: verification, error: verifyError } = await supabase
          .from('edit_confirmations')
          .select('*')
          .eq('token', token)
          .eq('user_id', user.id)
          .eq('is_used', false)
          .gt('expires_at', new Date().toISOString())
          .maybeSingle();

        if (verifyError || !verification) {
          setError("This edit link is invalid or has expired. Please request a new one.");
          setIsLoading(false);
          return;
        }

        // Mark token as used
        await supabase
          .from('edit_confirmations')
          .update({ is_used: true, used_at: new Date().toISOString() })
          .eq('id', verification.id);

        // Load profile data
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        setProfile(profile);
        
        // Populate form with existing data
        setProfileForm({
          full_name: profile?.full_name || "",
          date_of_birth: profile?.date_of_birth || "",
          blood_type: profile?.blood_type || "",
          height_cm: profile?.height_cm?.toString() || "",
          weight_kg: profile?.weight_kg?.toString() || "",
          phone: profile?.phone || "",
        });

      } catch (error) {
        console.error("Error loading profile:", error);
        setError("Failed to load profile. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    verifyTokenAndLoadProfile();
  }, [token, router]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      const supabase = getSupabaseBrowserClient();

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: profileForm.full_name || null,
          date_of_birth: profileForm.date_of_birth || null,
          blood_type: profileForm.blood_type || null,
          height_cm: profileForm.height_cm ? parseFloat(profileForm.height_cm) : null,
          weight_kg: profileForm.weight_kg ? parseFloat(profileForm.weight_kg) : null,
          phone: profileForm.phone || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/auth/login?message=Profile updated successfully. Please login again.');
      }, 2000);

    } catch (error) {
      console.error("Error saving profile:", error);
      setError(error.message || "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    return dateString.split('T')[0];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Verifying your edit link...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-destructive/10">
                <XCircle className="h-12 w-12 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Edit Link Invalid</CardTitle>
            <CardDescription className="text-base mt-2">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <Link href="/dashboard/profile">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Profile
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Profile Updated!</CardTitle>
            <CardDescription className="text-base mt-2">
              Your profile has been successfully updated.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                Redirecting you to login in 2 seconds...
              </AlertDescription>
            </Alert>
            <Button asChild variant="outline" className="w-full">
              <Link href="/auth/login">
                Go to Login Now
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => router.push('/dashboard/profile')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Profile
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Edit Your Profile</CardTitle>
            <CardDescription>
              Update your personal information below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* User Info Display */}
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <span className="font-medium">{user?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Email cannot be changed</span>
                </div>
              </div>

              {/* Avatar Display */}
              <div className="flex flex-col items-center gap-4 pb-4 border-b">
                <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-2 border-primary">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="bg-muted text-2xl">
                    {profileForm.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm text-muted-foreground">
                  To change your profile picture, go to the main profile page
                </p>
              </div>

              {/* Profile Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    placeholder="Enter your full name"
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                    disabled={isSaving}
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="8866920701"
                    value={profileForm.phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setProfileForm({ ...profileForm, phone: value });
                    }}
                    maxLength={10}
                    disabled={isSaving}
                  />
                </div>

                {/* Date of Birth */}
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="dob"
                      type="date"
                      value={formatDateForInput(profileForm.date_of_birth)}
                      onChange={(e) => setProfileForm({ ...profileForm, date_of_birth: e.target.value })}
                      className="pl-9"
                      disabled={isSaving}
                    />
                  </div>
                </div>

                {/* Blood Type */}
                <div className="space-y-2">
                  <Label htmlFor="bloodType">Blood Type</Label>
                  <Select
                    value={profileForm.blood_type}
                    onValueChange={(value) => setProfileForm({ ...profileForm, blood_type: value })}
                  >
                    <SelectTrigger id="bloodType" disabled={isSaving}>
                      <SelectValue placeholder="Select blood type" />
                    </SelectTrigger>
                    <SelectContent>
                      {bloodTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Height */}
                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <div className="relative">
                    <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="height"
                      type="number"
                      placeholder="175"
                      value={profileForm.height_cm}
                      onChange={(e) => setProfileForm({ ...profileForm, height_cm: e.target.value })}
                      className="pl-9"
                      disabled={isSaving}
                    />
                  </div>
                </div>

                {/* Weight */}
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <div className="relative">
                    <Weight className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="weight"
                      type="number"
                      placeholder="70"
                      value={profileForm.weight_kg}
                      onChange={(e) => setProfileForm({ ...profileForm, weight_kg: e.target.value })}
                      className="pl-9"
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push('/dashboard/profile')}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}