-- 1. Fix the Role Constraint to allow 'system_admin' and 'super_admin'
-- We drop the old check and add a new one that includes the new roles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('admin', 'teacher', 'student', 'parent', 'cashier', 'principal', 'system_admin', 'super_admin'));

-- 2. Create Secure Helper Functions (Bypasses RLS to avoid recursion)
CREATE OR REPLACE FUNCTION get_auth_school_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT school_id FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION is_system_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND (role = 'system_admin' OR role = 'super_admin')
  );
$$;

-- 3. Reset RLS Policies (Fixes Infinite Recursion)
DROP POLICY IF EXISTS "profiles_read_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "Users can see profiles from their school" ON profiles;
DROP POLICY IF EXISTS "view_same_school_profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "profiles_isolation_policy" ON profiles;

CREATE POLICY "profiles_read_policy" ON profiles
FOR SELECT USING (
  auth.uid() = id -- You can always see yourself
  OR
  (get_auth_school_id() IS NOT NULL AND school_id = get_auth_school_id()) -- You can see people in your school
  OR
  is_system_admin() -- Super Admins can see everyone
);

CREATE POLICY "profiles_update_policy" ON profiles
FOR UPDATE USING (
  auth.uid() = id -- You can update yourself
  OR
  is_system_admin() -- Super Admins can update everyone
);

CREATE POLICY "profiles_insert_policy" ON profiles
FOR INSERT WITH CHECK (
  auth.uid() = id
);

-- 4. Promote User to System Admin
-- We use a DO block to safely find the user ID from auth.users and update their profile
DO $$
DECLARE
  target_user_id UUID;
BEGIN
  SELECT id INTO target_user_id FROM auth.users WHERE email = 'maamefare7419@gmail.com';
  
  IF target_user_id IS NOT NULL THEN
    -- Update the profile role to 'system_admin' (which matches the frontend logic)
    UPDATE profiles 
    SET role = 'system_admin' 
    WHERE id = target_user_id;
  END IF;
END $$;
