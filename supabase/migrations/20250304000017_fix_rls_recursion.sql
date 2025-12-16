-- 1. Create a secure function to fetch the current user's school_id
-- SECURITY DEFINER ensures this runs with owner privileges, bypassing RLS to avoid recursion
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

-- 2. Drop the problematic recursive policies
-- We attempt to drop common names used in previous steps to ensure a clean slate
DROP POLICY IF EXISTS "Users can see profiles from their school" ON profiles;
DROP POLICY IF EXISTS "view_same_school_profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_isolation_policy" ON profiles;

-- 3. Create the new optimized policy
-- This allows users to see their own profile AND profiles of others in the same school
CREATE POLICY "view_same_school_profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid() -- Always allow reading own profile
  OR
  school_id = get_my_school_id() -- Safely check for same school
);

-- 4. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_my_school_id TO authenticated;
