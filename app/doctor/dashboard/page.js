import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { DoctorDashboardContent } from '@/components/doctor/doctor-dashboard-content'

export default async function DoctorDashboardPage() {
  const cookieStore = await cookies() // Add await for Next.js 15+
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

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    redirect('/doctor/login')
  }

  // ✅ Get user profile from profiles table (not doctors table)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    console.error('Profile not found:', profileError)
    redirect('/doctor/signup')
  }

  // ✅ Check if user has doctor role
  if (profile.role !== 'doctor') {
    console.error('User is not a doctor:', profile.role)
    redirect('/dashboard') // Redirect to patient dashboard if not a doctor
  }

  // Pass profile data to dashboard content
  return <DoctorDashboardContent doctor={profile} />
}