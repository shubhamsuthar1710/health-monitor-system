import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
export default function AuthErrorPage() {
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-background p-4", children: _jsxs(Card, { className: "w-full max-w-md text-center", children: [_jsxs(CardHeader, { children: [_jsx("div", { className: "flex justify-center mb-4", children: _jsx("div", { className: "p-3 rounded-full bg-destructive/10", children: _jsx(AlertTriangle, { className: "h-8 w-8 text-destructive" }) }) }), _jsx(CardTitle, { className: "text-2xl font-bold", children: "Authentication Error" }), _jsx(CardDescription, { children: "Something went wrong during authentication" })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsx("p", { className: "text-muted-foreground", children: "We couldn't complete the authentication process. This could be due to an expired link or a technical issue. Please try again." }), _jsxs("div", { className: "flex flex-col gap-2", children: [_jsx(Button, { asChild: true, className: "w-full", children: _jsx(Link, { href: "/auth/login", children: "Try Again" }) }), _jsx(Button, { asChild: true, variant: "outline", className: "w-full bg-transparent", children: _jsx(Link, { href: "/auth/sign-up", children: "Create New Account" }) })] })] })] }) }));
}
