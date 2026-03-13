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
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, User, FileText, Settings, LogOut, Menu, X, Activity, Clock, } from "lucide-react";
import { useState } from "react";
const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Health Timeline", href: "/dashboard/timeline", icon: Clock },
    { name: "Medical Profile", href: "/dashboard/profile", icon: User },
    { name: "Documents", href: "/dashboard/documents", icon: FileText },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
];
export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const handleSignOut = () => __awaiter(this, void 0, void 0, function* () {
        const supabase = getSupabaseBrowserClient();
        yield supabase.auth.signOut();
        router.push("/auth/login");
        router.refresh();
    });
    return (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "ghost", size: "icon", className: "fixed top-4 left-4 z-50 lg:hidden", onClick: () => setIsMobileOpen(!isMobileOpen), children: isMobileOpen ? _jsx(X, { className: "h-5 w-5" }) : _jsx(Menu, { className: "h-5 w-5" }) }), isMobileOpen && (_jsx("div", { className: "fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden", onClick: () => setIsMobileOpen(false) })), _jsx("aside", { className: cn("fixed inset-y-0 left-0 z-40 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto", isMobileOpen ? "translate-x-0" : "-translate-x-full"), children: _jsxs("div", { className: "flex flex-col h-full", children: [_jsxs("div", { className: "flex items-center gap-3 px-6 py-5 border-b border-sidebar-border", children: [_jsx("div", { className: "p-2 rounded-lg bg-primary/10", children: _jsx(Activity, { className: "h-6 w-6 text-primary" }) }), _jsxs("div", { children: [_jsx("h1", { className: "font-semibold text-sidebar-foreground", children: "HealthTrack" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Personal Health Monitor" })] })] }), _jsx("nav", { className: "flex-1 px-3 py-4 space-y-1 overflow-y-auto", children: navigation.map((item) => {
                                const isActive = pathname === item.href;
                                return (_jsxs(Link, { href: item.href, onClick: () => setIsMobileOpen(false), className: cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors", isActive
                                        ? "bg-sidebar-accent text-sidebar-primary"
                                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"), children: [_jsx(item.icon, { className: "h-5 w-5" }), item.name] }, item.name));
                            }) }), _jsx("div", { className: "p-3 border-t border-sidebar-border", children: _jsxs(Button, { variant: "ghost", className: "w-full justify-start gap-3 text-muted-foreground hover:text-foreground", onClick: handleSignOut, children: [_jsx(LogOut, { className: "h-5 w-5" }), "Sign Out"] }) })] }) })] }));
}
