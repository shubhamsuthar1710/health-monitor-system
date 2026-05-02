-- Migration: Fix doctor_id foreign key to reference profiles instead of doctors
-- This is needed because doctors are stored in profiles table with role='doctor'

-- Drop existing foreign key constraints
ALTER TABLE IF EXISTS access_requests DROP CONSTRAINT IF EXISTS access_requests_doctor_id_fkey;
ALTER TABLE IF EXISTS doctor_sessions DROP CONSTRAINT IF EXISTS doctor_sessions_doctor_id_fkey;
ALTER TABLE IF EXISTS access_audit_logs DROP CONSTRAINT IF EXISTS access_audit_logs_doctor_id_fkey;

-- Add new foreign key constraints referencing profiles(id)
ALTER TABLE IF EXISTS access_requests ADD CONSTRAINT access_requests_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.profiles(id);
ALTER TABLE IF EXISTS doctor_sessions ADD CONSTRAINT doctor_sessions_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.profiles(id);
ALTER TABLE IF EXISTS access_audit_logs ADD CONSTRAINT access_audit_logs_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.profiles(id);
