/*
  # Fix Classes RLS Policies
  
  ## Query Description:
  This query resets the Row Level Security (RLS) policies for the 'classes' table.
  It ensures that:
  1. All authenticated users (Admins, Teachers, Students) can VIEW classes.
  2. Only Admins can INSERT, UPDATE, or DELETE classes.
  
  This fixes the "new row violates row-level security policy" error.
  
  ## Metadata:
  - Schema-Category: Security
  - Impact-Level: Low (Permissions only)
  - Requires-Backup: false
  - Reversible: true
*/

-- Enable RLS on classes table (just in case)
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Remove any existing conflicting policies to start fresh
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.classes;
DROP POLICY IF EXISTS "Enable insert for admins" ON public.classes;
DROP POLICY IF EXISTS "Enable update for admins" ON public.classes;
DROP POLICY IF EXISTS "Enable delete for admins" ON public.classes;
DROP POLICY IF EXISTS "Enable all for admins" ON public.classes;
DROP POLICY IF EXISTS "Allow read access" ON public.classes;
DROP POLICY IF EXISTS "Allow write access" ON public.classes;

-- Policy 1: READ access for everyone (Students need to know their class, Teachers need to see classes)
CREATE POLICY "Enable read access for all authenticated users"
ON public.classes FOR SELECT
TO authenticated
USING (true);

-- Policy 2: INSERT access for Admins only
CREATE POLICY "Enable insert for admins"
ON public.classes FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy 3: UPDATE access for Admins only
CREATE POLICY "Enable update for admins"
ON public.classes FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy 4: DELETE access for Admins only
CREATE POLICY "Enable delete for admins"
ON public.classes FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
