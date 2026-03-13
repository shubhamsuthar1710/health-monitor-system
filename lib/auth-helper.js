// lib/auth-helper.js
import { getSupabaseBrowserClient } from "./supabase/client";

/**
 * Find user by email OR patient_id
 * Returns user object if found, null otherwise
 */
export async function findUserByEmailOrId(identifier) {
  const supabase = getSupabaseBrowserClient();
  
  // Check if identifier is email (contains @)
  if (identifier.includes('@')) {
    // Find by email in auth.users (we need to use a different approach)
    // For now, we'll let Supabase auth handle this
    return { method: 'email', value: identifier };
  } else {
    // Assume it's patient_id (8 digits)
    // First, get the user_id from profiles
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, patient_id')
      .eq('patient_id', identifier)
      .single();
    
    if (error || !profile) {
      return null;
    }
    
    return { 
      method: 'patient_id', 
      value: identifier,
      user: profile
    };
  }
}

/**
 * Generate a formatted patient ID for display
 */
export function formatPatientId(patientId) {
  if (!patientId) return '';
  // Format as: 1000 0001 (with space for readability)
  return patientId.replace(/(\d{4})(\d{4})/, '$1 $2');
}   