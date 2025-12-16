-- 1. Create Secure Helper Functions (Bypasses RLS to avoid recursion)
-- These functions run with "SECURITY DEFINER" privileges, meaning they don't trigger the RLS check on themselves.

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

-- 2. Reset & Apply Policies for PROFILES (The source of recursion)
DROP POLICY IF EXISTS "profiles_read_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "Users can see profiles from their school" ON profiles;
DROP POLICY IF EXISTS "view_same_school_profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_isolation_policy" ON profiles;

CREATE POLICY "profiles_isolation_policy" ON profiles
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

-- 3. Apply Strict Isolation to Other Tables
-- We use a macro-like approach to apply the same logic to all tables

-- List of tables to secure
-- students, teachers, classes, sections, subjects, exams, grades, fees, attendance, notices, events, library_books, transport_vehicles, hostel_rooms

-- Helper to drop and recreate policy for a table
DO $$
DECLARE
  tables text[] := ARRAY[
    'students', 'teachers', 'classes', 'sections', 'courses', 
    'exams', 'grades', 'fees', 'attendance', 'notices', 'events', 
    'library_books', 'transport_vehicles', 'hostel_rooms', 
    'payrolls', 'incomes', 'expenses', 'inventory_items', 'leaves'
  ];
  t text;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    -- Enable RLS
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    
    -- Drop existing policies to avoid conflicts
    EXECUTE format('DROP POLICY IF EXISTS "school_isolation_select" ON %I', t);
    EXECUTE format('DROP POLICY IF EXISTS "school_isolation_all" ON %I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Enable read access for users in same school" ON %I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Enable insert for users in same school" ON %I', t);
    
    -- Create new strict policy
    -- Users can only see/edit rows where school_id matches their own
    EXECUTE format('
      CREATE POLICY "school_isolation_all" ON %I
      FOR ALL
      USING (
        (school_id = get_auth_school_id()) OR is_system_admin()
      )
      WITH CHECK (
        (school_id = get_auth_school_id()) OR is_system_admin()
      )
    ', t);
  END LOOP;
END $$;

-- 4. Ensure System Admin Access
-- Explicitly set the user provided as system admin
UPDATE profiles
SET role = 'system_admin'
WHERE id = '7cfc2d4f-33ec-41af-a5c2-61dce72a24a8';
