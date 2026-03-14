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
    return NextResponse.redirect(
      new URL(`/auth/verify?error=${encodeURIComponent(errorDescription || 'Verification failed')}`, request.url)
    )
  }
  
  if (code) {
    try {
      const cookieStore = cookies()
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
        return NextResponse.redirect(
          new URL(`/auth/verify?error=${encodeURIComponent(exchangeError.message)}`, request.url)
        )
      }

      console.log('Code exchanged successfully');
      
    } catch (error) {
      console.error('Error in auth callback:', error)
      return NextResponse.redirect(
        new URL(`/auth/verify?error=${encodeURIComponent('Failed to complete verification')}`, request.url)
      )
    }
  }

  // Get the current user to determine redirect
  try {
    const cookieStore = cookies()
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
      return NextResponse.redirect(new URL('/auth/verify', request.url))
    }

    if (user) {
      console.log('User found:', user.email);
      
      // Check if user is a doctor
      const { data: doctor } = await supabase
        .from('doctors')
        .select('verification_status')
        .eq('user_id', user.id)
        .single()

      if (doctor) {
        console.log('User is a doctor, redirecting to pending');
        // Redirect to doctor pending page
        return NextResponse.redirect(new URL('/doctor/pending', request.url))
      } else {
        console.log('User is a patient, redirecting to dashboard');
        // Redirect to patient dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
  } catch (error) {
    console.error('Error in user redirect:', error)
  }

  // If no user or error, redirect to verify page
  return NextResponse.redirect(new URL('/auth/verify', request.url))
}