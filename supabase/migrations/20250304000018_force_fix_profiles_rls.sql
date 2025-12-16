-- Force Fix for Infinite Recursion on Profiles Table
-- This script dynamically drops ALL existing policies on the profiles table to ensure a clean slate

BEGIN;

-- 1. Create the secure function to bypass RLS (if it doesn't exist or needs update)
CREATE OR REPLACE FUNCTION get_my_school_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  my_school_id UUID;
BEGIN
  SELECT school_id INTO my_school_id
  FROM profiles
  WHERE id = auth.uid();
  
  RETURN my_school_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_my_school_id TO authenticated;

-- 2. Dynamically drop ALL policies on the profiles table
DO $$ 
DECLARE 
  pol record; 
BEGIN 
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' 
  LOOP 
    EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname); 
  END LOOP; 
END $$;

-- 3. Re-enable RLS (just in case)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create clean, non-recursive policies

-- Policy 1: Users can see their own profile AND profiles from the same school
-- We use the SECURITY DEFINER function get_my_school_id() to avoid the recursion loop
CREATE POLICY "profiles_view_policy"
ON profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid() -- Always see self
  OR
  school_id = get_my_school_id() -- See others in same school (safe check)
  OR
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'system_admin' -- Super admin sees all
);

-- Policy 2: Users can update their own profile
CREATE POLICY "profiles_update_policy"
ON profiles
FOR UPDATE
TO authenticated
USING ( id = auth.uid() );

-- Policy 3: Allow insertion (needed for signup triggers/service role)
CREATE POLICY "profiles_insert_policy"
ON profiles
FOR INSERT
TO authenticated, service_role
WITH CHECK (true);

COMMIT;
