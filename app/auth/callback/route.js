var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
export function GET(request) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const { searchParams, origin } = new URL(request.url);
        const code = searchParams.get("code");
        const next = (_a = searchParams.get("next")) !== null && _a !== void 0 ? _a : "/dashboard";
        if (code) {
            const cookieStore = yield cookies();
            const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
                    },
                },
            });
            const { error } = yield supabase.auth.exchangeCodeForSession(code);
            if (!error) {
                return NextResponse.redirect(`${origin}${next}`);
            }
        }
        // Return the user to an error page with instructions
        return NextResponse.redirect(`${origin}/auth/error`);
    });
}
