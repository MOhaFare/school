/*
# [Fix] RLS Policies for `classes` table
This migration script fixes the Row Level Security (RLS) policies for the `classes` table to resolve "violates row-level security policy" errors. It ensures that only administrators can create, update, or delete classes, while all authenticated users can view them.

## Query Description: [This operation updates security policies. It drops any existing policies on the `classes` table and recreates them with the correct permissions. This change is critical for the proper functioning of the class management module.]

## Metadata:
- Schema-Category: "Security"
- Impact-Level: "Medium"
- Requires-Backup: false
- Reversible: true (by restoring previous policies if known)

## Structure Details:
- Affects table: `public.classes`
- Policies created:
  - "Enable read access for all authenticated users" (SELECT)
  - "Allow admins to insert classes" (INSERT)
  - "Allow admins to update classes" (UPDATE)
  - "Allow admins to delete classes" (DELETE)

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes
- Auth Requirements: Policies are based on the user's role ('admin') stored in the `public.profiles` table.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Low. RLS policy checks have a minor overhead on queries.
*/

-- Ensure RLS is enabled on the classes table
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON public.classes;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.classes;
DROP POLICY IF EXISTS "Allow admins to insert classes" ON public.classes;
DROP POLICY IF EXISTS "Allow admins to update classes" ON public.classes;
DROP POLICY IF EXISTS "Allow admins to delete classes" ON public.classes;


-- Create new, correct policies

-- 1. SELECT Policy: All authenticated users can view classes.
CREATE POLICY "Enable read access for all authenticated users"
ON public.classes
FOR SELECT
TO authenticated
USING (true);

-- 2. INSERT Policy: Only users with the 'admin' role can insert new classes.
CREATE POLICY "Allow admins to insert classes"
ON public.classes
FOR INSERT
TO authenticated
WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'::text);

-- 3. UPDATE Policy: Only users with the 'admin' role can update existing classes.
CREATE POLICY "Allow admins to update classes"
ON public.classes
FOR UPDATE
TO authenticated
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'::text)
WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'::text);

-- 4. DELETE Policy: Only users with the 'admin' role can delete classes.
CREATE POLICY "Allow admins to delete classes"
ON public.classes
FOR DELETE
TO authenticated
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'::text);
