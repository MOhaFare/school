/*
  # Create Alumni Events and Fix Data Assignment
  
  1. Create `alumni_events` table if missing.
  2. Add `school_id` to it.
  3. Enable RLS.
  4. Assign all data to school '78bdc42c-e7c7-45f7-ae78-41e2e934f39b'.
*/

-- 1. Create alumni_events table
CREATE TABLE IF NOT EXISTS public.alumni_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    title TEXT NOT NULL,
    event_date DATE NOT NULL,
    time TEXT,
    location TEXT,
    description TEXT,
    school_id UUID REFERENCES public.schools(id)
);

-- 2. Enable RLS
ALTER TABLE public.alumni_events ENABLE ROW LEVEL SECURITY;

-- 3. Create Policy (Drop first to avoid conflicts)
DROP POLICY IF EXISTS "school_isolation_alumni_events" ON public.alumni_events;

CREATE POLICY "school_isolation_alumni_events" ON public.alumni_events
    USING (school_id = get_auth_school_id() OR is_system_admin())
    WITH CHECK (school_id = get_auth_school_id() OR is_system_admin());

-- 4. Assign all data to the specific school
DO $$
DECLARE
    target_school_id UUID := '78bdc42c-e7c7-45f7-ae78-41e2e934f39b';
    curr_table_name text;
BEGIN
    -- Ensure the school exists (create if not)
    INSERT INTO public.schools (id, name, subscription_plan, is_active)
    VALUES (target_school_id, 'Main School', 'enterprise', true)
    ON CONFLICT (id) DO NOTHING;

    -- Loop through all tables that might have school_id
    FOR curr_table_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'students', 'teachers', 'classes', 'sections', 'courses', 'exams', 'grades', 
            'attendance', 'fees', 'payrolls', 'leaves', 'library_books', 'library_issues', 
            'inventory_items', 'inventory_issues', 'transport_vehicles', 'hostel_rooms', 
            'events', 'notices', 'expenses', 'incomes', 'timetables', 'lesson_plans', 
            'homework', 'contents', 'live_classes', 'online_exams', 'student_categories', 
            'subject_groups', 'fee_masters', 'admission_enquiries', 'visitors', 
            'complaints', 'postal_records', 'alumni_events', 'staff_attendance'
        )
    LOOP
        -- Check if school_id column exists in the table before updating
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = curr_table_name 
            AND column_name = 'school_id'
        ) THEN
            EXECUTE format('UPDATE %I SET school_id = %L WHERE school_id IS NULL OR school_id != %L', curr_table_name, target_school_id, target_school_id);
        END IF;
    END LOOP;

    -- Update profiles for non-system admins
    UPDATE public.profiles 
    SET school_id = target_school_id 
    WHERE role != 'system_admin' 
    AND (school_id IS NULL OR school_id != target_school_id);
    
END $$;
