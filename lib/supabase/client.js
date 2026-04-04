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
import { createBrowserClient } from "@supabase/ssr";

let client = null;

// ✅ Safe cookie getter that checks for browser environment
const safeGetCookie = (name) => {
    if (typeof document === 'undefined') return null;
    const cookie = document.cookie
        .split('; ')
        .find(row => row.startsWith(`${name}=`))
        ?.split('=')[1];
    return cookie || null;
};

// ✅ Safe localStorage getter
const safeLocalStorageGet = (key) => {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(key);
};

// ✅ Safe localStorage setter
const safeLocalStorageSet = (key, value) => {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, value);
};

// ✅ Safe localStorage remover
const safeLocalStorageRemove = (key) => {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(key);
};

export function getSupabaseBrowserClient() {
    if (client) return client;
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // ✅ Only create client in browser environment
    if (typeof window === 'undefined') {
        return null;
    }
    
    client = createBrowserClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storageKey: 'sb-' + supabaseUrl.split('//')[1].split('.')[0] + '-auth-token',
        },
        cookies: {
            get(name) {
                // Try to get from cookie first
                const cookie = safeGetCookie(name);
                if (cookie) return cookie;
                
                // Fallback to localStorage for PKCE verifier
                const storageKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token.${name}`;
                return safeLocalStorageGet(storageKey);
            },
            set(name, value, options) {
                // Set cookie
                if (typeof document !== 'undefined') {
                    document.cookie = `${name}=${value}; path=/; max-age=${options?.maxAge || 31536000}; SameSite=Lax`;
                }
                
                // Also store in localStorage for PKCE
                const storageKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token.${name}`;
                safeLocalStorageSet(storageKey, value);
            },
            remove(name, options) {
                // Remove cookie
                if (typeof document !== 'undefined') {
                    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
                }
                
                // Remove from localStorage
                const storageKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token.${name}`;
                safeLocalStorageRemove(storageKey);
            },
        },
    });
    
    return client;
}

// Helper function to check token
export function getValidAccessToken() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const supabase = getSupabaseBrowserClient();
        if (!supabase) return null;
        
        const { data: { session } } = yield supabase.auth.getSession();
        if (!session) {
            console.warn('No active session');
            return null;
        }
        // Check if token looks valid (should start with eyJ...)
        if ((_a = session.access_token) === null || _a === void 0 ? void 0 : _a.startsWith('sb_temp')) {
            console.warn('Invalid token detected, refreshing...');
            const { data, error } = yield supabase.auth.refreshSession();
            if (error) {
                console.error('Failed to refresh token:', error);
                return null;
            }
            return (_b = data.session) === null || _b === void 0 ? void 0 : _b.access_token;
        }
        return session.access_token;
    });
}