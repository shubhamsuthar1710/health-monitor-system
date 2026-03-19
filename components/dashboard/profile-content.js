// "use client";

// import React, { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { PatientIdCard } from "./patient-id-card";
// import { getSupabaseBrowserClient } from "@/lib/supabase/client";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
// import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Alert, AlertDescription } from "@/components/ui/alert"; // Add this line
// import { 
//   User, 
//   Pill, 
//   AlertTriangle, 
//   Heart, 
//   Users, 
//   Plus, 
//   Trash2, 
//   Loader2, 
//   Edit, 
//   Mail,
//   CheckCircle,
//   XCircle
// } from "lucide-react";

// const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
// const severityLevels = ["low", "medium", "high"];
// const relationships = ["Mother", "Father", "Sister", "Brother", "Grandmother", "Grandfather", "Aunt", "Uncle"];

// export function ProfileContent({ 
//   user, 
//   profile, 
//   medications, 
//   allergies, 
//   conditions, 
//   familyHistory 
// }) {
//   const router = useRouter();
//   const [activeTab, setActiveTab] = useState("personal");
  
//   // Edit mode state
//   const [isEditMode, setIsEditMode] = useState(false);
//   const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
//   const [isSendingEmail, setIsSendingEmail] = useState(false);
//   const [emailSent, setEmailSent] = useState(false);
//   const [emailError, setEmailError] = useState(null);
  
//   // Profile form state (only used in edit mode)
//   const [profileForm, setProfileForm] = useState({
//     full_name: profile?.full_name || "",
//     date_of_birth: profile?.date_of_birth || "",
//     blood_type: (profile?.blood_type || profile?.blood_group) || "",
//     height_cm: profile?.height_cm?.toString() || "",
//     weight_kg: profile?.weight_kg?.toString() || "",
//   });
  
//   const [isSavingProfile, setIsSavingProfile] = useState(false);
  
//   // Dialog states
//   const [medicationDialog, setMedicationDialog] = useState(false);
//   const [allergyDialog, setAllergyDialog] = useState(false);
//   const [conditionDialog, setConditionDialog] = useState(false);
//   const [familyDialog, setFamilyDialog] = useState(false);
//   const [deleteItem, setDeleteItem] = useState(null);
//   const [isSubmitting, setIsSubmitting] = useState(false);
  
//   // Form states for dialogs
//   const [medicationForm, setMedicationForm] = useState({ name: "", dosage: "", frequency: "" });
//   const [allergyForm, setAllergyForm] = useState({ allergen: "", severity: "", reaction: "" });
//   const [conditionForm, setConditionForm] = useState({ condition_name: "", diagnosed_date: "", notes: "" });
//   const [familyForm, setFamilyForm] = useState({ relationship: "", condition: "", notes: "" });

//   // Handle edit button click - show confirmation dialog
//   const handleEditRequest = () => {
//     setEmailError(null);
//     setShowConfirmationDialog(true);
//   };

//   // Send confirmation email
//   const sendConfirmationEmail = async () => {
//     setIsSendingEmail(true);
//     setEmailError(null);
    
//     try {
//       const supabase = getSupabaseBrowserClient();
      
//       // Generate a secure token
//       const token = crypto.randomUUID ? crypto.randomUUID() : 
//         Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
//       const expiresAt = new Date();
//       expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30 minutes expiry
      
//       // Check if edit_confirmations table exists, if not create it via API
//       try {
//         // Store token in database
//         const { error: insertError } = await supabase
//           .from('edit_confirmations')
//           .insert({
//             user_id: user.id,
//             token: token,
//             expires_at: expiresAt.toISOString(),
//             is_used: false,
//             requested_changes: profileForm,
//           });

//         if (insertError) {
//           console.error("Error inserting token:", insertError);
          
//           // If table doesn't exist, we need to create it
//           if (insertError.code === '42P01') { // relation does not exist
//             setEmailError("Edit confirmation system not set up. Please contact support.");
//             setIsSendingEmail(false);
//             return;
//           }
//           throw insertError;
//         }
//       } catch (dbError) {
//         console.error("Database error:", dbError);
//         setEmailError("Failed to create verification. Please try again.");
//         setIsSendingEmail(false);
//         return;
//       }

//       // Send email via API
//       const response = await fetch('/api/send-edit-confirmation', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           email: user.email,
//           token: token,
//           fullName: profileForm.full_name || user.email?.split('@')[0] || 'User',
//         }),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || 'Failed to send email');
//       }

//       // Show success state
//       setEmailSent(true);
      
//       // Close dialog after 2 seconds
//       setTimeout(() => {
//         setShowConfirmationDialog(false);
//         setEmailSent(false);
//         // Redirect to a waiting page or show instruction
//         router.push('/dashboard/profile?edit=verification-sent');
//       }, 2000);
      
//     } catch (error) {
//       console.error("Error sending confirmation email:", error);
//       setEmailError(error.message || "Failed to send confirmation email. Please try again.");
//     } finally {
//       setIsSendingEmail(false);
//     }
//   };

//   // Save profile changes (direct edit mode - used after email confirmation)
//   const handleSaveProfile = async () => {
//     setIsSavingProfile(true);
    
//     try {
//       const supabase = getSupabaseBrowserClient();
      
//       const { error } = await supabase.from("profiles").upsert({
//         id: user.id,
//         email: user.email,
//         full_name: profileForm.full_name || null,
//         date_of_birth: profileForm.date_of_birth || null,
//         blood_type: profileForm.blood_type || null,
//         height_cm: profileForm.height_cm ? parseFloat(profileForm.height_cm) : null,
//         weight_kg: profileForm.weight_kg ? parseFloat(profileForm.weight_kg) : null,
//         updated_at: new Date().toISOString(),
//       });

//       if (error) throw error;
      
//       setIsEditMode(false);
//       router.refresh();
//     } catch (error) {
//       console.error("Error saving profile:", error);
//       setEmailError(error.message);
//     } finally {
//       setIsSavingProfile(false);
//     }
//   };

//   // Cancel edit mode
//   const handleCancelEdit = () => {
//     // Reset form to original values
//     setProfileForm({
//       full_name: profile?.full_name || "",
//       date_of_birth: profile?.date_of_birth || "",
//       blood_type: (profile?.blood_type || profile?.blood_group) || "",
//       height_cm: profile?.height_cm?.toString() || "",
//       weight_kg: profile?.weight_kg?.toString() || "",
//     });
//     setIsEditMode(false);
//   };

//   // Format date for display
//   const formatDate = (dateString) => {
//     if (!dateString) return "Not specified";
//     return new Date(dateString).toLocaleDateString("en-US", {
//       year: "numeric",
//       month: "long",
//       day: "numeric",
//     });
//   };

//   // Check if user came from email verification
//   React.useEffect(() => {
//     const urlParams = new URLSearchParams(window.location.search);
//     if (urlParams.get('edit') === 'verified') {
//       setIsEditMode(true);
//     }
//   }, []);

//   // CRUD operations (unchanged)
//   const handleAddMedication = async () => {
//     setIsSubmitting(true);
//     const supabase = getSupabaseBrowserClient();
//     await supabase.from("medications").insert({
//       user_id: user.id,
//       name: medicationForm.name,
//       dosage: medicationForm.dosage || null,
//       frequency: medicationForm.frequency || null,
//       is_active: true,
//     });
//     setMedicationForm({ name: "", dosage: "", frequency: "" });
//     setMedicationDialog(false);
//     setIsSubmitting(false);
//     router.refresh();
//   };

//   const handleAddAllergy = async () => {
//     setIsSubmitting(true);
//     const supabase = getSupabaseBrowserClient();
//     await supabase.from("allergies").insert({
//       user_id: user.id,
//       name: allergyForm.allergen,
//       allergen: allergyForm.allergen,
//       severity: allergyForm.severity || null,
//       reaction: allergyForm.reaction || null,
//     });
//     setAllergyForm({ allergen: "", severity: "", reaction: "" });
//     setAllergyDialog(false);
//     setIsSubmitting(false);
//     router.refresh();
//   };

//   const handleAddCondition = async () => {
//     setIsSubmitting(true);
//     const supabase = getSupabaseBrowserClient();
//     await supabase.from("chronic_conditions").insert({
//       user_id: user.id,
//       name: conditionForm.condition_name,
//       condition_name: conditionForm.condition_name,
//       diagnosed_date: conditionForm.diagnosed_date || null,
//       notes: conditionForm.notes || null,
//     });
//     setConditionForm({ condition_name: "", diagnosed_date: "", notes: "" });
//     setConditionDialog(false);
//     setIsSubmitting(false);
//     router.refresh();
//   };

//   const handleAddFamilyHistory = async () => {
//     setIsSubmitting(true);
//     const supabase = getSupabaseBrowserClient();
//     await supabase.from("family_history").insert({
//       user_id: user.id,
//       relation: familyForm.relationship,
//       relationship: familyForm.relationship,
//       condition: familyForm.condition,
//       notes: familyForm.notes || null,
//     });
//     setFamilyForm({ relationship: "", condition: "", notes: "" });
//     setFamilyDialog(false);
//     setIsSubmitting(false);
//     router.refresh();
//   };

//   const handleDelete = async () => {
//     if (!deleteItem) return;
//     setIsSubmitting(true);
//     const supabase = getSupabaseBrowserClient();
//     await supabase.from(deleteItem.type).delete().eq("id", deleteItem.id);
//     setDeleteItem(null);
//     setIsSubmitting(false);
//     router.refresh();
//   };

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-foreground">Medical Profile</h1>
//           <p className="text-muted-foreground">Manage your health information</p>
//         </div>
//         {!isEditMode && (
//           <Button onClick={handleEditRequest} variant="outline" className="gap-2">
//             <Edit className="h-4 w-4" />
//             Edit Profile
//           </Button>
//         )}
//         {isEditMode && (
//           <Button variant="ghost" onClick={handleCancelEdit} className="gap-2">
//             <XCircle className="h-4 w-4" />
//             Cancel Edit
//           </Button>
//         )}
//       </div>

//       <Tabs value={activeTab} onValueChange={setActiveTab}>
//         <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
//           <TabsTrigger value="personal" className="gap-2">
//             <User className="h-4 w-4 hidden sm:block" />
//             Personal
//           </TabsTrigger>
//           <TabsTrigger value="medications" className="gap-2">
//             <Pill className="h-4 w-4 hidden sm:block" />
//             Medications
//           </TabsTrigger>
//           <TabsTrigger value="allergies" className="gap-2">
//             <AlertTriangle className="h-4 w-4 hidden sm:block" />
//             Allergies
//           </TabsTrigger>
//           <TabsTrigger value="conditions" className="gap-2">
//             <Heart className="h-4 w-4 hidden sm:block" />
//             Conditions
//           </TabsTrigger>
//           <TabsTrigger value="family" className="gap-2">
//             <Users className="h-4 w-4 hidden sm:block" />
//             Family
//           </TabsTrigger>
//         </TabsList>

//         {/* Personal Tab */}
//         <TabsContent value="personal" className="mt-6">
//           <Card>
//             <CardHeader>
//               <CardTitle>Personal Information</CardTitle>
//               <CardDescription>Your basic health profile</CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-6">
//               {/* Patient ID Card */}
//               <PatientIdCard patientId={profile?.patient_id} userName={profile?.full_name} />
              
//               {/* Avatar Display */}
//               <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b">
//                 <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-2 border-primary">
//                   <AvatarImage src={profile?.avatar_url} />
//                   <AvatarFallback className="bg-muted text-2xl">
//                     {profile?.full_name?.charAt(0) || user.email?.charAt(0) || "U"}
//                   </AvatarFallback>
//                 </Avatar>
//                 <div className="flex-1 text-center sm:text-left">
//                   <h3 className="font-medium text-lg">{profile?.full_name || "User"}</h3>
//                   <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
//                 </div>
//               </div>

//               {/* Profile Information Display/Edit */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 {/* Full Name */}
//                 <div>
//                   <Label className="text-sm text-muted-foreground">Full Name</Label>
//                   {isEditMode ? (
//                     <Input
//                       value={profileForm.full_name}
//                       onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
//                       className="mt-1"
//                     />
//                   ) : (
//                     <p className="text-base font-medium mt-1">{profile?.full_name || "Not specified"}</p>
//                   )}
//                 </div>

//                 {/* Email (always read-only) */}
//                 <div>
//                   <Label className="text-sm text-muted-foreground">Email</Label>
//                   <p className="text-base font-medium mt-1">{user.email}</p>
//                 </div>

//                 {/* Date of Birth */}
//                 <div>
//                   <Label className="text-sm text-muted-foreground">Date of Birth</Label>
//                   {isEditMode ? (
//                     <Input
//                       type="date"
//                       value={profileForm.date_of_birth}
//                       onChange={(e) => setProfileForm({ ...profileForm, date_of_birth: e.target.value })}
//                       className="mt-1"
//                     />
//                   ) : (
//                     <p className="text-base font-medium mt-1">{formatDate(profile?.date_of_birth)}</p>
//                   )}
//                 </div>

//                 {/* Blood Type */}
//                 <div>
//                   <Label className="text-sm text-muted-foreground">Blood Type</Label>
//                   {isEditMode ? (
//                     <Select
//                       value={profileForm.blood_type}
//                       onValueChange={(value) => setProfileForm({ ...profileForm, blood_type: value })}
//                     >
//                       <SelectTrigger className="mt-1">
//                         <SelectValue placeholder="Select blood type" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {bloodTypes.map((type) => (
//                           <SelectItem key={type} value={type}>{type}</SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   ) : (
//                     <p className="text-base font-medium mt-1">{profile?.blood_type || profile?.blood_group || "Not specified"}</p>
//                   )}
//                 </div>

//                 {/* Height */}
//                 <div>
//                   <Label className="text-sm text-muted-foreground">Height (cm)</Label>
//                   {isEditMode ? (
//                     <Input
//                       type="number"
//                       value={profileForm.height_cm}
//                       onChange={(e) => setProfileForm({ ...profileForm, height_cm: e.target.value })}
//                       placeholder="175"
//                       className="mt-1"
//                     />
//                   ) : (
//                     <p className="text-base font-medium mt-1">{profile?.height_cm ? `${profile.height_cm} cm` : "Not specified"}</p>
//                   )}
//                 </div>

//                 {/* Weight */}
//                 <div>
//                   <Label className="text-sm text-muted-foreground">Weight (kg)</Label>
//                   {isEditMode ? (
//                     <Input
//                       type="number"
//                       value={profileForm.weight_kg}
//                       onChange={(e) => setProfileForm({ ...profileForm, weight_kg: e.target.value })}
//                       placeholder="70"
//                       className="mt-1"
//                     />
//                   ) : (
//                     <p className="text-base font-medium mt-1">{profile?.weight_kg ? `${profile.weight_kg} kg` : "Not specified"}</p>
//                   )}
//                 </div>
//               </div>

//               {/* Edit Mode Actions */}
//               {isEditMode && (
//                 <div className="flex justify-end gap-3 pt-4 border-t">
//                   <Button variant="outline" onClick={handleCancelEdit}>
//                     Cancel
//                   </Button>
//                   <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
//                     {isSavingProfile ? (
//                       <>
//                         <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                         Saving...
//                       </>
//                     ) : (
//                       "Save Changes"
//                     )}
//                   </Button>
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         </TabsContent>

//         {/* Medications Tab (unchanged) */}
//         <TabsContent value="medications" className="mt-6">
//           <Card>
//             <CardHeader className="flex flex-row items-center justify-between">
//               <div>
//                 <CardTitle>Medications</CardTitle>
//                 <CardDescription>Track your current medications</CardDescription>
//               </div>
//               <Button onClick={() => setMedicationDialog(true)} size="sm">
//                 <Plus className="h-4 w-4 mr-2" />
//                 Add
//               </Button>
//             </CardHeader>
//             <CardContent>
//               {medications.length > 0 ? (
//                 <div className="space-y-3">
//                   {medications.map((med) => (
//                     <div key={med.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 group">
//                       <div>
//                         <div className="flex items-center gap-2">
//                           <p className="font-medium">{med.name}</p>
//                           <Badge variant={med.is_active ? "default" : "secondary"}>
//                             {med.is_active ? "Active" : "Inactive"}
//                           </Badge>
//                         </div>
//                         <p className="text-sm text-muted-foreground">
//                           {[med.dosage, med.frequency].filter(Boolean).join(" - ") || "No details"}
//                         </p>
//                       </div>
//                       <Button
//                         variant="ghost"
//                         size="icon"
//                         className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
//                         onClick={() => setDeleteItem({ type: "medications", id: med.id })}
//                       >
//                         <Trash2 className="h-4 w-4" />
//                       </Button>
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 <p className="text-center text-muted-foreground py-8">
//                   No medications added yet
//                 </p>
//               )}
//             </CardContent>
//           </Card>
//         </TabsContent>

//         {/* Allergies Tab (unchanged) */}
//         <TabsContent value="allergies" className="mt-6">
//           <Card>
//             <CardHeader className="flex flex-row items-center justify-between">
//               <div>
//                 <CardTitle>Allergies</CardTitle>
//                 <CardDescription>Record your known allergies</CardDescription>
//               </div>
//               <Button onClick={() => setAllergyDialog(true)} size="sm">
//                 <Plus className="h-4 w-4 mr-2" />
//                 Add
//               </Button>
//             </CardHeader>
//             <CardContent>
//               {allergies.length > 0 ? (
//                 <div className="space-y-3">
//                   {allergies.map((allergy) => (
//                     <div key={allergy.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 group">
//                       <div>
//                         <div className="flex items-center gap-2">
//                           <p className="font-medium">{allergy.allergen}</p>
//                           {allergy.severity && (
//                             <Badge variant={allergy.severity === "severe" ? "destructive" : "secondary"}>
//                               {allergy.severity}
//                             </Badge>
//                           )}
//                         </div>
//                         {allergy.reaction && (
//                           <p className="text-sm text-muted-foreground">{allergy.reaction}</p>
//                         )}
//                       </div>
//                       <Button
//                         variant="ghost"
//                         size="icon"
//                         className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
//                         onClick={() => setDeleteItem({ type: "allergies", id: allergy.id })}
//                       >
//                         <Trash2 className="h-4 w-4" />
//                       </Button>
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 <p className="text-center text-muted-foreground py-8">
//                   No allergies recorded
//                 </p>
//               )}
//             </CardContent>
//           </Card>
//         </TabsContent>

//         {/* Conditions Tab (unchanged) */}
//         <TabsContent value="conditions" className="mt-6">
//           <Card>
//             <CardHeader className="flex flex-row items-center justify-between">
//               <div>
//                 <CardTitle>Chronic Conditions</CardTitle>
//                 <CardDescription>Track ongoing health conditions</CardDescription>
//               </div>
//               <Button onClick={() => setConditionDialog(true)} size="sm">
//                 <Plus className="h-4 w-4 mr-2" />
//                 Add
//               </Button>
//             </CardHeader>
//             <CardContent>
//               {conditions.length > 0 ? (
//                 <div className="space-y-3">
//                   {conditions.map((condition) => (
//                     <div key={condition.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 group">
//                       <div>
//                         <p className="font-medium">{condition.condition_name}</p>
//                         <p className="text-sm text-muted-foreground">
//                           {condition.diagnosed_date
//                             ? `Diagnosed: ${new Date(condition.diagnosed_date).toLocaleDateString()}`
//                             : "Diagnosis date not specified"}
//                         </p>
//                         {condition.notes && (
//                           <p className="text-sm text-muted-foreground mt-1">{condition.notes}</p>
//                         )}
//                       </div>
//                       <Button
//                         variant="ghost"
//                         size="icon"
//                         className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
//                         onClick={() => setDeleteItem({ type: "chronic_conditions", id: condition.id })}
//                       >
//                         <Trash2 className="h-4 w-4" />
//                       </Button>
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 <p className="text-center text-muted-foreground py-8">
//                   No conditions recorded
//                 </p>
//               )}
//             </CardContent>
//           </Card>
//         </TabsContent>

//         {/* Family History Tab (unchanged) */}
//         <TabsContent value="family" className="mt-6">
//           <Card>
//             <CardHeader className="flex flex-row items-center justify-between">
//               <div>
//                 <CardTitle>Family Medical History</CardTitle>
//                 <CardDescription>Important health information from family</CardDescription>
//               </div>
//               <Button onClick={() => setFamilyDialog(true)} size="sm">
//                 <Plus className="h-4 w-4 mr-2" />
//                 Add
//               </Button>
//             </CardHeader>
//             <CardContent>
//               {familyHistory.length > 0 ? (
//                 <div className="space-y-3">
//                   {familyHistory.map((history) => (
//                     <div key={history.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 group">
//                       <div>
//                         <div className="flex items-center gap-2">
//                           <p className="font-medium">{history.condition}</p>
//                           <Badge variant="outline">{history.relationship}</Badge>
//                         </div>
//                         {history.notes && (
//                           <p className="text-sm text-muted-foreground mt-1">{history.notes}</p>
//                         )}
//                       </div>
//                       <Button
//                         variant="ghost"
//                         size="icon"
//                         className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
//                         onClick={() => setDeleteItem({ type: "family_history", id: history.id })}
//                       >
//                         <Trash2 className="h-4 w-4" />
//                       </Button>
//                     </div>  
//                   ))}
//                 </div>
//               ) : (
//                 <p className="text-center text-muted-foreground py-8">
//                   No family history recorded
//                 </p>
//               )}
//             </CardContent>
//           </Card>
//         </TabsContent>
//       </Tabs>

//       {/* Confirmation Email Dialog */}
//       <Dialog open={showConfirmationDialog} onOpenChange={setShowConfirmationDialog}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Confirm Profile Edit</DialogTitle>
//             <DialogDescription>
//               For security reasons, we'll send a confirmation link to your email address.
//               Click the link in the email to start editing your profile.
//             </DialogDescription>
//           </DialogHeader>
          
//           {emailError && (
//             <Alert variant="destructive" className="mb-4">
//               <AlertDescription>{emailError}</AlertDescription>
//             </Alert>
//           )}
          
//           {!emailSent ? (
//             <div className="py-4">
//               <div className="flex items-center gap-3 p-4 bg-muted rounded-lg mb-4">
//                 <Mail className="h-5 w-5 text-primary" />
//                 <p className="text-sm">We'll send a confirmation to: <strong>{user.email}</strong></p>
//               </div>
//               <p className="text-xs text-muted-foreground">
//                 The link will expire in 30 minutes.
//               </p>
//             </div>
//           ) : (
//             <div className="py-4 text-center">
//               <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
//               <p className="font-medium">Confirmation email sent!</p>
//               <p className="text-sm text-muted-foreground mt-1">
//                 Please check your inbox and click the link to start editing.
//               </p>
//             </div>
//           )}

//           <DialogFooter>
//             <Button variant="outline" onClick={() => setShowConfirmationDialog(false)}>
//               Cancel
//             </Button>
//             {!emailSent ? (
//               <Button onClick={sendConfirmationEmail} disabled={isSendingEmail}>
//                 {isSendingEmail ? (
//                   <>
//                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                     Sending...
//                   </>
//                 ) : (
//                   <>
//                     <Mail className="mr-2 h-4 w-4" />
//                     Send Confirmation
//                   </>
//                 )}
//               </Button>
//             ) : (
//               <Button onClick={() => setShowConfirmationDialog(false)}>
//                 Close
//               </Button>
//             )}
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Add Medication Dialog (unchanged) */}
//       <Dialog open={medicationDialog} onOpenChange={setMedicationDialog}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Add Medication</DialogTitle>
//             <DialogDescription>Add a new medication to your profile</DialogDescription>
//           </DialogHeader>
//           <div className="space-y-4">
//             <div className="space-y-2">
//               <Label htmlFor="med-name">Medication Name</Label>
//               <Input
//                 id="med-name"
//                 value={medicationForm.name}
//                 onChange={(e) => setMedicationForm({ ...medicationForm, name: e.target.value })}
//                 placeholder="e.g., Aspirin"
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="med-dosage">Dosage</Label>
//               <Input
//                 id="med-dosage"
//                 value={medicationForm.dosage}
//                 onChange={(e) => setMedicationForm({ ...medicationForm, dosage: e.target.value })}
//                 placeholder="e.g., 100mg"
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="med-frequency">Frequency</Label>
//               <Input
//                 id="med-frequency"
//                 value={medicationForm.frequency}
//                 onChange={(e) => setMedicationForm({ ...medicationForm, frequency: e.target.value })}
//                 placeholder="e.g., Once daily"
//               />
//             </div>
//           </div>
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setMedicationDialog(false)}>
//               Cancel
//             </Button>
//             <Button onClick={handleAddMedication} disabled={!medicationForm.name || isSubmitting}>
//               {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Add Allergy Dialog (unchanged) */}
//       <Dialog open={allergyDialog} onOpenChange={setAllergyDialog}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Add Allergy</DialogTitle>
//             <DialogDescription>Record a known allergy</DialogDescription>
//           </DialogHeader>
//           <div className="space-y-4">
//             <div className="space-y-2">
//               <Label htmlFor="allergen">Allergen</Label>
//               <Input
//                 id="allergen"
//                 value={allergyForm.allergen}
//                 onChange={(e) => setAllergyForm({ ...allergyForm, allergen: e.target.value })}
//                 placeholder="e.g., Penicillin"
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="severity">Severity</Label>
//               <Select
//                 value={allergyForm.severity}
//                 onValueChange={(value) => setAllergyForm({ ...allergyForm, severity: value })}
//               >
//                 <SelectTrigger id="severity">
//                   <SelectValue placeholder="Select severity" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {severityLevels.map((level) => (
//                     <SelectItem key={level} value={level} className="capitalize">
//                       {level}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="reaction">Reaction</Label>
//               <Input
//                 id="reaction"
//                 value={allergyForm.reaction}
//                 onChange={(e) => setAllergyForm({ ...allergyForm, reaction: e.target.value })}
//                 placeholder="e.g., Hives, difficulty breathing"
//               />
//             </div>
//           </div>
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setAllergyDialog(false)}>
//               Cancel
//             </Button>
//             <Button onClick={handleAddAllergy} disabled={!allergyForm.allergen || isSubmitting}>
//               {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Add Condition Dialog (unchanged) */}
//       <Dialog open={conditionDialog} onOpenChange={setConditionDialog}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Add Condition</DialogTitle>
//             <DialogDescription>Record a chronic condition</DialogDescription>
//           </DialogHeader>
//           <div className="space-y-4">
//             <div className="space-y-2">
//               <Label htmlFor="condition-name">Condition Name</Label>
//               <Input
//                 id="condition-name"
//                 value={conditionForm.condition_name}
//                 onChange={(e) => setConditionForm({ ...conditionForm, condition_name: e.target.value })}
//                 placeholder="e.g., Type 2 Diabetes"
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="diagnosed-date">Diagnosed Date</Label>
//               <Input
//                 id="diagnosed-date"
//                 type="date"
//                 value={conditionForm.diagnosed_date}
//                 onChange={(e) => setConditionForm({ ...conditionForm, diagnosed_date: e.target.value })}
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="condition-notes">Notes</Label>
//               <Input
//                 id="condition-notes"
//                 value={conditionForm.notes}
//                 onChange={(e) => setConditionForm({ ...conditionForm, notes: e.target.value })}
//                 placeholder="Additional notes..."
//               />
//             </div>
//           </div>
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setConditionDialog(false)}>
//               Cancel
//             </Button>
//             <Button onClick={handleAddCondition} disabled={!conditionForm.condition_name || isSubmitting}>
//               {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Add Family History Dialog (unchanged) */}
//       <Dialog open={familyDialog} onOpenChange={setFamilyDialog}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Add Family History</DialogTitle>
//             <DialogDescription>Record family medical history</DialogDescription>
//           </DialogHeader>
//           <div className="space-y-4">
//             <div className="space-y-2">
//               <Label htmlFor="relationship">Relationship</Label>
//               <Select
//                 value={familyForm.relationship}
//                 onValueChange={(value) => setFamilyForm({ ...familyForm, relationship: value })}
//               >
//                 <SelectTrigger id="relationship">
//                   <SelectValue placeholder="Select relationship" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {relationships.map((rel) => (
//                     <SelectItem key={rel} value={rel}>{rel}</SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="family-condition">Condition</Label>
//               <Input
//                 id="family-condition"
//                 value={familyForm.condition}
//                 onChange={(e) => setFamilyForm({ ...familyForm, condition: e.target.value })}
//                 placeholder="e.g., Heart disease"
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="family-notes">Notes</Label>
//               <Input
//                 id="family-notes"
//                 value={familyForm.notes}
//                 onChange={(e) => setFamilyForm({ ...familyForm, notes: e.target.value })}
//                 placeholder="Additional notes..."
//               />
//             </div>
//           </div>
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setFamilyDialog(false)}>
//               Cancel
//             </Button>
//             <Button onClick={handleAddFamilyHistory} disabled={!familyForm.relationship || !familyForm.condition || isSubmitting}>
//               {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Delete Confirmation Dialog (unchanged) */}
//       <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>Delete Item</AlertDialogTitle>
//             <AlertDialogDescription>
//               Are you sure you want to delete this item? This action cannot be undone.
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
//             <AlertDialogAction
//               onClick={handleDelete}
//               disabled={isSubmitting}
//               className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
//             >
//               {isSubmitting ? "Deleting..." : "Delete"}
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>
//     </div>
//   );
// }
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PatientIdCard } from "./patient-id-card";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  User, 
  Pill, 
  AlertTriangle, 
  Heart, 
  Users, 
  Plus, 
  Trash2, 
  Loader2, 
  Edit, 
  Mail,
  CheckCircle,
  XCircle,
  ExternalLink
} from "lucide-react";

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const severityLevels = ["low", "medium", "high"];
const relationships = ["Mother", "Father", "Sister", "Brother", "Grandmother", "Grandfather", "Aunt", "Uncle"];

export function ProfileContent({ 
  user, 
  profile, 
  medications, 
  allergies, 
  conditions, 
  familyHistory 
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("personal");
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState(null);
  
  // Profile form state (only used in edit mode)
  const [profileForm, setProfileForm] = useState({
    full_name: profile?.full_name || "",
    date_of_birth: profile?.date_of_birth || "",
    blood_type: (profile?.blood_type || profile?.blood_group) || "",
    height_cm: profile?.height_cm?.toString() || "",
    weight_kg: profile?.weight_kg?.toString() || "",
    phone: profile?.phone || "",
  });
  
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  // Dialog states
  const [medicationDialog, setMedicationDialog] = useState(false);
  const [allergyDialog, setAllergyDialog] = useState(false);
  const [conditionDialog, setConditionDialog] = useState(false);
  const [familyDialog, setFamilyDialog] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form states for dialogs
  const [medicationForm, setMedicationForm] = useState({ name: "", dosage: "", frequency: "" });
  const [allergyForm, setAllergyForm] = useState({ allergen: "", severity: "", reaction: "" });
  const [conditionForm, setConditionForm] = useState({ condition_name: "", diagnosed_date: "", notes: "" });
  const [familyForm, setFamilyForm] = useState({ relationship: "", condition: "", notes: "" });

  // Handle edit button click - show confirmation dialog
  const handleEditRequest = () => {
    setEmailError(null);
    setShowConfirmationDialog(true);
  };

  // Send confirmation email using Supabase's built-in email service
  const sendConfirmationEmail = async () => {
    setIsSendingEmail(true);
    setEmailError(null);
    
    try {
      const supabase = getSupabaseBrowserClient();
      
      // Generate a secure token
      const token = crypto.randomUUID ? crypto.randomUUID() : 
        Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30 minutes expiry
      
      // Store token in database
      const { error: insertError } = await supabase
        .from('edit_confirmations')
        .insert({
          user_id: user.id,
          token: token,
          expires_at: expiresAt.toISOString(),
          is_used: false,
          requested_changes: profileForm,
        });

      if (insertError) {
        console.error("Error inserting token:", insertError);
        
        // If table doesn't exist, show error
        if (insertError.code === '42P01') {
          setEmailError("Edit confirmation system not set up. Please contact support.");
        } else {
          setEmailError("Failed to create verification. Please try again.");
        }
        setIsSendingEmail(false);
        return;
      }

      // Create the confirmation URL for the new edit page
      const confirmUrl = `${window.location.origin}/dashboard/profile/edit?token=${token}`;

      // FOR DEVELOPMENT: Skip email and redirect directly
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 DEV MODE: Redirecting to edit page:', confirmUrl);
        
        // Show success message
        setEmailSent(true);
        
        // Close dialog and redirect after 1 second
        setTimeout(() => {
          setShowConfirmationDialog(false);
          setEmailSent(false);
          router.push(`/dashboard/profile/edit?token=${token}`);
        }, 1000);
        
        setIsSendingEmail(false);
        return;
      }

      // Use Supabase's password reset email as a workaround for custom emails
      // This will send an email with a link to reset password, but we'll redirect to our edit page
      const { error: emailError } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: confirmUrl,
      });

      if (emailError) {
        console.error("Error sending email via Supabase:", emailError);
        
        // Check if it's a rate limit error
        if (emailError.message?.includes('rate limit') || emailError.status === 429) {
          setEmailError("Email rate limit exceeded. Please try again in a few minutes.");
        } else {
          setEmailError("Could not send email. Please try again later.");
        }
        setIsSendingEmail(false);
        return;
      }

      // Show success state
      setEmailSent(true);
      
      // Close dialog after 2 seconds
      setTimeout(() => {
        setShowConfirmationDialog(false);
        setEmailSent(false);
        // Show success message
        router.push('/dashboard/profile?edit=verification-sent');
      }, 2000);
      
    } catch (error) {
      console.error("Error sending confirmation email:", error);
      setEmailError(error.message || "Failed to send confirmation email. Please try again.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Save profile changes (direct edit mode - used after email confirmation)
  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    
    try {
      const supabase = getSupabaseBrowserClient();
      
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email,
        full_name: profileForm.full_name || null,
        date_of_birth: profileForm.date_of_birth || null,
        blood_type: profileForm.blood_type || null,
        height_cm: profileForm.height_cm ? parseFloat(profileForm.height_cm) : null,
        weight_kg: profileForm.weight_kg ? parseFloat(profileForm.weight_kg) : null,
        phone: profileForm.phone || null,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      
      setIsEditMode(false);
      router.refresh();
    } catch (error) {
      console.error("Error saving profile:", error);
      setEmailError(error.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    // Reset form to original values
    setProfileForm({
      full_name: profile?.full_name || "",
      date_of_birth: profile?.date_of_birth || "",
      blood_type: (profile?.blood_type || profile?.blood_group) || "",
      height_cm: profile?.height_cm?.toString() || "",
      weight_kg: profile?.weight_kg?.toString() || "",
      phone: profile?.phone || "",
    });
    setIsEditMode(false);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Check if user came from email verification
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('edit') === 'verification-sent') {
      // Show a toast or message that email was sent
      console.log('Verification email sent');
    }
  }, []);

  // CRUD operations
  const handleAddMedication = async () => {
    setIsSubmitting(true);
    const supabase = getSupabaseBrowserClient();
    await supabase.from("medications").insert({
      user_id: user.id,
      name: medicationForm.name,
      dosage: medicationForm.dosage || null,
      frequency: medicationForm.frequency || null,
      is_active: true,
    });
    setMedicationForm({ name: "", dosage: "", frequency: "" });
    setMedicationDialog(false);
    setIsSubmitting(false);
    router.refresh();
  };

  const handleAddAllergy = async () => {
    setIsSubmitting(true);
    const supabase = getSupabaseBrowserClient();
    await supabase.from("allergies").insert({
      user_id: user.id,
      name: allergyForm.allergen,
      allergen: allergyForm.allergen,
      severity: allergyForm.severity || null,
      reaction: allergyForm.reaction || null,
    });
    setAllergyForm({ allergen: "", severity: "", reaction: "" });
    setAllergyDialog(false);
    setIsSubmitting(false);
    router.refresh();
  };

  const handleAddCondition = async () => {
    setIsSubmitting(true);
    const supabase = getSupabaseBrowserClient();
    await supabase.from("chronic_conditions").insert({
      user_id: user.id,
      name: conditionForm.condition_name,
      condition_name: conditionForm.condition_name,
      diagnosed_date: conditionForm.diagnosed_date || null,
      notes: conditionForm.notes || null,
    });
    setConditionForm({ condition_name: "", diagnosed_date: "", notes: "" });
    setConditionDialog(false);
    setIsSubmitting(false);
    router.refresh();
  };

  const handleAddFamilyHistory = async () => {
    setIsSubmitting(true);
    const supabase = getSupabaseBrowserClient();
    await supabase.from("family_history").insert({
      user_id: user.id,
      relation: familyForm.relationship,
      relationship: familyForm.relationship,
      condition: familyForm.condition,
      notes: familyForm.notes || null,
    });
    setFamilyForm({ relationship: "", condition: "", notes: "" });
    setFamilyDialog(false);
    setIsSubmitting(false);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setIsSubmitting(true);
    const supabase = getSupabaseBrowserClient();
    await supabase.from(deleteItem.type).delete().eq("id", deleteItem.id);
    setDeleteItem(null);
    setIsSubmitting(false);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Medical Profile</h1>
          <p className="text-muted-foreground">Manage your health information</p>
        </div>
        {!isEditMode && (
          <Button onClick={handleEditRequest} variant="outline" className="gap-2">
            <Edit className="h-4 w-4" />
            Edit Profile
          </Button>
        )}
        {isEditMode && (
          <Button variant="ghost" onClick={handleCancelEdit} className="gap-2">
            <XCircle className="h-4 w-4" />
            Cancel Edit
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="personal" className="gap-2">
            <User className="h-4 w-4 hidden sm:block" />
            Personal
          </TabsTrigger>
          <TabsTrigger value="medications" className="gap-2">
            <Pill className="h-4 w-4 hidden sm:block" />
            Medications
          </TabsTrigger>
          <TabsTrigger value="allergies" className="gap-2">
            <AlertTriangle className="h-4 w-4 hidden sm:block" />
            Allergies
          </TabsTrigger>
          <TabsTrigger value="conditions" className="gap-2">
            <Heart className="h-4 w-4 hidden sm:block" />
            Conditions
          </TabsTrigger>
          <TabsTrigger value="family" className="gap-2">
            <Users className="h-4 w-4 hidden sm:block" />
            Family
          </TabsTrigger>
        </TabsList>

        {/* Personal Tab */}
        <TabsContent value="personal" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Your basic health profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Patient ID Card */}
              <PatientIdCard patientId={profile?.patient_id} userName={profile?.full_name} />
              
              {/* Avatar Display */}
              <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b">
                <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-2 border-primary">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="bg-muted text-2xl">
                    {profile?.full_name?.charAt(0) || user.email?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="font-medium text-lg">{profile?.full_name || "User"}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
                </div>
              </div>

              {/* Profile Information Display/Edit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                  <Label className="text-sm text-muted-foreground">Full Name</Label>
                  {isEditMode ? (
                    <Input
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-base font-medium mt-1">{profile?.full_name || "Not specified"}</p>
                  )}
                </div>

                {/* Email (always read-only) */}
                <div>
                  <Label className="text-sm text-muted-foreground">Email</Label>
                  <p className="text-base font-medium mt-1">{user.email}</p>
                </div>

                {/* Phone */}
                <div>
                  <Label className="text-sm text-muted-foreground">Phone</Label>
                  {isEditMode ? (
                    <Input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setProfileForm({ ...profileForm, phone: value });
                      }}
                      placeholder="8866920701"
                      maxLength={10}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-base font-medium mt-1">{profile?.phone || "Not specified"}</p>
                  )}
                </div>

                {/* Date of Birth */}
                <div>
                  <Label className="text-sm text-muted-foreground">Date of Birth</Label>
                  {isEditMode ? (
                    <Input
                      type="date"
                      value={profileForm.date_of_birth}
                      onChange={(e) => setProfileForm({ ...profileForm, date_of_birth: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-base font-medium mt-1">{formatDate(profile?.date_of_birth)}</p>
                  )}
                </div>

                {/* Blood Type */}
                <div>
                  <Label className="text-sm text-muted-foreground">Blood Type</Label>
                  {isEditMode ? (
                    <Select
                      value={profileForm.blood_type}
                      onValueChange={(value) => setProfileForm({ ...profileForm, blood_type: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select blood type" />
                      </SelectTrigger>
                      <SelectContent>
                        {bloodTypes.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-base font-medium mt-1">{profile?.blood_type || profile?.blood_group || "Not specified"}</p>
                  )}
                </div>

                {/* Height */}
                <div>
                  <Label className="text-sm text-muted-foreground">Height (cm)</Label>
                  {isEditMode ? (
                    <Input
                      type="number"
                      value={profileForm.height_cm}
                      onChange={(e) => setProfileForm({ ...profileForm, height_cm: e.target.value })}
                      placeholder="175"
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-base font-medium mt-1">{profile?.height_cm ? `${profile.height_cm} cm` : "Not specified"}</p>
                  )}
                </div>

                {/* Weight */}
                <div> 
                  <Label className="text-sm text-muted-foreground">Weight (kg)</Label>
                  {isEditMode ? (
                    <Input
                      type="number"
                      value={profileForm.weight_kg}
                      onChange={(e) => setProfileForm({ ...profileForm, weight_kg: e.target.value })}
                      placeholder="70"
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-base font-medium mt-1">{profile?.weight_kg ? `${profile.weight_kg} kg` : "Not specified"}</p>
                  )}
                </div>
              </div>

              {/* Edit Mode Actions */}
              {isEditMode && (
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                    {isSavingProfile ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medications Tab */}
        <TabsContent value="medications" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Medications</CardTitle>
                <CardDescription>Track your current medications</CardDescription>
              </div>
              <Button onClick={() => setMedicationDialog(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </CardHeader>
            <CardContent>
              {medications.length > 0 ? (
                <div className="space-y-3">
                  {medications.map((med) => (
                    <div key={med.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 group">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{med.name}</p>
                          <Badge variant={med.is_active ? "default" : "secondary"}>
                            {med.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {[med.dosage, med.frequency].filter(Boolean).join(" - ") || "No details"}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteItem({ type: "medications", id: med.id })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No medications added yet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Allergies Tab */}
        <TabsContent value="allergies" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Allergies</CardTitle>
                <CardDescription>Record your known allergies</CardDescription>
              </div>
              <Button onClick={() => setAllergyDialog(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </CardHeader>
            <CardContent>
              {allergies.length > 0 ? (
                <div className="space-y-3">
                  {allergies.map((allergy) => (
                    <div key={allergy.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 group">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{allergy.allergen}</p>
                          {allergy.severity && (
                            <Badge variant={allergy.severity === "high" ? "destructive" : "secondary"}>
                              {allergy.severity}
                            </Badge>
                          )}
                        </div>
                        {allergy.reaction && (
                          <p className="text-sm text-muted-foreground">{allergy.reaction}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteItem({ type: "allergies", id: allergy.id })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No allergies recorded
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conditions Tab */}
        <TabsContent value="conditions" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Chronic Conditions</CardTitle>
                <CardDescription>Track ongoing health conditions</CardDescription>
              </div>
              <Button onClick={() => setConditionDialog(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </CardHeader>
            <CardContent>
              {conditions.length > 0 ? (
                <div className="space-y-3">
                  {conditions.map((condition) => (
                    <div key={condition.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 group">
                      <div>
                        <p className="font-medium">{condition.condition_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {condition.diagnosed_date
                            ? `Diagnosed: ${new Date(condition.diagnosed_date).toLocaleDateString()}`
                            : "Diagnosis date not specified"}
                        </p>
                        {condition.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{condition.notes}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteItem({ type: "chronic_conditions", id: condition.id })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No conditions recorded
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Family History Tab */}
        <TabsContent value="family" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Family Medical History</CardTitle>
                <CardDescription>Important health information from family</CardDescription>
              </div>
              <Button onClick={() => setFamilyDialog(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </CardHeader>
            <CardContent>
              {familyHistory.length > 0 ? (
                <div className="space-y-3">
                  {familyHistory.map((history) => (
                    <div key={history.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 group">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{history.condition}</p>
                          <Badge variant="outline">{history.relationship}</Badge>
                        </div>
                        {history.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{history.notes}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteItem({ type: "family_history", id: history.id })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>  
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No family history recorded
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation Email Dialog */}
      <Dialog open={showConfirmationDialog} onOpenChange={setShowConfirmationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Profile Edit</DialogTitle>
            <DialogDescription>
              For security reasons, we'll send a confirmation link to your email address.
              Click the link in the email to start editing your profile.
            </DialogDescription>
          </DialogHeader>
          
          {emailError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{emailError}</AlertDescription>
            </Alert>
          )}
          
          {!emailSent ? (
            <div className="py-4">
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg mb-4">
                <Mail className="h-5 w-5 text-primary" />
                <p className="text-sm">We'll send a confirmation to: <strong>{user.email}</strong></p>
              </div>
              <p className="text-xs text-muted-foreground">
                The link will expire in 30 minutes.
              </p>
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-700 flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    <strong>Development Mode:</strong> You'll be redirected directly to the edit page.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="py-4 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="font-medium">Confirmation email sent!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Please check your inbox and click the link to start editing.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmationDialog(false)}>
              Cancel
            </Button>
            {!emailSent ? (
              <Button onClick={sendConfirmationEmail} disabled={isSendingEmail}>
                {isSendingEmail ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Confirmation
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={() => setShowConfirmationDialog(false)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Medication Dialog */}
      <Dialog open={medicationDialog} onOpenChange={setMedicationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Medication</DialogTitle>
            <DialogDescription>Add a new medication to your profile</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="med-name">Medication Name</Label>
              <Input
                id="med-name"
                value={medicationForm.name}
                onChange={(e) => setMedicationForm({ ...medicationForm, name: e.target.value })}
                placeholder="e.g., Aspirin"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="med-dosage">Dosage</Label>
              <Input
                id="med-dosage"
                value={medicationForm.dosage}
                onChange={(e) => setMedicationForm({ ...medicationForm, dosage: e.target.value })}
                placeholder="e.g., 100mg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="med-frequency">Frequency</Label>
              <Input
                id="med-frequency"
                value={medicationForm.frequency}
                onChange={(e) => setMedicationForm({ ...medicationForm, frequency: e.target.value })}
                placeholder="e.g., Once daily"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMedicationDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMedication} disabled={!medicationForm.name || isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Allergy Dialog */}
      <Dialog open={allergyDialog} onOpenChange={setAllergyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Allergy</DialogTitle>
            <DialogDescription>Record a known allergy</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="allergen">Allergen</Label>
              <Input
                id="allergen"
                value={allergyForm.allergen}
                onChange={(e) => setAllergyForm({ ...allergyForm, allergen: e.target.value })}
                placeholder="e.g., Penicillin"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="severity">Severity</Label>
              <Select
                value={allergyForm.severity}
                onValueChange={(value) => setAllergyForm({ ...allergyForm, severity: value })}
              >
                <SelectTrigger id="severity">
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  {severityLevels.map((level) => (
                    <SelectItem key={level} value={level} className="capitalize">
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reaction">Reaction</Label>
              <Input
                id="reaction"
                value={allergyForm.reaction}
                onChange={(e) => setAllergyForm({ ...allergyForm, reaction: e.target.value })}
                placeholder="e.g., Hives, difficulty breathing"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAllergyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddAllergy} disabled={!allergyForm.allergen || isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Condition Dialog */}
      <Dialog open={conditionDialog} onOpenChange={setConditionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Condition</DialogTitle>
            <DialogDescription>Record a chronic condition</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="condition-name">Condition Name</Label>
              <Input
                id="condition-name"
                value={conditionForm.condition_name}
                onChange={(e) => setConditionForm({ ...conditionForm, condition_name: e.target.value })}
                placeholder="e.g., Type 2 Diabetes"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="diagnosed-date">Diagnosed Date</Label>
              <Input
                id="diagnosed-date"
                type="date"
                value={conditionForm.diagnosed_date}
                onChange={(e) => setConditionForm({ ...conditionForm, diagnosed_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="condition-notes">Notes</Label>
              <Input
                id="condition-notes"
                value={conditionForm.notes}
                onChange={(e) => setConditionForm({ ...conditionForm, notes: e.target.value })}
                placeholder="Additional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConditionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCondition} disabled={!conditionForm.condition_name || isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Family History Dialog */}
      <Dialog open={familyDialog} onOpenChange={setFamilyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Family History</DialogTitle>
            <DialogDescription>Record family medical history</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="relationship">Relationship</Label>
              <Select
                value={familyForm.relationship}
                onValueChange={(value) => setFamilyForm({ ...familyForm, relationship: value })}
              >
                <SelectTrigger id="relationship">
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  {relationships.map((rel) => (
                    <SelectItem key={rel} value={rel}>{rel}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="family-condition">Condition</Label>
              <Input
                id="family-condition"
                value={familyForm.condition}
                onChange={(e) => setFamilyForm({ ...familyForm, condition: e.target.value })}
                placeholder="e.g., Heart disease"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="family-notes">Notes</Label>
              <Input
                id="family-notes"
                value={familyForm.notes}
                onChange={(e) => setFamilyForm({ ...familyForm, notes: e.target.value })}
                placeholder="Additional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFamilyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddFamilyHistory} disabled={!familyForm.relationship || !familyForm.condition || isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}