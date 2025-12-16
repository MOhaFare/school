-- Final Isolation Check & Cleanup
-- This script ensures no data is left "homeless" (NULL school_id) which would make it invisible to School Admins.

DO $$
DECLARE
  target_school_id UUID := '78bdc42c-e7c7-45f7-ae78-41e2e934f39b'; -- Your main school ID
  table_name text;
BEGIN
  -- 1. Ensure the target school exists
  INSERT INTO schools (id, name, subscription_plan, is_active)
  VALUES (target_school_id, 'Default School', 'pro', true)
  ON CONFLICT (id) DO NOTHING;

  -- 2. Iterate through all tables with a school_id column
  FOR table_name IN 
    SELECT t.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables t ON c.table_name = t.table_name
    WHERE c.column_name = 'school_id' 
      AND t.table_schema = 'public' 
      AND t.table_type = 'BASE TABLE'
  LOOP
    -- Assign NULL school_id records to the target school
    EXECUTE format('UPDATE %I SET school_id = %L WHERE school_id IS NULL', table_name, target_school_id);
    
    -- Force Enable RLS if not already enabled
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
  END LOOP;

  -- 3. Re-verify Profiles RLS (Crucial for login)
  DROP POLICY IF EXISTS "profiles_isolation_policy" ON profiles;
  CREATE POLICY "profiles_isolation_policy" ON profiles
  FOR ALL USING (
    id = auth.uid() -- Can always see self
    OR
    (school_id = get_auth_school_id()) -- Can see same school
    OR
    is_system_admin() -- Super admin sees all
  );

END $$;
