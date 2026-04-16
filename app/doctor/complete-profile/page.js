"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Stethoscope, Loader2, User, Mail, FileText, Building2, MapPin, Calendar, ArrowLeft, CheckCircle2
} from "lucide-react";

export default function DoctorCompleteProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    license_number: "",
    license_country: "",
    license_state: "",
    license_expiry: "",
    specialty: "",
    hospital_affiliation: "",
  });
  
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const supabaseClient = getSupabaseBrowserClient();
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
      
      if (userError || !user) {
        router.push('/doctor/login');
        return;
      }

      setUser(user);

      // Get existing profile
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
      }

      if (profile) {
        setProfile(profile);
        
        // If profile is already complete, go to dashboard
        if (profile.is_profile_complete === true) {
          router.push('/doctor/dashboard');
          return;
        }

        // Pre-fill form with existing data
        setFormData({
          license_number: profile.license_number || "",
          license_country: profile.license_country || "",
          license_state: profile.license_state || "",
          license_expiry: profile.license_expiry || "",
          specialty: profile.specialty || "",
          hospital_affiliation: profile.hospital_affiliation || "",
        });
      }

      setLoading(false);
      
    } catch (error) {
      console.error("Error checking user:", error);
      router.push('/doctor/login');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const supabaseClient = getSupabaseBrowserClient();

      // Validate required fields
      if (!formData.license_number.trim()) {
        throw new Error("License number is required");
      }
      if (!formData.license_country.trim()) {
        throw new Error("License country is required");
      }

      // Update profile with license information
      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({
          license_number: formData.license_number,
          license_country: formData.license_country,
          license_state: formData.license_state || null,
          license_expiry: formData.license_expiry || null,
          specialty: formData.specialty || null,
          hospital_affiliation: formData.hospital_affiliation || null,
          is_profile_complete: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Redirect to doctor dashboard
      router.push('/doctor/dashboard');
      
    } catch (error) {
      console.error("Error saving profile:", error);
      setError(error.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/doctor/dashboard" className="inline-block mb-4">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-lg">
                <Stethoscope className="h-10 w-10 text-primary" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Complete Your Doctor Profile</CardTitle>
              <CardDescription className="text-base mt-2">
                Tell us about your medical license and practice
              </CardDescription>
            </div>
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
                  <span className="font-medium">{user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Doctor"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">{user?.email}</span>
                </div>
              </div>

              {/* License Information */}
              <div className="space-y-4">
                <h3 className="font-medium text-lg flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Medical License Information
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="license_number">License Number <span className="text-destructive">*</span></Label>
                  <Input
                    id="license_number"
                    placeholder="Medical license number"
                    value={formData.license_number}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                    required
                    disabled={saving}
                    className="h-11"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="license_country">Country <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="license_country"
                        placeholder="e.g., United States"
                        value={formData.license_country}
                        onChange={(e) => setFormData({ ...formData, license_country: e.target.value })}
                        className="pl-9 h-11"
                        required
                        disabled={saving}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="license_state">State/Province</Label>
                    <Input
                      id="license_state"
                      placeholder="e.g., California"
                      value={formData.license_state}
                      onChange={(e) => setFormData({ ...formData, license_state: e.target.value })}
                      disabled={saving}
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="license_expiry">License Expiry Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="license_expiry"
                      type="date"
                      value={formData.license_expiry}
                      onChange={(e) => setFormData({ ...formData, license_expiry: e.target.value })}
                      className="pl-9 h-11"
                      disabled={saving}
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
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    disabled={saving}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hospital_affiliation">Hospital/Clinic</Label>
                  <Input
                    id="hospital_affiliation"
                    placeholder="e.g., City General Hospital"
                    value={formData.hospital_affiliation}
                    onChange={(e) => setFormData({ ...formData, hospital_affiliation: e.target.value })}
                    disabled={saving}
                    className="h-11"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-11" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Complete Profile & Go to Dashboard
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}