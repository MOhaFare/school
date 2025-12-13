--
-- Fix for Class RLS Policies
-- This script removes any conflicting policies on the 'classes' table
-- and recreates them correctly. It is safe to run multiple times.
--

-- Step 1: Drop existing policies to prevent "already exists" errors.
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.classes;
DROP POLICY IF EXISTS "Enable insert access for admins" ON public.classes;
DROP POLICY IF EXISTS "Enable update access for admins" ON public.classes;
DROP POLICY IF EXISTS "Enable delete access for admins" ON public.classes;

-- Step 2: Ensure RLS is enabled on the table.
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Step 3: Create the correct policies for the 'classes' table.

-- Policy 1: Allow all authenticated users to view classes.
CREATE POLICY "Enable read access for all authenticated users"
ON public.classes
FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Allow only admins to insert new classes.
CREATE POLICY "Enable insert access for admins"
ON public.classes
FOR INSERT
TO authenticated
WITH CHECK ((get_my_claim('role'::text) = '"admin"'::jsonb));

-- Policy 3: Allow only admins to update existing classes.
CREATE POLICY "Enable update access for admins"
ON public.classes
FOR UPDATE
TO authenticated
USING ((get_my_claim('role'::text) = '"admin"'::jsonb));

-- Policy 4: Allow only admins to delete classes.
CREATE POLICY "Enable delete access for admins"
ON public.classes
FOR DELETE
TO authenticated
USING ((get_my_claim('role'::text) = '"admin"'::jsonb));
