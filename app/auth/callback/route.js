import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  
  console.log('Auth callback received:', { code: !!code, error, errorDescription });
  
  // If there's an error, redirect to verify page
  if (error) {
    console.error('Auth error:', error, errorDescription);
    const errorParams = new URLSearchParams(requestUrl.searchParams);
    errorParams.delete('code');
    return NextResponse.redirect(
      new URL(`/auth/verify?${errorParams.toString()}`, request.url)
    )
  }
  
  if (code) {
    try {
      const cookieStore = await cookies() // await is required in Next.js 15+
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          cookies: {
            get(name) {
              return cookieStore.get(name)?.value
            },
            set(name, value, options) {
              try {
                cookieStore.set({ name, value, ...options })
              } catch (error) {
                // Handle cookie error
              }
            },
            remove(name, options) {
              try {
                cookieStore.set({ name, value: '', ...options })
              } catch (error) {
                // Handle cookie error
              }
            },
          },
        }
      )

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Error exchanging code:', exchangeError);
        const errorParams = new URLSearchParams(requestUrl.searchParams);
        errorParams.set('error', exchangeError.message);
        errorParams.delete('code');
        return NextResponse.redirect(
          new URL(`/auth/verify?${errorParams.toString()}`, request.url)
        )
      }

      console.log('Code exchanged successfully');
      
    } catch (error) {
      console.error('Error in auth callback:', error)
      const errorParams = new URLSearchParams(requestUrl.searchParams);
      errorParams.set('error_description', 'Failed to complete verification');
      errorParams.delete('code');
      return NextResponse.redirect(
        new URL(`/auth/verify?${errorParams.toString()}`, request.url)
      )
    }
  }

  // Get the current user to determine redirect
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
          set(name, value, options) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              // Handle cookie error
            }
          },
          remove(name, options) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              // Handle cookie error
            }
          },
        },
      }
    )
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
      console.error('Error getting user:', userError);
      const errorParams = new URLSearchParams(requestUrl.searchParams);
      errorParams.set('error', userError.message || 'User lookup failed');
      errorParams.delete('code');
      return NextResponse.redirect(new URL(`/auth/verify?${errorParams.toString()}`, request.url))
    }

    if (user) {
      console.log('User found:', user.email);
      
      // ✅ NEW: Check user role from profiles table instead of doctors table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        // Profile might not exist yet (trigger hasn't run)
        // Wait a moment and retry or redirect to complete profile
        const nextParam = requestUrl.searchParams.get('next') || '/auth/complete-profile';
        return NextResponse.redirect(new URL(nextParam, request.url))
      }

      // Check role and redirect accordingly
      if (profile?.role === 'doctor') {
        console.log('User is a doctor, redirecting to doctor dashboard');
        return NextResponse.redirect(new URL('/doctor/dashboard', request.url))
      } else if (profile?.role === 'patient') {
        const nextParam = requestUrl.searchParams.get('next') || '/auth/complete-profile';
        console.log('User is a patient, redirecting to:', nextParam);
        return NextResponse.redirect(new URL(nextParam, request.url))
      } else {
        // Fallback for unknown role
        console.log('Unknown role, redirecting to complete profile');
        return NextResponse.redirect(new URL('/auth/complete-profile', request.url))
      }
    }
  } catch (error) {
    console.error('Error in user redirect:', error)
  }

  // If no user or error, redirect to verify page with context
  const errorParams = new URLSearchParams(requestUrl.searchParams);
  errorParams.set('error', 'No user session found after verification');
  errorParams.delete('code');
  return NextResponse.redirect(new URL(`/auth/verify?${errorParams.toString()}`, request.url))
}