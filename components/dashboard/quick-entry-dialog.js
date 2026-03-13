"use client";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Loader2, Heart, Activity, Thermometer, Droplets, Scale } from "lucide-react";
const entryTypes = [
    { value: "blood_pressure", label: "Blood Pressure", unit: "mmHg", icon: Heart },
    { value: "heart_rate", label: "Heart Rate", unit: "bpm", icon: Activity },
    { value: "temperature", label: "Temperature", unit: "°F", icon: Thermometer },
    { value: "blood_sugar", label: "Blood Sugar", unit: "mg/dL", icon: Droplets },
    { value: "weight", label: "Weight", unit: "lbs", icon: Scale },
];
export function QuickEntryDialog({ open, onOpenChange }) {
    const [entryType, setEntryType] = useState("");
    const [value, setValue] = useState("");
    const [secondaryValue, setSecondaryValue] = useState("");
    const [notes, setNotes] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const router = useRouter();
    const selectedType = entryTypes.find((t) => t.value === entryType);
    const isBloodPressure = entryType === "blood_pressure";
    const handleSubmit = (e) => __awaiter(this, void 0, void 0, function* () {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        const supabase = getSupabaseBrowserClient();
        const { data: { user } } = yield supabase.auth.getUser();
        if (!user) {
            setError("You must be logged in to add entries");
            setIsLoading(false);
            return;
        }
        const entryValue = isBloodPressure
            ? null // For blood pressure, we store in notes
            : parseFloat(value);
        const entryNotes = isBloodPressure
            ? `${value}/${secondaryValue} mmHg${notes ? ` - ${notes}` : ""}`
            : notes;
        const { error: insertError } = yield supabase.from("health_entries").insert({
            user_id: user.id,
            entry_type: entryType,
            value: entryValue,
            unit: selectedType === null || selectedType === void 0 ? void 0 : selectedType.unit,
            notes: entryNotes,
            recorded_at: new Date().toISOString(),
        });
        if (insertError) {
            setError(insertError.message);
            setIsLoading(false);
            return;
        }
        // Reset form and close
        setEntryType("");
        setValue("");
        setSecondaryValue("");
        setNotes("");
        setIsLoading(false);
        onOpenChange(false);
        router.refresh();
    });
    const handleClose = () => {
        setEntryType("");
        setValue("");
        setSecondaryValue("");
        setNotes("");
        setError(null);
        onOpenChange(false);
    };
    return (_jsx(Dialog, { open: open, onOpenChange: handleClose, children: _jsxs(DialogContent, { className: "sm:max-w-md", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Quick Health Entry" }), _jsx(DialogDescription, { children: "Record a new health measurement" })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [error && (_jsx("div", { className: "p-3 rounded-lg bg-destructive/10 text-destructive text-sm", children: error })), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "entry-type", children: "Entry Type" }), _jsxs(Select, { value: entryType, onValueChange: setEntryType, children: [_jsx(SelectTrigger, { id: "entry-type", children: _jsx(SelectValue, { placeholder: "Select type" }) }), _jsx(SelectContent, { children: entryTypes.map((type) => (_jsx(SelectItem, { value: type.value, children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(type.icon, { className: "h-4 w-4" }), type.label] }) }, type.value))) })] })] }), entryType && (_jsxs(_Fragment, { children: [isBloodPressure ? (_jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "systolic", children: "Systolic (top)" }), _jsx(Input, { id: "systolic", type: "number", placeholder: "120", value: value, onChange: (e) => setValue(e.target.value), required: true, disabled: isLoading })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "diastolic", children: "Diastolic (bottom)" }), _jsx(Input, { id: "diastolic", type: "number", placeholder: "80", value: secondaryValue, onChange: (e) => setSecondaryValue(e.target.value), required: true, disabled: isLoading })] })] })) : (_jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "value", children: ["Value (", selectedType === null || selectedType === void 0 ? void 0 : selectedType.unit, ")"] }), _jsx(Input, { id: "value", type: "number", step: "0.1", placeholder: `Enter ${selectedType === null || selectedType === void 0 ? void 0 : selectedType.label.toLowerCase()}`, value: value, onChange: (e) => setValue(e.target.value), required: true, disabled: isLoading })] })), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "notes", children: "Notes (optional)" }), _jsx(Textarea, { id: "notes", placeholder: "Add any additional notes...", value: notes, onChange: (e) => setNotes(e.target.value), disabled: isLoading, rows: 2 })] })] })), _jsxs("div", { className: "flex justify-end gap-3 pt-2", children: [_jsx(Button, { type: "button", variant: "outline", onClick: handleClose, disabled: isLoading, children: "Cancel" }), _jsx(Button, { type: "submit", disabled: isLoading || !entryType || !value, children: isLoading ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Saving..."] })) : ("Save Entry") })] })] })] }) }));
}
