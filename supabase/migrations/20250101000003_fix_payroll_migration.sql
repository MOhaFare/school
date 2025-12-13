/*
          # [Fix] Create Payrolls Table
          This script creates the 'payrolls' table and its associated 'payroll_status' type. It has been updated to be idempotent, meaning it can be run multiple times without causing errors. It will only create the 'payroll_status' type if it does not already exist.

          ## Query Description: [This script will create the `payrolls` table. It checks if the `payroll_status` type exists before creating it to prevent errors on re-runs. No data will be lost.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [false]
          
          ## Structure Details:
          - Tables affected: `payrolls`
          - Types affected: `payroll_status`
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [Yes]
          - Auth Requirements: [Authenticated users with 'admin' role for full access]
          
          ## Performance Impact:
          - Indexes: [Primary key index on `id`]
          - Triggers: [None]
          - Estimated Impact: [Low]
          */

-- Create payroll_status enum type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payroll_status') THEN
        CREATE TYPE public.payroll_status AS ENUM ('paid', 'pending', 'processing');
    END IF;
END$$;

-- Create payrolls table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.payrolls (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    teacher_id uuid NOT NULL,
    teacher_name character varying NOT NULL,
    month character varying NOT NULL,
    year smallint NOT NULL,
    base_salary numeric NOT NULL,
    bonus numeric DEFAULT 0,
    deductions numeric DEFAULT 0,
    net_salary numeric NOT NULL,
    status public.payroll_status NOT NULL,
    paid_date date,
    CONSTRAINT payrolls_pkey PRIMARY KEY (id),
    CONSTRAINT payrolls_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers (id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.payrolls ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts, then recreate them
DROP POLICY IF EXISTS "Allow authenticated users to view payrolls" ON public.payrolls;
CREATE POLICY "Allow authenticated users to view payrolls" ON public.payrolls
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Allow admin users to manage payrolls" ON public.payrolls;
CREATE POLICY "Allow admin users to manage payrolls" ON public.payrolls
AS PERMISSIVE FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
