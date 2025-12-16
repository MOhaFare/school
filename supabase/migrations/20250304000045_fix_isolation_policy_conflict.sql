/*
  # Fix Isolation Policy Conflict & Unique Constraints
  
  ## Query Description:
  This migration resolves the "policy already exists" error by dropping existing policies before re-creating them.
  It also updates unique constraints to be school-specific (composite keys) rather than global, allowing different schools to have similar data (e.g., "Class 10" in both School A and School B).

  ## Metadata:
  - Schema-Category: Structural
  - Impact-Level: High
  - Requires-Backup: true
  - Reversible: true

  ## Changes:
  1. Drops "School Isolation Policy" and "System Admin Policy" if they exist.
  2. Drops global unique constraints on students, teachers, classes, etc.
  3. Adds composite unique constraints (school_id + field).
  4. Re-applies strict RLS policies.
*/

-- 1. Drop existing policies to prevent "already exists" errors
DO $$ 
DECLARE 
    tables text[] := ARRAY['students', 'teachers', 'classes', 'sections', 'courses', 'subjects', 'departments', 'hostel_rooms', 'transport_vehicles', 'fees', 'grades', 'attendance', 'events', 'notices', 'library_books', 'inventory_items'];
    t text;
BEGIN 
    FOREACH t IN ARRAY tables LOOP 
        EXECUTE format('DROP POLICY IF EXISTS "School Isolation Policy" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "System Admin Policy" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Enable read access for all users" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Enable update for users based on email" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Enable delete for users based on email" ON %I', t);
    END LOOP; 
END $$;

-- 2. Fix Unique Constraints (Make them per-school instead of global)

-- Students: Roll Number and Email should be unique per school, not globally
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_roll_number_key;
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_email_key;
-- Add composite constraints (only if they don't exist to avoid errors)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'students_school_roll_unique') THEN
        ALTER TABLE students ADD CONSTRAINT students_school_roll_unique UNIQUE (school_id, roll_number);
    END IF;
    -- Note: We allow duplicate emails across schools if a student moves, but usually email is unique. 
    -- If you want strict unique emails per school:
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'students_school_email_unique') THEN
        ALTER TABLE students ADD CONSTRAINT students_school_email_unique UNIQUE (school_id, email);
    END IF;
END $$;

-- Teachers: Email unique per school
ALTER TABLE teachers DROP CONSTRAINT IF EXISTS teachers_email_key;
ALTER TABLE teachers DROP CONSTRAINT IF EXISTS teachers_phone_key;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teachers_school_email_unique') THEN
        ALTER TABLE teachers ADD CONSTRAINT teachers_school_email_unique UNIQUE (school_id, email);
    END IF;
END $$;

-- Classes: Name unique per school
ALTER TABLE classes DROP CONSTRAINT IF EXISTS classes_name_key;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'classes_school_name_unique') THEN
        ALTER TABLE classes ADD CONSTRAINT classes_school_name_unique UNIQUE (school_id, name);
    END IF;
END $$;

-- Sections: Name unique per school
ALTER TABLE sections DROP CONSTRAINT IF EXISTS sections_name_key;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sections_school_name_unique') THEN
        ALTER TABLE sections ADD CONSTRAINT sections_school_name_unique UNIQUE (school_id, name);
    END IF;
END $$;

-- Hostel Rooms: Room Number unique per school
ALTER TABLE hostel_rooms DROP CONSTRAINT IF EXISTS hostel_rooms_room_number_key;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'hostel_rooms_school_number_unique') THEN
        ALTER TABLE hostel_rooms ADD CONSTRAINT hostel_rooms_school_number_unique UNIQUE (school_id, room_number);
    END IF;
END $$;

-- Transport: Vehicle Number unique per school
ALTER TABLE transport_vehicles DROP CONSTRAINT IF EXISTS transport_vehicles_vehicle_number_key;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transport_vehicles_school_number_unique') THEN
        ALTER TABLE transport_vehicles ADD CONSTRAINT transport_vehicles_school_number_unique UNIQUE (school_id, vehicle_number);
    END IF;
END $$;

-- 3. Re-apply Strict RLS Policies
-- We use a loop to apply the standard isolation policy to all main tables
DO $$ 
DECLARE 
    tables text[] := ARRAY['students', 'teachers', 'classes', 'sections', 'courses', 'subjects', 'departments', 'hostel_rooms', 'transport_vehicles', 'fees', 'grades', 'attendance', 'events', 'notices', 'library_books', 'inventory_items', 'payrolls', 'leaves', 'timetables', 'exam_schedules', 'exams', 'online_exams', 'lesson_plans', 'homework', 'contents', 'library_issues', 'inventory_issues', 'staff_attendance', 'fee_masters', 'subject_groups', 'student_categories', 'alumni_events', 'visitors', 'complaints', 'postal_records', 'admission_enquiries'];
    t text;
BEGIN 
    FOREACH t IN ARRAY tables LOOP 
        -- Enable RLS
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);

        -- Create Isolation Policy (School Admins & Users)
        -- They can see/edit rows where school_id matches their own school_id
        EXECUTE format('
            CREATE POLICY "School Isolation Policy" ON %I
            AS PERMISSIVE
            FOR ALL
            TO authenticated
            USING (
                school_id = get_auth_school_id() OR is_system_admin()
            )
            WITH CHECK (
                school_id = get_auth_school_id() OR is_system_admin()
            )
        ', t);
    END LOOP; 
END $$;

-- 4. Special Handling for Profiles (Global but restricted)
-- Profiles table is shared but we need to ensure users can only see relevant profiles
DROP POLICY IF EXISTS "Profiles Isolation" ON profiles;
CREATE POLICY "Profiles Isolation" ON profiles
AS PERMISSIVE
FOR ALL
TO authenticated
USING (
    -- Users can see their own profile
    id = auth.uid() 
    OR 
    -- System admins see everyone
    is_system_admin()
    OR
    -- School admins/users see profiles in their school
    school_id = get_auth_school_id()
);

-- 5. Ensure Schools table is visible
DROP POLICY IF EXISTS "Schools Visibility" ON schools;
CREATE POLICY "Schools Visibility" ON schools
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
    -- Users can see their own school
    id = get_auth_school_id()
    OR
    -- System admins see all schools
    is_system_admin()
);

-- Only System Admins can insert/update/delete schools
DROP POLICY IF EXISTS "Schools Management" ON schools;
CREATE POLICY "Schools Management" ON schools
AS PERMISSIVE
FOR ALL
TO authenticated
USING ( is_system_admin() )
WITH CHECK ( is_system_admin() );
