"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle, ArrowLeft } from "lucide-react";

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function ConfirmEditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState(null);
  
  // Edit form state
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    date_of_birth: "",
    blood_type: "",
    height_cm: "",
    weight_kg: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError("No verification token provided");
        setVerifying(false);
        setLoading(false);
        return;
      }

      try {
        const supabase = getSupabaseBrowserClient();
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setError("Please log in to continue");
          setVerifying(false);
          setLoading(false);
          return;
        }

        // Verify token
        const { data: confirmation, error: confirmError } = await supabase
          .from('edit_confirmations')
          .select('*')
          .eq('token', token)
          .eq('user_id', user.id)
          .eq('is_used', false)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (confirmError || !confirmation) {
          setError("Invalid or expired confirmation link");
          setVerifying(false);
          setLoading(false);
          return;
        }

        // Get current profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          setProfileForm({
            full_name: profile.full_name || "",
            date_of_birth: profile.date_of_birth || "",
            blood_type: profile.blood_type || "",
            height_cm: profile.height_cm?.toString() || "",
            weight_kg: profile.weight_kg?.toString() || "",
          });
          setProfileData(profile);
        }

        // Mark token as used
        await supabase
          .from('edit_confirmations')
          .update({ is_used: true, used_at: new Date().toISOString() })
          .eq('id', confirmation.id);

        setIsValid(true);
        setVerifying(false);
        setLoading(false);
      } catch (err) {
        console.error("Verification error:", err);
        setError("An error occurred during verification");
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: profileForm.full_name || null,
          date_of_birth: profileForm.date_of_birth || null,
          blood_type: profileForm.blood_type || null,
          height_cm: profileForm.height_cm ? parseFloat(profileForm.height_cm) : null,
          weight_kg: profileForm.weight_kg ? parseFloat(profileForm.weight_kg) : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setSaveSuccess(true);
      setTimeout(() => {
        router.push('/dashboard/profile');
      }, 2000);
    } catch (err) {
      console.error("Save error:", err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-destructive/10">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">Invalid Link</CardTitle>
            <CardDescription className="text-center">
              {error || "This confirmation link is invalid or has expired"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard/profile">Back to Profile</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (saveSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">Profile Updated!</CardTitle>
            <CardDescription className="text-center">
              Your changes have been saved successfully.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground mb-4">
              Redirecting you back to your profile...
            </p>
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
          className="mb-4"
          onClick={() => router.push('/dashboard/profile')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Profile
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>
              Your email has been verified. You can now update your profile information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={profileForm.date_of_birth}
                  onChange={(e) => setProfileForm({ ...profileForm, date_of_birth: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="blood_type">Blood Type</Label>
                <Select
                  value={profileForm.blood_type}
                  onValueChange={(value) => setProfileForm({ ...profileForm, blood_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood type" />
                  </SelectTrigger>
                  <SelectContent>
                    {bloodTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={profileForm.height_cm}
                  onChange={(e) => setProfileForm({ ...profileForm, height_cm: e.target.value })}
                  placeholder="175"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={profileForm.weight_kg}
                  onChange={(e) => setProfileForm({ ...profileForm, weight_kg: e.target.value })}
                  placeholder="70"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => router.push('/dashboard/profile')}>
                Cancel
              </Button>
              <Button onClick={handleSaveChanges} disabled={isSaving}>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}