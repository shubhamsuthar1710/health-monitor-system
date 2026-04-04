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

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL, 
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 
            {
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
            }
        );

        // Refresh session
        const { data: { session } } = yield supabase.auth.getSession();

        // Log to see what's happening (remove in production)
        console.log('Middleware - Path:', request.nextUrl.pathname, 'Session:', !!session);

        // ✅ Define public routes that don't require authentication
        const publicRoutes = [
            '/',
            '/auth/sign-up',
            '/auth/login',
            '/auth/verify',
            '/auth/callback',  // ✅ CRITICAL: Must be public for PKCE
            '/doctor/signup',
            '/doctor/login',
        ];
        
        const isPublicRoute = publicRoutes.some(route => 
            request.nextUrl.pathname === route || 
            request.nextUrl.pathname.startsWith(route + '/')
        );

        // ✅ If no session and trying to access protected route -> redirect to login
        if (!session && !isPublicRoute) {
            console.log('No session, redirecting to login');
            const url = request.nextUrl.clone();
            url.pathname = "/auth/login";
            return NextResponse.redirect(url);
        }

        // ✅ If has session and trying to access auth pages -> redirect based on role
        if (session && isPublicRoute && request.nextUrl.pathname !== '/auth/callback') {
            try {
                // Check user role from profiles table
                const { data: { user } } = yield supabase.auth.getUser();
                
                if (user) {
                    const { data: profile } = yield supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', user.id)
                        .single();
                    
                    if (profile?.role === 'doctor') {
                        console.log('Doctor logged in, redirecting to doctor dashboard');
                        const url = request.nextUrl.clone();
                        url.pathname = "/doctor/dashboard";
                        return NextResponse.redirect(url);
                    } else {
                        console.log('Patient logged in, redirecting to patient dashboard');
                        const url = request.nextUrl.clone();
                        url.pathname = "/dashboard";
                        return NextResponse.redirect(url);
                    }
                }
            } catch (error) {
                console.error('Error checking role:', error);
                // Fallback to patient dashboard
                const url = request.nextUrl.clone();
                url.pathname = "/dashboard";
                return NextResponse.redirect(url);
            }
        }

        // ✅ Protect doctor routes - only doctors can access
        if (session && request.nextUrl.pathname.startsWith('/doctor/')) {
            try {
                const { data: { user } } = yield supabase.auth.getUser();
                
                if (user) {
                    const { data: profile } = yield supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', user.id)
                        .single();
                    
                    if (profile?.role !== 'doctor') {
                        console.log('Non-doctor trying to access doctor route, redirecting');
                        const url = request.nextUrl.clone();
                        url.pathname = "/dashboard";
                        return NextResponse.redirect(url);
                    }
                }
            } catch (error) {
                console.error('Error protecting doctor route:', error);
                const url = request.nextUrl.clone();
                url.pathname = "/dashboard";
                return NextResponse.redirect(url);
            }
        }

        // ✅ Protect patient routes - only patients can access
        if (session && request.nextUrl.pathname.startsWith('/dashboard/')) {
            try {
                const { data: { user } } = yield supabase.auth.getUser();
                
                if (user) {
                    const { data: profile } = yield supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', user.id)
                        .single();
                    
                    if (profile?.role === 'doctor') {
                        console.log('Doctor trying to access patient dashboard, redirecting');
                        const url = request.nextUrl.clone();
                        url.pathname = "/doctor/dashboard";
                        return NextResponse.redirect(url);
                    }
                }
            } catch (error) {
                console.error('Error protecting patient route:', error);
            }
        }

        return response;
    });
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};