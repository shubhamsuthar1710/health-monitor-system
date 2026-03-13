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
// This fetches and displays documents - CORRECT!
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DocumentsContent } from "@/components/dashboard/documents-content";
export default function DocumentsPage() {
    return __awaiter(this, void 0, void 0, function* () {
        const supabase = yield getSupabaseServerClient();
        const { data: { user } } = yield supabase.auth.getUser();
        if (!user)
            redirect("/auth/login");
        const { data: documents } = yield supabase
            .from("documents")
            .select("*")
            .eq("user_id", user.id)
            .order("uploaded_at", { ascending: false });
        return _jsx(DocumentsContent, { documents: documents || [] });
    });
}
