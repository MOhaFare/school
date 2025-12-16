-- 1. Redefine Secure Functions (Critical for breaking recursion)
CREATE OR REPLACE FUNCTION get_auth_school_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER -- Runs with owner permissions, bypassing RLS
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

-- 2. Lockdown 'schools' table
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "schools_isolation_policy" ON schools;
DROP POLICY IF EXISTS "schools_access_policy" ON schools;
DROP POLICY IF EXISTS "public_schools_policy" ON schools;

CREATE POLICY "schools_isolation_policy" ON schools
FOR ALL
USING (
  id = get_auth_school_id() -- School Admin sees ONLY their own school
  OR 
  is_system_admin() -- System Admin sees ALL schools
);

-- 3. Lockdown 'profiles' table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_isolation_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_read_policy" ON profiles;
DROP POLICY IF EXISTS "view_same_school_profiles" ON profiles;

CREATE POLICY "profiles_isolation_policy" ON profiles
FOR ALL
USING (
  id = auth.uid() -- Can always see self
  OR
  school_id = get_auth_school_id() -- Can see others in same school
  OR
  is_system_admin() -- System Admin sees all
);

-- 4. Dynamic Lockdown for ALL Data Tables
-- This block finds every table with a 'school_id' column and applies the strict policy
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN 
    SELECT table_name 
    FROM information_schema.columns 
    WHERE column_name = 'school_id' 
    AND table_schema = 'public' 
    AND table_name NOT IN ('profiles', 'schools') -- Handled above
  LOOP
    -- Enable RLS
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
    
    -- Drop old loose policies
    EXECUTE format('DROP POLICY IF EXISTS "school_isolation_policy" ON %I;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "tenant_isolation" ON %I;', tbl);
    
    -- Create strict policy
    EXECUTE format('
      CREATE POLICY "school_isolation_policy" ON %I
      FOR ALL
      USING (
        school_id = get_auth_school_id() OR is_system_admin()
      )
      WITH CHECK (
        school_id = get_auth_school_id() OR is_system_admin()
      );
    ', tbl);
    
    RAISE NOTICE 'Secured table: %', tbl;
  END LOOP;
END $$;

-- 5. Ensure System Admin Access (Safety Net)
UPDATE profiles 
SET role = 'system_admin' 
WHERE id = '7cfc2d4f-33ec-41af-a5c2-61dce72a24a8';
