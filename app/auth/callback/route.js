// import { createServerClient } from '@supabase/ssr'
// import { cookies } from 'next/headers'
// import { NextResponse } from 'next/server'

// export async function GET(request) {
//   const requestUrl = new URL(request.url)
//   const code = requestUrl.searchParams.get('code')
//   const error = requestUrl.searchParams.get('error')
//   const errorDescription = requestUrl.searchParams.get('error_description')
  
//   console.log('Auth callback received:', { code: !!code, error, errorDescription });
  
//   // If there's an error, redirect to verify page
//   if (error) {
//     console.error('Auth error:', error, errorDescription);
//     const errorParams = new URLSearchParams(requestUrl.searchParams);
//     errorParams.delete('code');
//     return NextResponse.redirect(
//       new URL(`/auth/verify?${errorParams.toString()}`, request.url)
//     )
//   }
  
//   if (code) {
//     try {
//       const cookieStore = await cookies() // await is required in Next.js 15+
//       const supabase = createServerClient(
//         process.env.NEXT_PUBLIC_SUPABASE_URL,
//         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
//         {
//           cookies: {
//             get(name) {
//               return cookieStore.get(name)?.value
//             },
//             set(name, value, options) {
//               try {
//                 cookieStore.set({ name, value, ...options })
//               } catch (error) {
//                 // Handle cookie error
//               }
//             },
//             remove(name, options) {
//               try {
//                 cookieStore.set({ name, value: '', ...options })
//               } catch (error) {
//                 // Handle cookie error
//               }
//             },
//           },
//         }
//       )

//       const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
//       if (exchangeError) {
//         console.error('Error exchanging code:', exchangeError);
//         const errorParams = new URLSearchParams(requestUrl.searchParams);
//         errorParams.set('error', exchangeError.message);
//         errorParams.delete('code');
//         return NextResponse.redirect(
//           new URL(`/auth/verify?${errorParams.toString()}`, request.url)
//         )
//       }

//       console.log('Code exchanged successfully');
      
//     } catch (error) {
//       console.error('Error in auth callback:', error)
//       const errorParams = new URLSearchParams(requestUrl.searchParams);
//       errorParams.set('error_description', 'Failed to complete verification');
//       errorParams.delete('code');
//       return NextResponse.redirect(
//         new URL(`/auth/verify?${errorParams.toString()}`, request.url)
//       )
//     }
//   }

//   // Get the current user to determine redirect
//   try {
//     const cookieStore = await cookies()
//     const supabase = createServerClient(
//       process.env.NEXT_PUBLIC_SUPABASE_URL,
//       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
//       {
//         cookies: {
//           get(name) {
//             return cookieStore.get(name)?.value
//           },
//           set(name, value, options) {
//             try {
//               cookieStore.set({ name, value, ...options })
//             } catch (error) {
//               // Handle cookie error
//             }
//           },
//           remove(name, options) {
//             try {
//               cookieStore.set({ name, value: '', ...options })
//             } catch (error) {
//               // Handle cookie error
//             }
//           },
//         },
//       }
//     )
    
//     const { data: { user }, error: userError } = await supabase.auth.getUser()

//     if (userError) {
//       console.error('Error getting user:', userError);
//       const errorParams = new URLSearchParams(requestUrl.searchParams);
//       errorParams.set('error', userError.message || 'User lookup failed');
//       errorParams.delete('code');
//       return NextResponse.redirect(new URL(`/auth/verify?${errorParams.toString()}`, request.url))
//     }

//     if (user) {
//       console.log('User found:', user.email);
      
//       // ✅ NEW: Check user role from profiles table instead of doctors table
//       const { data: profile, error: profileError } = await supabase
//         .from('profiles')
//         .select('role')
//         .eq('id', user.id)
//         .single()

//       if (profileError) {
//         console.error('Error fetching profile:', profileError);
//         // Profile might not exist yet (trigger hasn't run)
//         // Wait a moment and retry or redirect to complete profile
    
//       }

//       // Check role and redirect accordingly
//       if (profile?.role === 'doctor') {
//         console.log('User is a doctor, redirecting to doctor dashboard');
//         return NextResponse.redirect(new URL('/doctor/dashboard', request.url))
//       } else if (profile?.role === 'patient') {
//         const nextParam = requestUrl.searchParams.get('next') || '/auth/complete-profile';
//         console.log('User is a patient, redirecting to:', nextParam);
//         return NextResponse.redirect(new URL(nextParam, request.url))
//       } else {
//         // Fallback for unknown role
//         console.log('Unknown role, redirecting to complete profile');
//         return NextResponse.redirect(new URL('/auth/complete-profile', request.url))
//       }
//     }
//   } catch (error) {
//     console.error('Error in user redirect:', error)
//   }

//   // If no user or error, redirect to verify page with context
//   const errorParams = new URLSearchParams(requestUrl.searchParams);
//   errorParams.set('error', 'No user session found after verification');
//   errorParams.delete('code');
//   return NextResponse.redirect(new URL(`/auth/verify?${errorParams.toString()}`, request.url))
// }
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
  
  // Handle email verification token (from signup email)
  if (token && type === 'signup') {
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
                console.error('Cookie set error:', error)
              }
            },
            remove(name, options) {
              try {
                cookieStore.set({ name, value: '', ...options })
              } catch (error) {
                console.error('Cookie remove error:', error)
              }
            },
          },
        }
      )

      // Verify the OTP token
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'signup'
      })

      if (verifyError) {
        console.error('Token verification failed:', verifyError);
        const errorParams = new URLSearchParams();
        errorParams.set('error', verifyError.message);
        errorParams.set('error_code', verifyError.code || 'verification_failed');
        return NextResponse.redirect(
          new URL(`/auth/verify?${errorParams.toString()}`, request.url)
        )
      }

      console.log('Email verified successfully');
      
      // Get the now-verified user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.error('Error getting user after verification:', userError);
        return NextResponse.redirect(
          new URL('/auth/verify?error=User not found after verification', request.url)
        )
      }

      // Check if profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      // Redirect to complete profile (patient flow)
      return NextResponse.redirect(new URL('/auth/complete-profile', request.url))
      
    } catch (error) {
      console.error('Error in token verification:', error)
      const errorParams = new URLSearchParams();
      errorParams.set('error', 'Verification failed. Please try again.');
      return NextResponse.redirect(
        new URL(`/auth/verify?${errorParams.toString()}`, request.url)
      )
    }
  }
  
  // Handle OAuth code exchange (Google login)
  if (code) {
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
                console.error('Cookie set error:', error)
              }
            },
            remove(name, options) {
              try {
                cookieStore.set({ name, value: '', ...options })
              } catch (error) {
                console.error('Cookie remove error:', error)
              }
            },
          },
        }
      )

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Error exchanging code:', exchangeError);
        const errorParams = new URLSearchParams();
        errorParams.set('error', exchangeError.message);
        return NextResponse.redirect(
          new URL(`/auth/verify?${errorParams.toString()}`, request.url)
        )
      }

      console.log('OAuth code exchanged successfully');
      
    } catch (error) {
      console.error('Error in OAuth callback:', error)
      const errorParams = new URLSearchParams();
      errorParams.set('error', 'Failed to complete OAuth verification');
      return NextResponse.redirect(
        new URL(`/auth/verify?${errorParams.toString()}`, request.url)
      )
    }
  }

  // Get the current user to determine redirect (for OAuth flow)
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
              console.error('Cookie set error:', error)
            }
          },
          remove(name, options) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              console.error('Cookie remove error:', error)
            }
          },
        },
      }
    )
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('Error getting user:', userError);
      const errorParams = new URLSearchParams();
      errorParams.set('error', userError?.message || 'User lookup failed');
      return NextResponse.redirect(new URL(`/auth/verify?${errorParams.toString()}`, request.url))
    }

    console.log('User found:', user.email);
    
    // Check user role from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      // Profile doesn't exist yet - trigger hasn't run or user just signed up
      // For OAuth, we need to create the profile or redirect to complete it
      console.log('Profile not found, redirecting to complete profile');
      return NextResponse.redirect(new URL('/auth/complete-profile', request.url))
    }

    // Check role and redirect accordingly
    if (profile?.role === 'doctor') {
      console.log('User is a doctor, redirecting to doctor dashboard');
      return NextResponse.redirect(new URL('/doctor/dashboard', request.url))
    } else if (profile?.role === 'patient') {
      console.log('User is a patient, redirecting to complete profile');
      return NextResponse.redirect(new URL('/auth/complete-profile', request.url))
    } else {
      // Fallback for unknown role
      console.log('Unknown role, redirecting to complete profile');
      return NextResponse.redirect(new URL('/auth/complete-profile', request.url))
    }
    
  } catch (error) {
    console.error('Error in user redirect:', error)
    const errorParams = new URLSearchParams();
    errorParams.set('error', 'Failed to process user session');
    return NextResponse.redirect(new URL(`/auth/verify?${errorParams.toString()}`, request.url))
  }
}