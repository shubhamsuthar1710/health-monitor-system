import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DoctorDashboardContent } from "@/components/doctor/doctor-dashboard-content";

export default async function DoctorDashboardPage() {
  const supabase = createServerComponentClient({ cookies });
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/auth/login');
  }

  // Get doctor profile
  const { data: doctor, error } = await supabase
    .from('doctors')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error || !doctor) {
    redirect('/doctor/signup');
  }

  // Check verification status
  if (doctor.verification_status !== 'verified') {
    redirect('/doctor/pending');
  }

  // Get active sessions count
  const { count: activeSessions } = await supabase
    .from('doctor_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('doctor_id', doctor.id)
    .is('terminated_at', null)
    .gt('expires_at', new Date().toISOString());

  // Get recent access history
  const { data: recentAccess } = await supabase
    .from('access_audit_logs')
    .select(`
      *,
      patient:profiles(full_name, patient_id)
    `)
    .eq('doctor_id', doctor.id)
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <DoctorDashboardContent 
      doctor={doctor}
      activeSessions={activeSessions || 0}
      recentAccess={recentAccess || []}
    />
  );
}