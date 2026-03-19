"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function DoctorPendingPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    const checkAndRedirect = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: doctor } = await supabase
          .from('doctors')
          .select('verification_status')
          .eq('user_id', user.id)
          .single();

        // If doctor exists, they're auto-verified, so go to dashboard
        if (doctor) {
          router.push('/doctor/dashboard');
        } else {
          router.push('/doctor/signup');
        }
      } else {
        router.push('/doctor/login');
      }
    };

    checkAndRedirect();
  }, [router, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p>Redirecting...</p>
      </div>
    </div>
  );
}