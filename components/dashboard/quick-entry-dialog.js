"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Heart, Activity, Thermometer, Droplets, Scale, AlertTriangle } from "lucide-react";

const TEMP_MIN = 93;
const TEMP_MAX = 103;

const entryTypes = [
  { value: "blood_pressure", label: "Blood Pressure", unit: "mmHg", icon: Heart },
  { value: "heart_rate", label: "Heart Rate", unit: "bpm", icon: Activity },
  { value: "temperature", label: "Temperature", unit: "°F", icon: Thermometer },
  { value: "blood_sugar", label: "Blood Sugar", unit: "mg/dL", icon: Droplets },
  { value: "weight", label: "Weight", unit: "lbs", icon: Scale },
];

function getTemperatureError(value) {
  const num = parseFloat(value);
  if (isNaN(num)) return null;
  if (num > TEMP_MAX) return `Temperature ${num}°F is above the limit (${TEMP_MAX}°F). Please enter a value between ${TEMP_MIN}°F and ${TEMP_MAX}°F.`;
  if (num < TEMP_MIN) return `Temperature ${num}°F is below the limit (${TEMP_MIN}°F). Please enter a value between ${TEMP_MIN}°F and ${TEMP_MAX}°F.`;
  return null;
}

export function QuickEntryDialog({ open, onOpenChange }) {
  const [entryType, setEntryType] = useState("");
  const [value, setValue] = useState("");
  const [secondaryValue, setSecondaryValue] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tempError, setTempError] = useState(null);
  const router = useRouter();

  const selectedType = entryTypes.find((t) => t.value === entryType);
  const isBloodPressure = entryType === "blood_pressure";
  const isTemperature = entryType === "temperature";

  const handleValueChange = (newValue) => {
    setValue(newValue);
    if (isTemperature) {
      setTempError(getTemperatureError(newValue));
    } else {
      setTempError(null);
    }
  };

  const handleTypeChange = (newType) => {
    setEntryType(newType);
    setValue("");
    setSecondaryValue("");
    setTempError(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (isTemperature && tempError) {
      return;
    }

    setIsLoading(true);

    const supabase = getSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in to add entries");
      setIsLoading(false);
      return;
    }

    const entryValue = isBloodPressure ? null : parseFloat(value);

    const entryNotes = isBloodPressure
      ? `${value}/${secondaryValue} mmHg${notes ? ` - ${notes}` : ""}`
      : notes;

    const { error: insertError } = await supabase.from("health_entries").insert({
      user_id: user.id,
      entry_type: entryType,
      value: entryValue,
      unit: selectedType?.unit,
      notes: entryNotes,
      recorded_at: new Date().toISOString(),
    });

    if (insertError) {
      setError(insertError.message);
      setIsLoading(false);
      return;
    }

    setEntryType("");
    setValue("");
    setSecondaryValue("");
    setNotes("");
    setTempError(null);
    setIsLoading(false);
    onOpenChange(false);
    router.refresh();
  };

  const handleClose = () => {
    setEntryType("");
    setValue("");
    setSecondaryValue("");
    setNotes("");
    setError(null);
    setTempError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Health Entry</DialogTitle>
          <DialogDescription>Record a new health measurement</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {tempError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{tempError}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="entry-type">Entry Type</Label>
            <Select value={entryType} onValueChange={handleTypeChange}>
              <SelectTrigger id="entry-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {entryTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="h-4 w-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {entryType && (
            <>
              {isBloodPressure ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="systolic">Systolic (top)</Label>
                    <Input
                      id="systolic"
                      type="number"
                      placeholder="120"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="diastolic">Diastolic (bottom)</Label>
                    <Input
                      id="diastolic"
                      type="number"
                      placeholder="80"
                      value={secondaryValue}
                      onChange={(e) => setSecondaryValue(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="value">
                    Value ({selectedType?.unit})
                  </Label>
                  <Input
                    id="value"
                    type="number"
                    step={isTemperature ? "0.1" : "1"}
                    placeholder={isTemperature ? "98.6" : "100"}
                    value={value}
                    onChange={(e) => handleValueChange(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder={isBloodPressure ? "e.g., After morning walk" : "Any additional details"}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1" disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={!entryType || !value || isLoading || (isTemperature && !!tempError)} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Entry"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
