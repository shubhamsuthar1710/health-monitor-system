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
import { ProfileContent } from "@/components/dashboard/profile-content";
export default function ProfilePage() {
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
        // Fetch medications
        const { data: medications } = yield supabase
            .from("medications")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });
        // Fetch allergies
        const { data: allergies } = yield supabase
            .from("allergies")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });
        // Fetch chronic conditions
        const { data: conditions } = yield supabase
            .from("chronic_conditions")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });
        // Fetch family history
        const { data: familyHistory } = yield supabase
            .from("family_history")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });
        return (_jsx(ProfileContent, { user: user, profile: profile, medications: medications || [], allergies: allergies || [], conditions: conditions || [], familyHistory: familyHistory || [] }));
    });
}
