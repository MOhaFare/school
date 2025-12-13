/*
  # Create Payrolls Table and Policies
  This migration creates the 'payrolls' table and sets up its security policies. This fixes a previous omission where the table was not created.

  ## Query Description: [This script adds the missing 'payrolls' table required for managing teacher salaries. It also enables Row Level Security to ensure data is protected.]

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (by dropping the table and type)

  ## Structure Details:
  - Creates enum type 'payroll_status'.
  - Creates table 'payrolls' with columns: id, created_at, teacher_id, teacher_name, month, year, base_salary, bonus, deductions, net_salary, status, paid_date.
  - Adds a foreign key constraint from 'payrolls.teacher_id' to 'teachers.id'.

  ## Security Implications:
  - RLS Status: Enabled
  - Policy Changes: Yes, adds policies for SELECT, INSERT, UPDATE, DELETE for authenticated users.
  - Auth Requirements: Authenticated user role.
*/

-- 1. Create payroll status enum type
CREATE TYPE public.payroll_status AS ENUM (
    'paid',
    'pending',
    'processing'
);

-- 2. Create the payrolls table
CREATE TABLE public.payrolls (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    teacher_id uuid NOT NULL,
    teacher_name text NOT NULL,
    month text NOT NULL,
    year integer NOT NULL,
    base_salary numeric NOT NULL,
    bonus numeric NOT NULL DEFAULT 0,
    deductions numeric NOT NULL DEFAULT 0,
    net_salary numeric NOT NULL,
    status public.payroll_status NOT NULL DEFAULT 'pending'::public.payroll_status,
    paid_date date NULL,
    CONSTRAINT payrolls_pkey PRIMARY KEY (id),
    CONSTRAINT payrolls_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE
);

-- 3. Enable Row Level Security
ALTER TABLE public.payrolls ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
CREATE POLICY "Allow authenticated users to view payrolls"
ON public.payrolls
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert payrolls"
ON public.payrolls
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update payrolls"
ON public.payrolls
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete payrolls"
ON public.payrolls
FOR DELETE
TO authenticated
USING (true);
