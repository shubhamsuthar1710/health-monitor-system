var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx } from "react/jsx-runtime";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsContent } from "@/components/dashboard/settings-content";
export default function SettingsPage() {
    return __awaiter(this, void 0, void 0, function* () {
        const supabase = yield getSupabaseServerClient();
        const { data: { user } } = yield supabase.auth.getUser();
        if (!user) {
            redirect("/auth/login");
        }
        // Fetch profile
        const { data: profile } = yield supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();
        // Fetch emergency contacts
        const { data: emergencyContacts } = yield supabase
            .from("emergency_contacts")
            .select("*")
            .eq("user_id", user.id)
            .order("is_primary", { ascending: false });
        // Fetch user settings
        const { data: settings } = yield supabase
            .from("user_settings")
            .select("*")
            .eq("user_id", user.id)
            .single();
        // Fetch allergies for emergency card
        const { data: allergies } = yield supabase
            .from("allergies")
            .select("*")
            .eq("user_id", user.id);
        // Fetch medications for emergency card
        const { data: medications } = yield supabase
            .from("medications")
            .select("*")
            .eq("user_id", user.id)
            .eq("is_active", true);
        // Fetch conditions for emergency card
        const { data: conditions } = yield supabase
            .from("chronic_conditions")
            .select("*")
            .eq("user_id", user.id);
        return (_jsx(SettingsContent, { user: user, profile: profile, emergencyContacts: emergencyContacts || [], settings: settings, allergies: allergies || [], medications: medications || [], conditions: conditions || [] }));
    });
}
