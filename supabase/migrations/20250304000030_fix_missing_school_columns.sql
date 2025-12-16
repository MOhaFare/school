/*
  # Fix Missing School ID Columns and Apply Isolation
  
  1. Checks for existence of school_id column on all app tables.
  2. Adds the column if missing.
  3. Re-applies the strict RLS policies.
*/

DO $$
DECLARE
    t text;
    -- List of all tables that need multi-tenancy
    tables text[] := ARRAY[
        'payrolls', 'leaves', 'staff_attendance', 'subject_groups', 
        'fee_masters', 'inventory_items', 'inventory_issues', 
        'library_books', 'library_issues', 'transport_vehicles', 
        'hostel_rooms', 'admission_enquiries', 'visitors', 
        'complaints', 'postal_records', 'contents', 
        'lesson_plans', 'alumni_events', 'notices', 'events',
        'classes', 'sections', 'courses', 'exams', 'grades',
        'students', 'teachers', 'fees', 'incomes', 'expenses'
    ];
BEGIN
    -- 1. Ensure the secure functions exist (just in case)
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_auth_school_id') THEN
        CREATE OR REPLACE FUNCTION get_auth_school_id()
        RETURNS UUID
        LANGUAGE sql
        SECURITY DEFINER
        SET search_path = public
        STABLE
        AS $func$
          SELECT school_id FROM profiles WHERE id = auth.uid();
        $func$;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_system_admin') THEN
        CREATE OR REPLACE FUNCTION is_system_admin()
        RETURNS BOOLEAN
        LANGUAGE sql
        SECURITY DEFINER
        SET search_path = public
        STABLE
        AS $func$
          SELECT EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'system_admin'
          );
        $func$;
    END IF;

    -- 2. Iterate through tables to add column and policies
    FOREACH t IN ARRAY tables LOOP
        -- Check if table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t AND table_schema = 'public') THEN
            
            -- Add school_id column if missing
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t AND column_name = 'school_id') THEN
                EXECUTE format('ALTER TABLE %I ADD COLUMN school_id UUID REFERENCES schools(id)', t);
                RAISE NOTICE 'Added school_id to %', t;
            END IF;
            
            -- Enable RLS
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
            
            -- Drop existing policies to avoid conflicts (clean slate)
            EXECUTE format('DROP POLICY IF EXISTS "school_isolation_select" ON %I', t);
            EXECUTE format('DROP POLICY IF EXISTS "school_isolation_insert" ON %I', t);
            EXECUTE format('DROP POLICY IF EXISTS "school_isolation_update" ON %I', t);
            EXECUTE format('DROP POLICY IF EXISTS "school_isolation_delete" ON %I', t);
            EXECUTE format('DROP POLICY IF EXISTS "school_isolation_all" ON %I', t);
            EXECUTE format('DROP POLICY IF EXISTS "Enable read access for all users" ON %I', t);
            EXECUTE format('DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON %I', t);
            
            -- Create unified strict policy
            -- Users see data if:
            -- 1. It belongs to their school (school_id match)
            -- 2. OR they are a system admin
            -- 3. OR the record has no school_id (legacy data - viewable by all or handled separately, here we allow view)
            EXECUTE format('
                CREATE POLICY "school_isolation_all" ON %I
                FOR ALL
                USING (
                    school_id = get_auth_school_id() 
                    OR is_system_admin()
                    OR school_id IS NULL
                )
                WITH CHECK (
                    school_id = get_auth_school_id() 
                    OR is_system_admin()
                )
            ', t);
            
            -- Create/Update trigger for auto-assigning school_id on INSERT
            EXECUTE format('DROP TRIGGER IF EXISTS set_school_id_trigger ON %I', t);
            EXECUTE format('
                CREATE TRIGGER set_school_id_trigger
                BEFORE INSERT ON %I
                FOR EACH ROW
                EXECUTE FUNCTION set_school_id()
            ', t);
            
        END IF;
    END LOOP;
END $$;

-- 3. Ensure System Admin Access
UPDATE profiles 
SET role = 'system_admin' 
WHERE id = '7cfc2d4f-33ec-41af-a5c2-61dce72a24a8';
