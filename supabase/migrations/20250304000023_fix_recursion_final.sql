-- 1. Drop ALL existing policies on profiles to ensure a clean slate
DROP POLICY IF EXISTS "profiles_read_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "Users can see profiles from their school" ON profiles;
DROP POLICY IF EXISTS "view_same_school_profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "profiles_isolation_policy" ON profiles;
DROP POLICY IF EXISTS "allow_self_access" ON profiles;
DROP POLICY IF EXISTS "allow_school_read" ON profiles;
DROP POLICY IF EXISTS "allow_admin_access" ON profiles;

-- 2. Create Secure Helper Functions (Bypasses RLS to avoid recursion)
-- These functions run with "SECURITY DEFINER" which means they run with admin privileges
-- and don't trigger the RLS policies, breaking the infinite loop.

CREATE OR REPLACE FUNCTION get_school_id_safe()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT school_id FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION is_app_admin()
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

-- 3. Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create New Non-Recursive Policies

-- Policy A: You can always see/edit your own profile
CREATE POLICY "allow_self_access" ON profiles
FOR ALL
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Policy B: You can see profiles of people in your school (Read Only)
CREATE POLICY "allow_school_read" ON profiles
FOR SELECT
USING (
  school_id = get_school_id_safe()
);

-- Policy C: Super Admins can see and edit everything
CREATE POLICY "allow_admin_access" ON profiles
FOR ALL
USING (
  is_app_admin() = true
);

-- 5. Promote User to Super Admin
-- We use a subquery to find the ID from auth.users since profiles might not have email column in some versions
DO $$
DECLARE
  target_user_id UUID;
BEGIN
  SELECT id INTO target_user_id FROM auth.users WHERE email = 'maamefare7419@gmail.com';
  
  IF target_user_id IS NOT NULL THEN
    -- Ensure the role is allowed
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
      CHECK (role IN ('admin', 'teacher', 'student', 'parent', 'cashier', 'principal', 'system_admin'));

    -- Update the profile
    UPDATE profiles
    SET role = 'system_admin'
    WHERE id = target_user_id;
  END IF;
END $$;
