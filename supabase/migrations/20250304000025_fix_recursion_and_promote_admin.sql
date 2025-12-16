-- 1. Create Secure Functions (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION get_my_claim_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION get_my_claim_school_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT school_id FROM profiles WHERE id = auth.uid();
$$;

-- 2. Drop ALL existing policies on profiles to clean the slate
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
DROP POLICY IF EXISTS "profiles_read_policy_final" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy_final" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy_final" ON profiles;

-- 3. Create NEW Non-Recursive Policies
-- Read Policy
CREATE POLICY "profiles_read_policy_final" ON profiles
FOR SELECT USING (
  auth.uid() = id -- User can see themselves
  OR
  get_my_claim_role() = 'system_admin' -- Super Admin can see everyone
  OR
  (get_my_claim_school_id() IS NOT NULL AND school_id = get_my_claim_school_id()) -- School isolation
);

-- Update Policy
CREATE POLICY "profiles_update_policy_final" ON profiles
FOR UPDATE USING (
  auth.uid() = id -- User can update themselves
  OR
  get_my_claim_role() = 'system_admin' -- Super Admin can update everyone
);

-- Insert Policy
CREATE POLICY "profiles_insert_policy_final" ON profiles
FOR INSERT WITH CHECK (
  auth.uid() = id
);

-- 4. Ensure role column allows 'system_admin'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('admin', 'teacher', 'student', 'parent', 'cashier', 'principal', 'system_admin'));

-- 5. Promote User to System Admin
UPDATE profiles
SET role = 'system_admin'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'maamefare7419@gmail.com');
