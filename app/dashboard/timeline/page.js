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
import { TimelineContent } from "@/components/dashboard/timeline-content";
export default function TimelinePage() {
    return __awaiter(this, void 0, void 0, function* () {
        const supabase = yield getSupabaseServerClient();
        const { data: { user } } = yield supabase.auth.getUser();
        if (!user) {
            redirect("/auth/login");
        }
        // Fetch all health entries
        const { data: entries } = yield supabase
            .from("health_entries")
            .select("*")
            .eq("user_id", user.id)
            .order("recorded_at", { ascending: false });
        return _jsx(TimelineContent, { entries: entries || [] });
    });
}
