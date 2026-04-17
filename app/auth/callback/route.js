import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token = requestUrl.searchParams.get('token')
  const type = requestUrl.searchParams.get('type')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  
  console.log('Auth callback received:', { 
    code: !!code, 
    token: !!token, 
    type, 
    error, 
    errorDescription 
  });
  
  // If there's an error, redirect to verify page
  if (error) {
    console.error('Auth error:', error, errorDescription);
    const errorParams = new URLSearchParams(requestUrl.searchParams);
    errorParams.delete('code');
    errorParams.delete('token');
    return NextResponse.redirect(
      new URL(`/auth/verify?${errorParams.toString()}`, request.url)
    )
  }
  
  const cookieStore = await cookies()
  
  // Handle email verification token (from signup email)
  if (token && type === 'signup') {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          cookies: {
            get(name) { return cookieStore.get(name)?.value },
            set(name, value, options) {
              try { cookieStore.set({ name, value, ...options }) } catch (e) {}
            },
            remove(name, options) {
              try { cookieStore.set({ name, value: '', ...options }) } catch (e) {}
            },
          },
        }
      )

      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'signup'
      })

      if (verifyError) {
        console.error('Token verification failed:', verifyError);
        return NextResponse.redirect(
          new URL(`/auth/verify?error=${verifyError.message}`, request.url)
        )
      }

      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return NextResponse.redirect(new URL('/auth/verify?error=User not found', request.url))
      }

      console.log('=== EMAIL VERIFICATION ===');
      console.log('User email:', user.email);
      
      const signupRoleCookie = cookieStore.get('signup_role')?.value;
      const userRoleFromMeta = user.user_metadata?.user_type || user.user_metadata?.role;
      const userTypeFromUrl = requestUrl.searchParams.get('user_type');
      
      let finalRole = signupRoleCookie || userTypeFromUrl || userRoleFromMeta || 'patient';
      console.log('Final role:', finalRole);
      
      // FORCE doctor role if cookie is set
      if (signupRoleCookie === 'doctor') {
        finalRole = 'doctor';
        console.log('Forced doctor role from cookie');
      }
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, is_profile_complete')
        .eq('id', user.id)
        .single()

      if (profileError && profileError.code === 'PGRST116') {
        await supabase.from('profiles').upsert({
          id: user.id,
          email: user.email,
          role: finalRole,
          is_profile_complete: false
        });
      } else if (profile) {
        // Fix role if cookie says doctor
        if (signupRoleCookie === 'doctor' && profile.role !== 'doctor') {
          await supabase.from('profiles').update({
            role: 'doctor',
            is_profile_complete: false
          }).eq('id', user.id);
        }
      }
      
      // Redirect
      if (finalRole === 'doctor') {
        return NextResponse.redirect(new URL('/doctor/complete-profile', request.url))
      } else {
        return NextResponse.redirect(new URL('/auth/complete-profile', request.url))
      }
      
    } catch (error) {
      console.error('Error in token verification:', error)
      return NextResponse.redirect(
        new URL('/auth/verify?error=Verification failed', request.url)
      )
    }
  }
  
  // Handle OAuth code exchange (Google login)
  if (code) {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          cookies: {
            get(name) { return cookieStore.get(name)?.value },
            set(name, value, options) {
              try { cookieStore.set({ name, value, ...options }) } catch (e) {}
            },
            remove(name, options) {
              try { cookieStore.set({ name, value: '', ...options }) } catch (e) {}
            },
          },
        }
      )

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Error exchanging code:', exchangeError);
        return NextResponse.redirect(
          new URL(`/auth/verify?error=${exchangeError.message}`, request.url)
        )
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        console.error('Error getting user:', userError);
        return NextResponse.redirect(new URL('/auth/verify?error=User not found', request.url))
      }

      console.log('=== OAUTH CALLBACK ===');
      console.log('User email:', user.email);
      console.log('User metadata:', JSON.stringify(user.user_metadata));
      
      // Get role from cookie, URL param, or metadata
      const signupRoleCookie = cookieStore.get('signup_role')?.value;
      const userTypeFromUrl = requestUrl.searchParams.get('user_type');
      const userRoleFromMeta = user.user_metadata?.user_type || user.user_metadata?.role;
      
      let finalRole = signupRoleCookie || userTypeFromUrl || userRoleFromMeta || 'patient';
      console.log('Final role determined:', finalRole);
      
      // FORCE doctor role if cookie is set to doctor
      if (signupRoleCookie === 'doctor') {
        finalRole = 'doctor';
        console.log('Forced doctor role from cookie');
      }
      
      // Check profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, is_profile_complete')
        .eq('id', user.id)
        .single()

      if (profileError && profileError.code === 'PGRST116') {
        // Create profile with correct role
        console.log('Creating profile with role:', finalRole);
        await supabase.from('profiles').upsert({
          id: user.id,
          email: user.email,
          role: finalRole,
          is_profile_complete: false
        });
      } else if (profile) {
        // ALWAYS fix role to doctor if cookie says doctor
        if (signupRoleCookie === 'doctor' && profile.role !== 'doctor') {
          console.log('FORCE updating role from', profile.role, 'to doctor');
          await supabase.from('profiles').update({
            role: 'doctor',
            is_profile_complete: false
          }).eq('id', user.id);
        }
      }
      
      // Clear cookie
      try {
        cookieStore.set({ name: 'signup_role', value: '', path: '/', maxAge: 0 })
      } catch (e) {}

      // Redirect based on role
      if (finalRole === 'doctor') {
        console.log('>>> Redirect to /doctor/complete-profile');
        return NextResponse.redirect(new URL('/doctor/complete-profile', request.url))
      } else {
        console.log('>>> Redirect to /auth/complete-profile');
        return NextResponse.redirect(new URL('/auth/complete-profile', request.url))
      }
      
    } catch (error) {
      console.error('Error in OAuth callback:', error)
      return NextResponse.redirect(
        new URL('/auth/verify?error=OAuth failed', request.url)
      )
    }
  }

  // No code/token - try to get user from session
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) { return cookieStore.get(name)?.value },
          set(name, value, options) {
            try { cookieStore.set({ name, value, ...options }) } catch (e) {}
          },
          remove(name, options) {
            try { cookieStore.set({ name, value: '', ...options }) } catch (e) {}
          },
        },
      }
    )
    
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/auth/verify?error=No session', request.url))
    }

    console.log('=== SESSION CHECK ===');
    console.log('User:', user.email);
    
    const signupRoleCookie = cookieStore.get('signup_role')?.value;
    const userTypeFromUrl = requestUrl.searchParams.get('user_type');
    const userRoleFromMeta = user.user_metadata?.user_type || user.user_metadata?.role;
    
    let finalRole = signupRoleCookie || userTypeFromUrl || userRoleFromMeta || 'patient';
    console.log('Final role:', finalRole);

    // Redirect based on role
    if (finalRole === 'doctor') {
      return NextResponse.redirect(new URL('/doctor/complete-profile', request.url))
    } else {
      return NextResponse.redirect(new URL('/auth/complete-profile', request.url))
    }
    
  } catch (error) {
    console.error('Error in redirect:', error)
    return NextResponse.redirect(new URL('/auth/verify?error=Failed', request.url))
  }
}