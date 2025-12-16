-- 1. Create a secure function to fetch the current user's school_id
-- This bypasses RLS to prevent infinite recursion
CREATE OR REPLACE FUNCTION get_auth_school_id()
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

-- 2. Create a secure function to check if the user is a system admin
CREATE OR REPLACE FUNCTION is_system_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  SELECT (role = 'system_admin' OR role = 'super_admin') INTO is_admin
  FROM profiles
  WHERE id = auth.uid();
  
  RETURN COALESCE(is_admin, false);
END;
$$;

-- 3. Grant execute permissions
GRANT EXECUTE ON FUNCTION get_auth_school_id TO authenticated;
GRANT EXECUTE ON FUNCTION is_system_admin TO authenticated;

-- 4. STRICT RLS FOR STUDENTS TABLE
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "students_isolation_policy" ON students;
DROP POLICY IF EXISTS "school_isolation_policy" ON students;
DROP POLICY IF EXISTS "student_isolation" ON students;
DROP POLICY IF EXISTS "Students are viewable by school" ON students;

-- Create the strict policy
CREATE POLICY "students_strict_isolation" ON students
FOR ALL
TO authenticated
USING (
  -- User can see students if they belong to the same school
  school_id = get_auth_school_id() 
  OR 
  -- OR if the user is a system admin
  is_system_admin()
)
WITH CHECK (
  -- User can modify students if they belong to the same school
  school_id = get_auth_school_id() 
  OR 
  -- OR if the user is a system admin
  is_system_admin()
);

-- 5. STRICT RLS FOR TEACHERS TABLE
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "teachers_strict_isolation" ON teachers;

CREATE POLICY "teachers_strict_isolation" ON teachers
FOR ALL
TO authenticated
USING (
  school_id = get_auth_school_id() OR is_system_admin()
)
WITH CHECK (
  school_id = get_auth_school_id() OR is_system_admin()
);

-- 6. STRICT RLS FOR SCHOOLS TABLE
-- Ensure School Admins can ONLY see their own school
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "schools_strict_isolation" ON schools;

CREATE POLICY "schools_strict_isolation" ON schools
FOR ALL
TO authenticated
USING (
  id = get_auth_school_id() OR is_system_admin()
)
WITH CHECK (
  id = get_auth_school_id() OR is_system_admin()
);
