-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.allergies (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  severity text DEFAULT 'medium'::text CHECK (severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  allergen text NOT NULL,
  reaction text,
  CONSTRAINT allergies_pkey PRIMARY KEY (id),
  CONSTRAINT allergies_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.chronic_conditions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  diagnosed_date date,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  condition_name text NOT NULL,
  CONSTRAINT chronic_conditions_pkey PRIMARY KEY (id),
  CONSTRAINT chronic_conditions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.documents (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  document_type text DEFAULT 'other'::text CHECK (document_type = ANY (ARRAY['lab_result'::text, 'prescription'::text, 'imaging'::text, 'insurance'::text, 'vaccination'::text, 'discharge_summary'::text, 'other'::text])),
  notes text,
  uploaded_at timestamp with time zone DEFAULT now(),
  title text NOT NULL,
  CONSTRAINT documents_pkey PRIMARY KEY (id),
  CONSTRAINT documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.emergency_contacts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  relation text,
  is_primary boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT emergency_contacts_pkey PRIMARY KEY (id),
  CONSTRAINT emergency_contacts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.family_history (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  relation text NOT NULL,
  condition text NOT NULL,
  age_of_onset integer,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  relationship text NOT NULL,
  CONSTRAINT family_history_pkey PRIMARY KEY (id),
  CONSTRAINT family_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.health_entries (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  entry_type text NOT NULL CHECK (entry_type = ANY (ARRAY['condition'::text, 'medication'::text, 'allergy'::text, 'surgery'::text, 'appointment'::text, 'lab_result'::text, 'vaccination'::text, 'weight'::text, 'blood_pressure'::text, 'heart_rate'::text, 'temperature'::text, 'blood_sugar'::text])),
  title text DEFAULT 'Health Entry'::text,
  description text,
  entry_date date DEFAULT CURRENT_DATE,
  end_date date,
  severity text CHECK (severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])),
  is_recurring boolean DEFAULT false,
  recurrence_pattern text,
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'resolved'::text, 'ongoing'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  notes text,
  value numeric,
  unit text DEFAULT 'lbs'::text,
  recorded_at timestamp with time zone DEFAULT now(),
  temperature numeric,
  blood_sugar numeric,
  CONSTRAINT health_entries_pkey PRIMARY KEY (id),
  CONSTRAINT health_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.medications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  dosage text,
  frequency text,
  start_date date,
  end_date date,
  prescribed_by text,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT medications_pkey PRIMARY KEY (id),
  CONSTRAINT medications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL,
  full_name text,
  blood_group text,
  date_of_birth date,
  phone text,
  address text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  blood_type text,
  height_cm numeric,
  weight_kg numeric,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_settings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE,
  theme text DEFAULT 'light'::text,
  notifications_enabled boolean DEFAULT true,
  email_notifications boolean DEFAULT true,
  data_sharing_consent boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_settings_pkey PRIMARY KEY (id),
  CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);