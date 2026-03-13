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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";
import { Activity, Heart, Thermometer, Droplets, Scale, Plus, Trash2, Clock, Filter } from "lucide-react";
import { QuickEntryDialog } from "./quick-entry-dialog";
const entryTypeIcons = {
    blood_pressure: Heart,
    heart_rate: Activity,
    temperature: Thermometer,
    blood_sugar: Droplets,
    weight: Scale,
};
const entryTypeLabels = {
    blood_pressure: "Blood Pressure",
    heart_rate: "Heart Rate",
    temperature: "Temperature",
    blood_sugar: "Blood Sugar",
    weight: "Weight",
};
const entryTypeColors = {
    blood_pressure: "bg-chart-1/10 text-chart-1",
    heart_rate: "bg-chart-2/10 text-chart-2",
    temperature: "bg-chart-3/10 text-chart-3",
    blood_sugar: "bg-chart-4/10 text-chart-4",
    weight: "bg-chart-5/10 text-chart-5",
};
function formatEntryValue(entry) {
    if (entry.value === null && entry.notes) {
        // For blood pressure, the value is in notes
        const match = entry.notes.match(/^(\d+\/\d+)/);
        if (match)
            return match[1];
        return entry.notes;
    }
    if (entry.value === null)
        return "N/A";
    return `${entry.value} ${entry.unit || ""}`.trim();
}
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return {
        date: date.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric"
        }),
        time: date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true
        }),
    };
}
function groupEntriesByDate(entries) {
    const grouped = new Map();
    entries.forEach((entry) => {
        const date = new Date(entry.recorded_at).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
        });
        if (!grouped.has(date)) {
            grouped.set(date, []);
        }
        grouped.get(date).push(entry);
    });
    return grouped;
}
export function TimelineContent({ entries }) {
    const [filter, setFilter] = useState("all");
    const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false);
    const [deleteEntry, setDeleteEntry] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();
    const filteredEntries = filter === "all"
        ? entries
        : entries.filter((e) => e.entry_type === filter);
    const groupedEntries = groupEntriesByDate(filteredEntries);
    const handleDelete = () => __awaiter(this, void 0, void 0, function* () {
        if (!deleteEntry)
            return;
        setIsDeleting(true);
        const supabase = getSupabaseBrowserClient();
        yield supabase.from("health_entries").delete().eq("id", deleteEntry.id);
        setDeleteEntry(null);
        setIsDeleting(false);
        router.refresh();
    });
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-foreground", children: "Health Timeline" }), _jsx("p", { className: "text-muted-foreground", children: "Track and review your health history" })] }), _jsxs(Button, { onClick: () => setIsQuickEntryOpen(true), className: "gap-2", children: [_jsx(Plus, { className: "h-4 w-4" }), "Add Entry"] })] }), _jsx(Card, { children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Filter, { className: "h-4 w-4 text-muted-foreground" }), _jsx("span", { className: "text-sm font-medium", children: "Filter by type:" }), _jsxs(Select, { value: filter, onValueChange: setFilter, children: [_jsx(SelectTrigger, { className: "w-48", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Entries" }), Object.entries(entryTypeLabels).map(([value, label]) => (_jsx(SelectItem, { value: value, children: label }, value)))] })] }), filter !== "all" && (_jsxs(Badge, { variant: "secondary", className: "ml-2", children: [filteredEntries.length, " entries"] }))] }) }) }), filteredEntries.length > 0 ? (_jsx("div", { className: "space-y-6", children: Array.from(groupedEntries.entries()).map(([date, dateEntries]) => (_jsxs("div", { children: [_jsx("h2", { className: "text-sm font-medium text-muted-foreground mb-3 sticky top-0 bg-background py-2", children: date }), _jsx("div", { className: "space-y-3", children: dateEntries.map((entry) => {
                                const Icon = entryTypeIcons[entry.entry_type] || Activity;
                                const colorClass = entryTypeColors[entry.entry_type] || "bg-muted text-muted-foreground";
                                const { time } = formatDateTime(entry.recorded_at);
                                return (_jsx(Card, { className: "group", children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { className: "flex items-start gap-4", children: [_jsx("div", { className: `p-2.5 rounded-lg ${colorClass}`, children: _jsx(Icon, { className: "h-5 w-5" }) }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h3", { className: "font-medium", children: entryTypeLabels[entry.entry_type] || entry.entry_type }), _jsxs("span", { className: "text-xs text-muted-foreground flex items-center gap-1", children: [_jsx(Clock, { className: "h-3 w-3" }), time] })] }), _jsx("p", { className: "text-2xl font-semibold mt-1", children: formatEntryValue(entry) }), entry.notes && entry.entry_type !== "blood_pressure" && (_jsx("p", { className: "text-sm text-muted-foreground mt-1", children: entry.notes })), entry.entry_type === "blood_pressure" && entry.notes && (_jsx("p", { className: "text-sm text-muted-foreground mt-1", children: entry.notes.replace(/^\d+\/\d+\s*mmHg\s*-?\s*/, "") }))] })] }), _jsx(Button, { variant: "ghost", size: "icon", className: "opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive", onClick: () => setDeleteEntry(entry), children: _jsx(Trash2, { className: "h-4 w-4" }) })] }) }) }, entry.id));
                            }) })] }, date))) })) : (_jsx(Card, { children: _jsxs(CardContent, { className: "py-12 text-center", children: [_jsx(Clock, { className: "h-12 w-12 mx-auto text-muted-foreground/50 mb-3" }), _jsx("h3", { className: "font-medium text-lg mb-1", children: "No entries yet" }), _jsx("p", { className: "text-muted-foreground mb-4", children: "Start tracking your health by adding your first entry" }), _jsxs(Button, { onClick: () => setIsQuickEntryOpen(true), children: [_jsx(Plus, { className: "h-4 w-4 mr-2" }), "Add Entry"] })] }) })), _jsx(QuickEntryDialog, { open: isQuickEntryOpen, onOpenChange: setIsQuickEntryOpen }), _jsx(AlertDialog, { open: !!deleteEntry, onOpenChange: () => setDeleteEntry(null), children: _jsxs(AlertDialogContent, { children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { children: "Delete Entry" }), _jsx(AlertDialogDescription, { children: "Are you sure you want to delete this health entry? This action cannot be undone." })] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { disabled: isDeleting, children: "Cancel" }), _jsx(AlertDialogAction, { onClick: handleDelete, disabled: isDeleting, className: "bg-destructive text-destructive-foreground hover:bg-destructive/90", children: isDeleting ? "Deleting..." : "Delete" })] })] }) })] }));
}
