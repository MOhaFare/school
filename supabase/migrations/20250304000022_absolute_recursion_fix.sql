-- 1. Drop ALL existing policies on profiles to ensure a clean slate
-- We use DO block to handle potential missing policies gracefully
DO $$ 
BEGIN
    -- Drop policies if they exist (using common names from previous attempts)
    DROP POLICY IF EXISTS "profiles_read_policy" ON profiles;
    DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
    DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
    DROP POLICY IF EXISTS "Users can see profiles from their school" ON profiles;
    DROP POLICY IF EXISTS "view_same_school_profiles" ON profiles;
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
    DROP POLICY IF EXISTS "profiles_isolation_policy" ON profiles;
    DROP POLICY IF EXISTS "profiles_read_policy_v2" ON profiles;
    DROP POLICY IF EXISTS "profiles_update_policy_v2" ON profiles;
    DROP POLICY IF EXISTS "profiles_insert_policy_v2" ON profiles;
END $$;

-- 2. Create Secure Helper Functions (Bypasses RLS to avoid recursion)
-- These run with 'SECURITY DEFINER' which means they run with the permissions of the creator (postgres/admin)
-- rather than the user calling them, bypassing the infinite loop.

CREATE OR REPLACE FUNCTION get_auth_school_id_v2()
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

-- 3. Create New Non-Recursive Policies

-- READ: Users can see themselves, people in their school, or if they are super admin
CREATE POLICY "profiles_read_policy_final" ON profiles
FOR SELECT USING (
  auth.uid() = id -- You can always see yourself
  OR
  (get_auth_school_id_v2() IS NOT NULL AND school_id = get_auth_school_id_v2()) -- You can see people in your school
  OR
  is_system_admin_v2() -- Super Admins can see everyone
);

-- UPDATE: Users can update themselves, Super Admins can update everyone
CREATE POLICY "profiles_update_policy_final" ON profiles
FOR UPDATE USING (
  auth.uid() = id -- You can update yourself
  OR
  is_system_admin_v2() -- Super Admins can update everyone
);

-- INSERT: Users can insert their own profile (on signup)
CREATE POLICY "profiles_insert_policy_final" ON profiles
FOR INSERT WITH CHECK (
  auth.uid() = id
);

-- 4. Promote User to Super Admin
-- We look up the ID from auth.users because profiles might not have the email column or correct mapping
DO $$
DECLARE
  target_user_id UUID;
BEGIN
  SELECT id INTO target_user_id FROM auth.users WHERE email = 'maamefare7419@gmail.com';
  
  IF target_user_id IS NOT NULL THEN
    -- Ensure role constraint allows system_admin
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
      CHECK (role IN ('admin', 'teacher', 'student', 'parent', 'cashier', 'principal', 'system_admin'));

    -- Update the profile
    UPDATE profiles
    SET role = 'system_admin'
    WHERE id = target_user_id;
  END IF;
END $$;
