"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
// import { Switch } from "@/components/ui/switch"; // Commented out for future use
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Phone, 
  Shield, 
  // Bell, // Commented out for future use
  Plus,
  Trash2,
  Loader2,
  // Save, // Commented out for future use
  CreditCard,
  AlertTriangle,
  Heart,
  Pill,
  User
} from "lucide-react";

export function SettingsContent({
  user,
  profile,
  emergencyContacts,
  // settings, // Commented out for future use
  allergies,
  medications,
  conditions,
}) {
  const router = useRouter();
  const emergencyCardRef = useRef(null);
  
  const [activeTab, setActiveTab] = useState("emergency");
  const [contactDialog, setContactDialog] = useState(false);
  const [deleteContact, setDeleteContact] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  // const [isSavingSettings, setIsSavingSettings] = useState(false); // Commented out for future use

  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: "",
    relationship: "",
    phone: "",
    is_primary: false,
  });

  // Settings form state - commented out for future use
  // const [settingsForm, setSettingsForm] = useState({
  //   email_notifications: settings?.email_notifications ?? true,
  //   reminder_time: settings?.reminder_time || "09:00",
  // });

  const handleAddContact = async () => {
    // Reset error
    setError(null);
    
    // Validation
    if (!contactForm.name.trim()) {
      setError("Name is required");
      return;
    }
    if (!contactForm.phone.trim()) {
      setError("Phone number is required");
      return;
    }

    setIsSubmitting(true);
    const supabase = getSupabaseBrowserClient();
    
    // If this is primary, unset other primary contacts
    if (contactForm.is_primary) {
      await supabase
        .from("emergency_contacts")
        .update({ is_primary: false })
        .eq("user_id", user.id);
    }

    // FIXED: Using 'relation' instead of 'relationship' to match database schema
    const { error: insertError } = await supabase
      .from("emergency_contacts")
      .insert({
        user_id: user.id,
        name: contactForm.name.trim(),
        relation: contactForm.relationship || null,  // ← Column name is 'relation' in DB
        phone: contactForm.phone.trim(),
        is_primary: contactForm.is_primary,
      });

    if (insertError) {
      console.error("Error adding contact:", insertError);
      setError(insertError.message);
      setIsSubmitting(false);
      return;
    }

    // Success - reset form and close dialog
    setContactForm({ name: "", relationship: "", phone: "", is_primary: false });
    setContactDialog(false);
    setIsSubmitting(false);
    router.refresh();
  };

  const handleDeleteContact = async () => {
    if (!deleteContact) return;
    
    setIsSubmitting(true);
    const supabase = getSupabaseBrowserClient();
    
    const { error } = await supabase
      .from("emergency_contacts")
      .delete()
      .eq("id", deleteContact.id);

    if (error) {
      console.error("Error deleting contact:", error);
      setError(error.message);
    } else {
      setDeleteContact(null);
      router.refresh();
    }
    
    setIsSubmitting(false);
  };

  const handleSetPrimary = async (contact) => {
    const supabase = getSupabaseBrowserClient();
    
    // Unset all primary
    await supabase
      .from("emergency_contacts")
      .update({ is_primary: false })
      .eq("user_id", user.id);

    // Set this one as primary
    await supabase
      .from("emergency_contacts")
      .update({ is_primary: true })
      .eq("id", contact.id);

    router.refresh();
  };

  // Settings handler - commented out for future use
  // const handleSaveSettings = async () => {
  //   setIsSavingSettings(true);
  //   const supabase = getSupabaseBrowserClient();
  //   
  //   await supabase.from("user_settings").upsert({
  //     user_id: user.id,
  //     email_notifications: settingsForm.email_notifications,
  //     reminder_time: settingsForm.reminder_time,
  //   });
  //
  //   setIsSavingSettings(false);
  //   router.refresh();
  // };

  const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const primaryContact = emergencyContacts.find((c) => c.is_primary);
  const age = calculateAge(profile?.date_of_birth || null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Manage your emergency contacts and medical card
        </p>
      </div>

      {/* Tabs - Now only 2 tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="emergency" className="gap-2">
            <Phone className="h-4 w-4 hidden sm:block" />
            Emergency Contacts
          </TabsTrigger>
          <TabsTrigger value="card" className="gap-2">
            <CreditCard className="h-4 w-4 hidden sm:block" />
            Medical Card
          </TabsTrigger>
        </TabsList>

        {/* Emergency Contacts Tab */}
        <TabsContent value="emergency" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Emergency Contacts</CardTitle>
                <CardDescription>
                  People to contact in case of emergency
                </CardDescription>
              </div>
              <Button onClick={() => setContactDialog(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </CardHeader>
            <CardContent>
              {emergencyContacts.length > 0 ? (
                <div className="space-y-3">
                  {emergencyContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50 group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-full bg-primary/10">
                          <Phone className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{contact.name}</p>
                            {contact.is_primary && <Badge>Primary</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {/* FIXED: Using 'relation' instead of 'relationship' */}
                            {contact.relation && `${contact.relation} • `}
                            {contact.phone}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!contact.is_primary && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetPrimary(contact)}
                            className="opacity-0 group-hover:opacity-100"
                          >
                            Set Primary
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteContact(contact)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Phone className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground mb-4">
                    No emergency contacts added
                  </p>
                  <Button onClick={() => setContactDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Contact
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Emergency Card Tab */}
        <TabsContent value="card" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Emergency Medical Card</CardTitle>
              <CardDescription>
                A summary of your critical health information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                ref={emergencyCardRef}
                className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-6 border-2 border-primary/20"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                      <Shield className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Emergency Medical Card</h3>
                      <p className="text-sm text-muted-foreground">
                        Critical Health Information
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <User className="h-4 w-4" />
                      Personal Information
                    </div>
                    <div className="bg-background rounded-lg p-4 space-y-2">
                      <p className="font-semibold text-lg">
                        {profile?.full_name || "Name not set"}
                      </p>
                      {age && (
                        <p className="text-sm text-muted-foreground">
                          Age: {age} years
                        </p>
                      )}
                      {profile?.blood_type && (
                        <Badge variant="destructive" className="text-sm">
                          Blood Type: {profile.blood_type}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      Emergency Contact
                    </div>
                    <div className="bg-background rounded-lg p-4">
                      {primaryContact ? (
                        <div>
                          <p className="font-semibold">{primaryContact.name}</p>
                          {/* FIXED: Using 'relation' instead of 'relationship' */}
                          <p className="text-sm text-muted-foreground">
                            {primaryContact.relation}
                          </p>
                          <p className="text-primary font-medium mt-1">
                            {primaryContact.phone}
                          </p>
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">
                          No emergency contact set
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Allergies */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <AlertTriangle className="h-4 w-4" />
                      Allergies
                    </div>
                    <div className="bg-background rounded-lg p-4">
                      {allergies.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {allergies.map((allergy) => (
                            <Badge
                              key={allergy.id}
                              variant={allergy.severity === "severe" ? "destructive" : "secondary"}
                            >
                              {allergy.allergen}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">
                          No known allergies
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Conditions */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Heart className="h-4 w-4" />
                      Conditions
                    </div>
                    <div className="bg-background rounded-lg p-4">
                      {conditions.length > 0 ? (
                        <ul className="space-y-1">
                          {conditions.map((condition) => (
                            <li key={condition.id} className="text-sm">
                              {condition.condition_name}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground text-sm">
                          No conditions recorded
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Medications */}
                  <div className="space-y-3 md:col-span-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Pill className="h-4 w-4" />
                      Current Medications
                    </div>
                    <div className="bg-background rounded-lg p-4">
                      {medications.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {medications.map((med) => (
                            <div key={med.id} className="text-sm">
                              <span className="font-medium">{med.name}</span>
                              {med.dosage && (
                                <span className="text-muted-foreground">
                                  {" - "}{med.dosage}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">
                          No active medications
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mt-4 text-center">
                Keep this information accessible for emergency situations
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NOTIFICATIONS TAB - COMMENTED OUT FOR FUTURE USE */}
        {/*
        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how you receive updates and reminders</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive health reminders and updates via email
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settingsForm.email_notifications}
                  onCheckedChange={(checked) => 
                    setSettingsForm({ ...settingsForm, email_notifications: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reminder-time">Daily Reminder Time</Label>
                <Input
                  id="reminder-time"
                  type="time"
                  value={settingsForm.reminder_time}
                  onChange={(e) => setSettingsForm({ ...settingsForm, reminder_time: e.target.value })}
                  className="w-40"
                />
                <p className="text-sm text-muted-foreground">
                  Time to receive daily health tracking reminders
                </p>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveSettings} disabled={isSavingSettings}>
                  {isSavingSettings ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
                  ) : (
                    <><Save className="mr-2 h-4 w-4" />Save Preferences</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        */}
      </Tabs>

      {/* Add Contact Dialog */}
      <Dialog open={contactDialog} onOpenChange={setContactDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Emergency Contact</DialogTitle>
            <DialogDescription>
              Add someone to contact in case of emergency
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contact-name">Name <span className="text-red-500">*</span></Label>
              <Input
                id="contact-name"
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-relationship">Relationship</Label>
              <Input
                id="contact-relationship"
                value={contactForm.relationship}
                onChange={(e) => setContactForm({ ...contactForm, relationship: e.target.value })}
                placeholder="e.g., Spouse, Parent"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-phone">Phone Number <span className="text-red-500">*</span></Label>
              <Input
                id="contact-phone"
                type="tel"
                value={contactForm.phone}
                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
                required
              />
            </div>

            {/* Primary Contact Toggle - Using Checkbox instead of Switch for now */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is-primary"
                checked={contactForm.is_primary}
                onChange={(e) => setContactForm({ ...contactForm, is_primary: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="is-primary">Set as primary contact</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setContactDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddContact}
              disabled={!contactForm.name || !contactForm.phone || isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteContact} onOpenChange={() => setDeleteContact(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {deleteContact?.name} from your emergency contacts?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteContact}
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