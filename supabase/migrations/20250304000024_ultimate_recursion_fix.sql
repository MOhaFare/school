-- 1. Create Secure Helper Functions (Bypasses RLS to avoid recursion)
-- These functions run as the database owner, ignoring RLS policies
CREATE OR REPLACE FUNCTION get_auth_school_id_v2()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT school_id FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION get_auth_role_v2()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- 2. Reset Profiles RLS Policies (Drop ALL previous attempts)
DROP POLICY IF EXISTS "profiles_read_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "Users can see profiles from their school" ON profiles;
DROP POLICY IF EXISTS "view_same_school_profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "profiles_isolation_policy" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;
DROP POLICY IF EXISTS "profiles_read_policy_v2" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy_v2" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy_v2" ON profiles;

-- 3. Create New Non-Recursive Policies
-- Read: You can see yourself, people in your school, or everyone if you are system_admin
CREATE POLICY "profiles_read_policy_v3" ON profiles
FOR SELECT USING (
  auth.uid() = id 
  OR
  (get_auth_school_id_v2() IS NOT NULL AND school_id = get_auth_school_id_v2())
  OR
  get_auth_role_v2() = 'system_admin'
);

-- Update: You can update yourself, or system_admin can update anyone
CREATE POLICY "profiles_update_policy_v3" ON profiles
FOR UPDATE USING (
  auth.uid() = id
  OR
  get_auth_role_v2() = 'system_admin'
);

-- Insert: Anyone can insert their own profile (during signup)
CREATE POLICY "profiles_insert_policy_v3" ON profiles
FOR INSERT WITH CHECK (
  auth.uid() = id
);

-- 4. Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 5. Promote User to Super Admin (Safe update using auth.users lookup)
UPDATE profiles
SET role = 'system_admin'
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'maamefare7419@gmail.com'
);
