-- Migration: Fix doctor_id foreign key constraints
-- Run this in Supabase SQL Editor to fix the FK references from doctors table to profiles table

-- Drop existing foreign key constraints that reference the doctors table
ALTER TABLE IF EXISTS access_requests DROP CONSTRAINT IF EXISTS access_requests_doctor_id_fkey;
ALTER TABLE IF EXISTS doctor_sessions DROP CONSTRAINT IF EXISTS doctor_sessions_doctor_id_fkey;
ALTER TABLE IF EXISTS access_audit_logs DROP CONSTRAINT IF EXISTS access_audit_logs_doctor_id_fkey;

-- Add new foreign key constraints referencing profiles(id)
ALTER TABLE IF EXISTS access_requests ADD CONSTRAINT access_requests_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.profiles(id);
ALTER TABLE IF EXISTS doctor_sessions ADD CONSTRAINT doctor_sessions_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.profiles(id);
ALTER TABLE IF EXISTS access_audit_logs ADD CONSTRAINT access_audit_logs_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.profiles(id);
