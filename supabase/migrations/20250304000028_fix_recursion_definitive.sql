-- 1. Create Secure Helper Functions (Bypasses RLS to avoid recursion)
-- These functions run with "security definer" meaning they bypass the user's restrictions
-- just for this specific lookup.

CREATE OR REPLACE FUNCTION get_my_school_id_v2()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT school_id FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION is_system_admin_v2()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'system_admin'
  );
$$;

-- 2. NUCLEAR OPTION: Drop ALL existing policies on profiles
-- This ensures we don't have any lingering broken policies causing loops
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
  END LOOP;
END $$;

-- 3. Create New Non-Recursive Policies

-- READ: Users can see themselves, people in their school, or if they are system admin
CREATE POLICY "profiles_read_policy_v2" ON profiles
FOR SELECT USING (
  auth.uid() = id -- Self
  OR
  (get_my_school_id_v2() IS NOT NULL AND school_id = get_my_school_id_v2()) -- Same School
  OR
  is_system_admin_v2() -- System Admin
);

-- UPDATE: Users can update themselves, System Admins can update anyone
CREATE POLICY "profiles_update_policy_v2" ON profiles
FOR UPDATE USING (
  auth.uid() = id
  OR
  is_system_admin_v2()
);

-- INSERT: Users can insert their own profile
CREATE POLICY "profiles_insert_policy_v2" ON profiles
FOR INSERT WITH CHECK (
  auth.uid() = id
);

-- 4. Promote Specific User to System Admin
UPDATE profiles
SET role = 'system_admin'
WHERE id = '7cfc2d4f-33ec-41af-a5c2-61dce72a24a8';

-- 5. Ensure System Admin can see everything (Schools, etc)
DROP POLICY IF EXISTS "schools_read_policy" ON schools;
CREATE POLICY "schools_read_policy" ON schools
FOR SELECT USING (
  is_system_admin_v2() -- System Admin sees all
  OR
  id = get_my_school_id_v2() -- Users see their own school
);
