-- 1. Create Secure Helper Functions (Bypasses RLS to avoid recursion)
-- These functions run with "SECURITY DEFINER" (owner privileges) to break the loop
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
    WHERE id = auth.uid() AND role = 'system_admin'
  );
$$;

-- 2. Reset Profiles RLS Policies (Drop ALL existing ones to be safe)
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

-- 3. Create New Non-Recursive Policies
-- Read: You can see yourself, people in your school, or everyone if you are super admin
CREATE POLICY "profiles_read_policy" ON profiles
FOR SELECT USING (
  auth.uid() = id 
  OR
  (get_auth_school_id() IS NOT NULL AND school_id = get_auth_school_id())
  OR
  is_system_admin()
);

-- Update: You can update yourself, or Super Admin can update anyone
CREATE POLICY "profiles_update_policy" ON profiles
FOR UPDATE USING (
  auth.uid() = id
  OR
  is_system_admin()
);

-- Insert: Anyone can insert their own profile (needed for signup)
CREATE POLICY "profiles_insert_policy" ON profiles
FOR INSERT WITH CHECK (
  auth.uid() = id
);

-- 4. Promote User to Super Admin
DO $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Find the user ID from the auth.users table using the email
  SELECT id INTO target_user_id FROM auth.users WHERE email = 'maamefare7419@gmail.com';
  
  IF target_user_id IS NOT NULL THEN
    -- Update the profile in the public schema
    UPDATE public.profiles
    SET role = 'system_admin'
    WHERE id = target_user_id;
  END IF;
END $$;
