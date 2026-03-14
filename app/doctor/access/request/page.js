import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ReadOnlyPatientView } from "@/components/doctor/read-only-patient-view";

export default async function DoctorPatientViewPage({ params }) {
  const supabase = createServerComponentClient({ cookies });
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/auth/login');
  }

  // Verify doctor has active session for this patient
  const { data: doctor } = await supabase
    .from('doctors')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!doctor) {
    redirect('/doctor/register');
  }

  const { data: activeSession } = await supabase
    .from('doctor_sessions')
    .select('*')
    .eq('doctor_id', doctor.id)
    .eq('patient_id', params.patientId)
    .is('terminated_at', null)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (!activeSession) {
    redirect('/doctor/access');
  }

  // Fetch patient data
  const [profileRes, medicationsRes, allergiesRes, conditionsRes, documentsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', params.patientId).single(),
    supabase.from('medications').select('*').eq('user_id', params.patientId),
    supabase.from('allergies').select('*').eq('user_id', params.patientId),
    supabase.from('chronic_conditions').select('*').eq('user_id', params.patientId),
    supabase.from('documents').select('*').eq('user_id', params.patientId)
  ]);

  return (
    <ReadOnlyPatientView 
      patientId={params.patientId}
      sessionId={activeSession.id}
      patientData={{
        profile: profileRes.data,
        medications: medicationsRes.data || [],
        allergies: allergiesRes.data || [],
        conditions: conditionsRes.data || [],
        documents: documentsRes.data || []
      }}
    />
  );
}