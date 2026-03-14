// In your header/navigation component
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Activity, Heart, Shield, Clock, FileText, Pill, ArrowRight, CheckCircle2, Stethoscope } from "lucide-react";

export default function HomePage() {
    return __awaiter(this, void 0, void 0, function* () {
        const supabase = yield getSupabaseServerClient();
        const { data: { user } } = yield supabase.auth.getUser();
        
        if (user) {
            // Check if user is doctor or patient and redirect accordingly
            const { data: doctor } = yield supabase
                .from('doctors')
                .select('verification_status')
                .eq('user_id', user.id)
                .single();

            if (doctor) {
                if (doctor.verification_status === 'verified') {
                    redirect("/doctor/dashboard");
                } else {
                    redirect("/doctor/pending");
                }
            } else {
                redirect("/dashboard");
            }
        }

        return (_jsxs("div", { className: "min-h-screen bg-background", children: [
            _jsx("header", { className: "border-b border-border", children: 
                _jsxs("div", { className: "container mx-auto px-4 py-4 flex items-center justify-between", children: [
                    _jsxs("div", { className: "flex items-center gap-3", children: [
                        _jsx("div", { className: "p-2 rounded-lg bg-primary/10", children: 
                            _jsx(Activity, { className: "h-6 w-6 text-primary" }) 
                        }),
                        _jsx("span", { className: "font-semibold text-lg", children: "HealthTrack" })
                    ] }),
                    
                    _jsxs("div", { className: "flex items-center gap-3", children: [
                        // Doctor Registration Link - ADD THIS LINE
                        _jsx(Button, { variant: "ghost", size: "sm", asChild: true, className: "hidden sm:flex gap-2", children: 
                            _jsxs(Link, { href: "/doctor/signup", children: [
                                _jsx(Stethoscope, { className: "h-4 w-4" }),
                                "For Doctors"
                            ] })
                        }),
                        
                        _jsx(Button, { variant: "ghost", asChild: true, children: 
                            _jsx(Link, { href: "/auth/login", children: "Sign In" })
                        }),
                        
                        _jsx(Button, { asChild: true, children: 
                            _jsx(Link, { href: "/auth/sign-up", children: "Get Started" })
                        })
                    ] })
                ] })
            }),

            _jsx("section", { className: "py-20 lg:py-32", children: 
                _jsx("div", { className: "container mx-auto px-4", children: 
                    _jsxs("div", { className: "max-w-3xl mx-auto text-center", children: [
                        _jsxs("div", { className: "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6", children: [
                            _jsx(Heart, { className: "h-4 w-4" }),
                            "Your Health, Your Control"
                        ] }),
                        _jsx("h1", { className: "text-4xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 text-balance", children: "Take Charge of Your Health Journey" }),
                        _jsx("p", { className: "text-xl text-muted-foreground mb-8 text-pretty", children: "Track your vitals, manage medications, store medical records, and keep emergency information at your fingertips. All in one secure, private platform." }),
                        _jsxs("div", { className: "flex flex-col sm:flex-row items-center justify-center gap-4", children: [
                            _jsx(Button, { size: "lg", asChild: true, className: "gap-2", children: 
                                _jsxs(Link, { href: "/auth/sign-up", children: ["Start Free Today", _jsx(ArrowRight, { className: "h-4 w-4" })] })
                            }),
                            _jsx(Button, { size: "lg", variant: "outline", asChild: true, children: 
                                _jsx(Link, { href: "/auth/login", children: "Sign In" })
                            })
                        ] })
                    ] })
                })
            }),

            _jsx("section", { className: "py-20 bg-muted/50", children: 
                _jsxs("div", { className: "container mx-auto px-4", children: [
                    _jsxs("div", { className: "text-center mb-12", children: [
                        _jsx("h2", { className: "text-3xl font-bold mb-4", children: "Everything You Need" }),
                        _jsx("p", { className: "text-muted-foreground max-w-2xl mx-auto", children: "Comprehensive health monitoring tools designed to help you stay on top of your wellbeing" })
                    ] }),
                    _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: [
                        _jsx(FeatureCard, { icon: Activity, title: "Health Timeline", description: "Track blood pressure, heart rate, blood sugar, weight, and more. See trends over time." }),
                        _jsx(FeatureCard, { icon: Pill, title: "Medication Management", description: "Keep track of all your medications, dosages, and schedules in one place." }),
                        _jsx(FeatureCard, { icon: FileText, title: "Document Storage", description: "Store and organize lab results, prescriptions, and medical records securely." }),
                        _jsx(FeatureCard, { icon: Shield, title: "Emergency Card", description: "Digital emergency card with critical health info accessible when you need it most." }),
                        _jsx(FeatureCard, { icon: Heart, title: "Medical Profile", description: "Track allergies, chronic conditions, and family medical history." }),
                        _jsx(FeatureCard, { icon: Clock, title: "Quick Entries", description: "Log health measurements in seconds with our streamlined quick-entry system." })
                    ] })
                ] })
            }),

            _jsx("section", { className: "py-20", children: 
                _jsx("div", { className: "container mx-auto px-4", children: 
                    _jsxs("div", { className: "max-w-4xl mx-auto", children: [
                        _jsx("div", { className: "text-center mb-12", children: 
                            _jsx("h2", { className: "text-3xl font-bold mb-4", children: "Why HealthTrack?" })
                        }),
                        _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
                            _jsx(BenefitItem, { text: "Secure and private - your health data stays yours" }),
                            _jsx(BenefitItem, { text: "Access from anywhere, anytime" }),
                            _jsx(BenefitItem, { text: "Share emergency info with healthcare providers" }),
                            _jsx(BenefitItem, { text: "Track trends and patterns in your health" }),
                            _jsx(BenefitItem, { text: "Never forget medication details again" }),
                            _jsx(BenefitItem, { text: "All your medical documents in one place" })
                        ] })
                    ] })
                })
            }),

            // New section for healthcare providers
            _jsx("section", { className: "py-16 bg-primary/5", children: 
                _jsxs("div", { className: "container mx-auto px-4 text-center", children: [
                    _jsx("div", { className: "p-3 rounded-full bg-primary/10 w-fit mx-auto mb-6", children: 
                        _jsx(Stethoscope, { className: "h-8 w-8 text-primary" })
                    }),
                    _jsx("h2", { className: "text-3xl font-bold mb-4", children: "Are You a Healthcare Provider?" }),
                    _jsx("p", { className: "text-muted-foreground mb-8 max-w-2xl mx-auto", children: "Register as a doctor to securely access patient records, review medical history, and provide better care with complete context." }),
                    _jsxs("div", { className: "flex flex-col sm:flex-row items-center justify-center gap-4", children: [
                        _jsx(Button, { size: "lg", variant: "default", asChild: true, className: "gap-2", children: 
                            _jsxs(Link, { href: "/doctor/signup", children: ["Register as Doctor", _jsx(ArrowRight, { className: "h-4 w-4" })] })
                        }),
                        _jsx(Button, { size: "lg", variant: "outline", asChild: true, children: 
                            _jsx(Link, { href: "/auth/login", children: "Doctor Sign In" })
                        })
                    ] })
                ] })
            }),

            _jsx("section", { className: "py-20 bg-primary/5", children: 
                _jsxs("div", { className: "container mx-auto px-4 text-center", children: [
                    _jsx("h2", { className: "text-3xl font-bold mb-4", children: "Ready to Take Control?" }),
                    _jsx("p", { className: "text-muted-foreground mb-8 max-w-xl mx-auto", children: "Join thousands of users who are already managing their health more effectively with HealthTrack." }),
                    _jsx(Button, { size: "lg", asChild: true, className: "gap-2", children: 
                        _jsxs(Link, { href: "/auth/sign-up", children: ["Create Your Free Account", _jsx(ArrowRight, { className: "h-4 w-4" })] })
                    })
                ] })
            }),

            _jsx("footer", { className: "py-8 border-t border-border", children: 
                _jsx("div", { className: "container mx-auto px-4", children: 
                    _jsxs("div", { className: "flex flex-col sm:flex-row items-center justify-between gap-4", children: [
                        _jsxs("div", { className: "flex items-center gap-2 text-muted-foreground", children: [
                            _jsx(Activity, { className: "h-5 w-5" }),
                            _jsx("span", { className: "font-medium", children: "HealthTrack" })
                        ] }),
                        _jsxs("div", { className: "flex items-center gap-4 text-sm text-muted-foreground", children: [
                            _jsx(Link, { href: "/privacy", className: "hover:text-foreground", children: "Privacy" }),
                            _jsx(Link, { href: "/terms", className: "hover:text-foreground", children: "Terms" }),
                            _jsx(Link, { href: "/contact", className: "hover:text-foreground", children: "Contact" }),
                            _jsx("span", { children: "© 2024 HealthTrack" })
                        ] })
                    ] })
                })
            })
        ] }));
    });
}

function FeatureCard({ icon: Icon, title, description }) {
    return (_jsxs("div", { className: "p-6 rounded-xl bg-background border border-border hover:shadow-md transition-shadow", children: [
        _jsx("div", { className: "p-3 rounded-lg bg-primary/10 w-fit mb-4", children: 
            _jsx(Icon, { className: "h-6 w-6 text-primary" })
        }),
        _jsx("h3", { className: "font-semibold text-lg mb-2", children: title }),
        _jsx("p", { className: "text-muted-foreground text-sm", children: description })
    ] }));
}

function BenefitItem({ text }) {
    return (_jsxs("div", { className: "flex items-center gap-3", children: [
        _jsx(CheckCircle2, { className: "h-5 w-5 text-primary flex-shrink-0" }),
        _jsx("span", { children: text })
    ] }));
}