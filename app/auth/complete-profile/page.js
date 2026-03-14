"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Calendar, Ruler, Weight, Camera, User, Mail } from "lucide-react";

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function CompleteProfilePage() {
  const fileInputRef = useRef(null);
  const router = useRouter();
  
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    date_of_birth: "",
    blood_type: "",
    height_cm: "",
    weight_kg: "",
    phone: "",
  });

  // Check if user is authenticated and email is verified
  useEffect(() => {
    const checkUser = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/auth/login");
        return;
      }
      
      if (!user.email_confirmed_at) {
        router.push("/auth/check-email");
        return;
      }
      
      // Check if profile already has required fields
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (profile) {
        setUserName(profile.full_name || user.user_metadata?.full_name || "");
        
        // Check if profile is already complete (has required fields)
        if (profile.date_of_birth || profile.blood_type || profile.phone) {
          setIsProfileComplete(true);
          // Pre-fill form with existing data
          setProfileForm({
            date_of_birth: profile.date_of_birth || "",
            blood_type: profile.blood_type || "",
            height_cm: profile.height_cm?.toString() || "",
            weight_kg: profile.weight_kg?.toString() || "",
            phone: profile.phone || "",
          });
          
          if (profile.avatar_url) {
            setAvatarPreview(profile.avatar_url);
          }
        }
      } else {
        setUserName(user.user_metadata?.full_name || "");
      }
      
      setUserEmail(user.email || "");
      setIsLoading(false);
    };
    
    checkUser();
  }, [router]);

  // If profile is complete, show different UI
  if (isProfileComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-green-100">
                <Mail className="h-8 w-8 text-green-600" />
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
                Your profile is already complete. You can update it anytime from the dashboard.
              </AlertDescription>
            </Alert>
            <Button onClick={() => router.push('/dashboard')} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("File size must be less than 2MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async (userId) => {
    if (!avatarFile) return null;
    
    setIsUploading(true);
    
    try {
      const supabase = getSupabaseBrowserClient();
      const fileExt = avatarFile.name.split(".").pop();
      const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, avatarFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading avatar:", error);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("User not found");

      // Upload avatar if selected
      let avatarUrl = null;
      if (avatarFile) {
        avatarUrl = await uploadAvatar(user.id);
      }

      // Update profile with all information
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          date_of_birth: profileForm.date_of_birth || null,
          blood_type: profileForm.blood_type || null,
          height_cm: profileForm.height_cm ? parseFloat(profileForm.height_cm) : null,
          weight_kg: profileForm.weight_kg ? parseFloat(profileForm.weight_kg) : null,
          phone: profileForm.phone || null,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Redirect to dashboard
      router.push("/dashboard");
      
    } catch (error) {
      console.error("Error saving profile:", error);
      setError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Complete Your Profile</CardTitle>
            <CardDescription>
              Tell us more about yourself to personalize your health journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* User Info Display */}
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <span className="font-medium">{userName || "User"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">{userEmail}</span>
                </div>
              </div>

              {/* Profile Image Upload */}
              <div className="flex flex-col items-center gap-4 pb-4 border-b">
                <div className="relative">
                  <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-2 border-primary">
                    <AvatarImage src={avatarPreview} />
                    <AvatarFallback className="bg-muted text-2xl">
                      {userName?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="absolute bottom-0 right-0 rounded-full bg-background"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSaving || isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarSelect}
                    disabled={isSaving || isUploading}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Upload a profile picture (optional)
                </p>
              </div>

              {/* Profile Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    disabled={isSaving || isUploading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="dob"
                      type="date"
                      value={profileForm.date_of_birth}
                      onChange={(e) => setProfileForm({ ...profileForm, date_of_birth: e.target.value })}
                      className="pl-9"
                      disabled={isSaving || isUploading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bloodType">Blood Type</Label>
                  <Select
                    value={profileForm.blood_type}
                    onValueChange={(value) => setProfileForm({ ...profileForm, blood_type: value })}
                  >
                    <SelectTrigger id="bloodType" disabled={isSaving || isUploading}>
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
                  <div className="relative">
                    <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="height"
                      type="number"
                      placeholder="175"
                      value={profileForm.height_cm}
                      onChange={(e) => setProfileForm({ ...profileForm, height_cm: e.target.value })}
                      className="pl-9"
                      disabled={isSaving || isUploading}
                    />
                  </div>
                </div>

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
                      disabled={isSaving || isUploading}
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSaving || isUploading}>
                {isSaving || isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isUploading ? "Uploading image..." : "Saving profile..."}
                  </>
                ) : (
                  "Complete Profile & Go to Dashboard"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}