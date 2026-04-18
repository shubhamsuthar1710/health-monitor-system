import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PatientFullView } from "@/components/doctor/patient-full-view";

export default async function ViewPatientPage({ params }) {
  const { patientId } = params;
  
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {}
        },
        remove(name, options) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {}
        },
      },
    }
  );

  // Get current user (doctor)
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/doctor/login');
  }

  // Verify doctor
  const { data: doctor } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .eq('role', 'doctor')
    .single();

  if (!doctor) {
    redirect('/doctor/dashboard');
  }

  // Check if doctor has active session for this patient
  const { data: activeSession } = await supabase
    .from('doctor_sessions')
    .select('*, access_request_id, access_requests(*)')
    .eq('doctor_id', doctor.id)
    .eq('patient_id', patientId)
    .is('terminated_at', null)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (!activeSession) {
    redirect('/doctor/access/request');
  }

  // Fetch patient data
  const [profile, medications, allergies, conditions, familyHistory, healthEntries, emergencyContacts] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', patientId).single(),
    supabase.from('medications').select('*').eq('user_id', patientId),
    supabase.from('allergies').select('*').eq('user_id', patientId),
    supabase.from('chronic_conditions').select('*').eq('user_id', patientId),
    supabase.from('family_history').select('*').eq('user_id', patientId),
    supabase.from('health_entries').select('*').eq('user_id', patientId).order('recorded_at', { ascending: false }).limit(50),
    supabase.from('emergency_contacts').select('*').eq('user_id', patientId),
  ]);

  const patientData = {
    profile: profile.data,
    medications: medications.data || [],
    allergies: allergies.data || [],
    conditions: conditions.data || [],
    familyHistory: familyHistory.data || [],
    healthEntries: healthEntries.data || [],
    emergencyContacts: emergencyContacts.data || [],
  };

  return (
    <PatientFullView 
      patientId={patientId}
      sessionId={activeSession.id}
      patientData={patientData}
      doctorName={doctor.full_name}
      sessionExpiresAt={activeSession.expires_at}
    />
  );
}