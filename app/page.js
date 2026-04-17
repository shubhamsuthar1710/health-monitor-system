import { getSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Activity, 
  Heart, 
  Shield, 
  Clock, 
  FileText, 
  Pill, 
  ArrowRight,
  Stethoscope,
  Brain,
  AlertCircle,
  Users,
  CheckCircle
} from "lucide-react";

const features = [
  { icon: Activity, title: "Health Tracking", desc: "Track vitals, weight, blood pressure & more" },
  { icon: Pill, title: "Medications", desc: "Manage dosages & schedules" },
  { icon: FileText, title: "Documents", desc: "Store medical records securely" },
  { icon: Shield, title: "Emergency Card", desc: "Critical info when you need it" },
  { icon: Brain, title: "Medical History", desc: "Allergies, conditions & family history" },
  { icon: Clock, title: "Quick Entries", desc: "Log measurements in seconds" },
];

const stats = [
  { value: "10K+", label: "Users" },
  { value: "50K+", label: "Records" },
  { value: "99.9%", label: "Uptime" },
];

const benefits = [
  "Secure & private health management",
  "Easy medication tracking",
  "Emergency information access",
  "Doctor sharing made simple",
];

export default async function HomePage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    const { data: doctor } = await supabase
      .from('doctors')
      .select('verification_status')
      .eq('user_id', user.id)
      .single();

    if (doctor) {
      redirect(doctor.verification_status === 'verified' ? "/doctor/dashboard" : "/doctor/pending");
    } else {
      redirect("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <span className="font-semibold text-lg">HealthTrack</span>
          </Link>
          
          <nav className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="sm" asChild className="hidden sm:flex gap-2">
              <Link href="/doctor/signup">
                <Stethoscope className="h-4 w-4" />
                For Doctors
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/auth/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section with Human-Centric Visuals */}
      <section className="relative py-16 sm:py-24 lg:py-28 overflow-hidden">
        {/* Background subtle pattern */}
        <div className="absolute inset-0 opacity-50">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="hero-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1.5" fill="currentColor" className="text-primary/10"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#hero-pattern)"/>
          </svg>
        </div>
        
        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            {/* Left: Text */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary/15 to-primary/5 text-primary text-sm font-medium mb-6 animate-fade-in">
                <Heart className="h-4 w-4 fill-current" />
                Your Health, Your Control
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6 animate-fade-in-up">
                Track Your Health, <span className="text-primary">Simplified</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-lg mx-auto lg:mx-0 animate-fade-in-up animation-delay-100">
                Monitor vitals, manage medications, store records, and keep emergency 
                information at your fingertips. All in one secure platform.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 mb-8 animate-fade-in-up animation-delay-200">
                <Button size="lg" asChild className="gap-2 w-full sm:w-auto bg-primary hover:bg-primary/90 transition-all">
                  <Link href="/auth/sign-up">
                    Start Free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="w-full sm:w-auto border-border hover:bg-accent transition-all">
                  <Link href="/auth/login">Sign In</Link>
                </Button>
              </div>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-sm text-muted-foreground animate-fade-in-up animation-delay-300">
                {benefits.slice(0, 2).map((benefit, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Right: Healthcare Image */}
            <div className="relative hidden lg:block animate-fade-in-scale animation-delay-200">
              <div className="relative aspect-square max-w-lg mx-auto">
                {/* Soft gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-emerald-5/10 rounded-3xl" />
                
                {/* Main image */}
                <div className="relative h-full w-full rounded-3xl overflow-hidden shadow-2xl">
                  <Image
                    src="/hero-healthcare.svg"
                    alt="Health tracking dashboard"
                    fill
                    className="object-contain p-8"
                    priority
                  />
                </div>
                
                {/* Decorative elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
                <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-gradient-to-r from-muted/20 via-muted/10 to-muted/20">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 sm:gap-16">
            {stats.map((stat, i) => (
              <div key={i} className="text-center animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                <p className="text-3xl sm:text-4xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features with Cards */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Everything You Need</h2>
            <p className="text-muted-foreground text-center max-w-xl mx-auto">
              Comprehensive health monitoring tools designed to help you stay on top of your wellbeing.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {features.map((feature, i) => (
              <Card 
                key={i} 
                className="hover:shadow-lg hover:border-primary/20 transition-all duration-300 group border-border/60"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 group-hover:from-primary/20 group-hover:to-primary/10 transition-all">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-muted/20 to-background">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { num: "1", title: "Create Account", desc: "Sign up in seconds with Google or email" },
              { num: "2", title: "Complete Profile", desc: "Add your medical information" },
              { num: "3", title: "Start Tracking", desc: "Log vitals and monitor health" },
            ].map((step, i) => (
              <div key={i} className="text-center group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4 group-hover:from-primary/30 group-hover:to-primary/10 transition-all">
                  <span className="text-xl font-bold text-primary">{step.num}</span>
                </div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Doctors CTA with Visual */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto overflow-hidden border-0 shadow-xl">
            <div className="relative aspect-[16/9] sm:aspect-video bg-gradient-to-br from-primary/10 via-emerald-5/20 to-primary/5">
              <Image
                src="/doctor-illustration.svg"
                alt="Doctor consultation"
                fill
                className="object-contain p-8"
              />
              {/* Soft overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
            </div>
            <CardContent className="p-8 text-center -mt-10 relative">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 w-fit mx-auto mb-4">
                <Stethoscope className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold mb-3">Healthcare Provider?</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Register to securely access patient records and provide better care to your patients.
              </p>
              <div className="flex justify-center">
                <Button asChild size="lg" className="gap-2 bg-primary hover:bg-primary/90 transition-all">
                  <Link href="/doctor/signup">
                    Register as Doctor
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Trust Banner */}
      <section className="py-10 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm">Your data is secure and private. HIPAA compliant platform.</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <span className="font-medium">HealthTrack</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <span>© 2024</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}