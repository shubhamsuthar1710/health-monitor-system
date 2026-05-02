-- Migration: Fix schema issues
-- Run this after the initial schema

-- 1. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_patient_id ON profiles(patient_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON access_requests(status);
CREATE INDEX IF NOT EXISTS idx_access_requests_patient ON access_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_doctor ON access_requests(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_sessions_doctor ON doctor_sessions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_sessions_patient ON doctor_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_doctor_sessions_expires ON doctor_sessions(expires_at);

-- 2. Add OTP hash column for security
ALTER TABLE IF EXISTS access_requests ADD COLUMN IF NOT EXISTS otp_code_hash text;

-- 3. Add role_check column to track doctor verification status in profiles
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'pending' CHECK (verification_status = ANY (ARRAY['pending'::text, 'verified'::text, 'rejected'::text]));