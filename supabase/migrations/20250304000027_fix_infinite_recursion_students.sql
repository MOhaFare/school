-- 1. Create Secure Helper Functions (Bypasses RLS to avoid recursion)
-- This function gets the current user's school_id without triggering RLS
CREATE OR REPLACE FUNCTION get_auth_school_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT school_id FROM profiles WHERE id = auth.uid();
$$;

-- This function checks if user is system admin without triggering RLS
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

-- 2. Reset Profiles RLS Policies (Drop ALL potential conflicting policies)
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

-- 3. Create New Non-Recursive Policies for Profiles
-- Uses the secure functions to avoid the loop
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

-- 4. Fix Students Table Policies (Ensure they use the secure function)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "students_read_policy" ON students;
DROP POLICY IF EXISTS "students_write_policy" ON students;
DROP POLICY IF EXISTS "students_isolation_policy" ON students;

CREATE POLICY "students_read_policy" ON students
FOR SELECT USING (
  school_id = get_auth_school_id() -- Use secure function
  OR
  is_system_admin()
);

CREATE POLICY "students_write_policy" ON students
FOR ALL USING (
  school_id = get_auth_school_id()
  OR
  is_system_admin()
);

-- 5. Fix Teachers Table Policies
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "teachers_read_policy" ON teachers;
DROP POLICY IF EXISTS "teachers_write_policy" ON teachers;

CREATE POLICY "teachers_read_policy" ON teachers
FOR SELECT USING (
  school_id = get_auth_school_id()
  OR
  is_system_admin()
);

CREATE POLICY "teachers_write_policy" ON teachers
FOR ALL USING (
  school_id = get_auth_school_id()
  OR
  is_system_admin()
);

-- 6. Grant execute permissions
GRANT EXECUTE ON FUNCTION get_auth_school_id TO authenticated;
GRANT EXECUTE ON FUNCTION is_system_admin TO authenticated;
GRANT EXECUTE ON FUNCTION get_auth_school_id TO service_role;
GRANT EXECUTE ON FUNCTION is_system_admin TO service_role;
