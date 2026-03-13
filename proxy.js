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
export function proxy(request) {
    return __awaiter(this, void 0, void 0, function* () {
        let response = NextResponse.next({
            request,
        });
        const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value);
                        response.cookies.set(name, value, options);
                    });
                },
            },
        });
        // Refresh session
        const { data: { session } } = yield supabase.auth.getSession();
        // Log to see what's happening (remove in production)
        console.log('Middleware - Path:', request.nextUrl.pathname, 'Session:', !!session);
        // Protected routes - redirect to sign-in if not authenticated
        if (!session && request.nextUrl.pathname.startsWith("/dashboard")) {
            const url = request.nextUrl.clone();
            url.pathname = "/auth/sign-up"; // Changed from /auth/login to /auth/sign-up
            return NextResponse.redirect(url);
        }
        // Redirect authenticated users away from auth pages
        if (session &&
            (request.nextUrl.pathname.startsWith("/auth/sign-up") || // Updated paths
                request.nextUrl.pathname.startsWith("/auth/login"))) {
            const url = request.nextUrl.clone();
            url.pathname = "/dashboard";
            return NextResponse.redirect(url);
        }
        return response;
    });
}
export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
