import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { DoctorDashboardContent } from '@/components/doctor/doctor-dashboard-content'

export default async function DoctorDashboardPage() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/doctor/login')
  }

  // Get doctor profile
  const { data: doctor, error } = await supabase
    .from('doctors')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error || !doctor) {
    console.error('Doctor not found:', error)
    redirect('/doctor/signup')
  }

  return <DoctorDashboardContent doctor={doctor} />
}