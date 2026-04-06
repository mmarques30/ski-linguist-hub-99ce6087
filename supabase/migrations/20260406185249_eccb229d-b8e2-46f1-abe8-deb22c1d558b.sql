
-- Add 'student' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'student';

-- Add auth_user_id to students table
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE;

-- Create index for fast lookup
CREATE INDEX IF NOT EXISTS idx_students_auth_user_id ON public.students(auth_user_id);
