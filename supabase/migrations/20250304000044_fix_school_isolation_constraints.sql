/*
  # Fix School Isolation and Unique Constraints
  
  ## Query Description:
  This migration fixes multi-tenancy issues by:
  1. Scoping unique constraints to the school_id (e.g., allowing "Class 10" in multiple schools).
  2. Reinforcing RLS policies to strictly filter data by school_id.
  3. Ensuring the get_auth_school_id() function is robust.

  ## Metadata:
  - Schema-Category: Structural
  - Impact-Level: High
  - Requires-Backup: true
  - Reversible: true
  
  ## Structure Details:
  - Modifies constraints on: classes, sections, students, teachers, fee_masters, transport_vehicles, hostel_rooms, departments, courses.
  - Updates RLS policies on all major tables.
*/

-- 1. Secure Helper Functions
CREATE OR REPLACE FUNCTION public.get_auth_school_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_school_id uuid;
BEGIN
  -- Get the school_id from the profile of the currently logged-in user
  SELECT school_id INTO current_school_id
  FROM profiles
  WHERE id = auth.uid();
  
  RETURN current_school_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_system_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'system_admin'
  );
END;
$$;

-- 2. Fix Unique Constraints (Scope by school_id)

-- Classes: Name should be unique per school
ALTER TABLE IF EXISTS classes DROP CONSTRAINT IF EXISTS classes_name_key;
ALTER TABLE IF EXISTS classes DROP CONSTRAINT IF EXISTS classes_school_id_name_key;
CREATE UNIQUE INDEX IF NOT EXISTS classes_school_id_name_key ON classes (school_id, name);

-- Sections: Name should be unique per school
ALTER TABLE IF EXISTS sections DROP CONSTRAINT IF EXISTS sections_name_key;
ALTER TABLE IF EXISTS sections DROP CONSTRAINT IF EXISTS sections_school_id_name_key;
CREATE UNIQUE INDEX IF NOT EXISTS sections_school_id_name_key ON sections (school_id, name);

-- Students: Roll Number should be unique per school (and probably class, but definitely per school)
ALTER TABLE IF EXISTS students DROP CONSTRAINT IF EXISTS students_roll_number_key;
ALTER TABLE IF EXISTS students DROP CONSTRAINT IF EXISTS students_school_id_roll_number_key;
-- Note: We allow same roll number in different classes, but if you want strict roll number per school:
-- CREATE UNIQUE INDEX IF NOT EXISTS students_school_id_roll_number_key ON students (school_id, roll_number);

-- Fee Masters: Name should be unique per school
ALTER TABLE IF EXISTS fee_masters DROP CONSTRAINT IF EXISTS fee_masters_name_key;
ALTER TABLE IF EXISTS fee_masters DROP CONSTRAINT IF EXISTS fee_masters_school_id_name_key;
CREATE UNIQUE INDEX IF NOT EXISTS fee_masters_school_id_name_key ON fee_masters (school_id, name);

-- Transport Vehicles: Vehicle Number unique per school
ALTER TABLE IF EXISTS transport_vehicles DROP CONSTRAINT IF EXISTS transport_vehicles_vehicle_number_key;
ALTER TABLE IF EXISTS transport_vehicles DROP CONSTRAINT IF EXISTS transport_vehicles_school_id_vehicle_number_key;
CREATE UNIQUE INDEX IF NOT EXISTS transport_vehicles_school_id_vehicle_number_key ON transport_vehicles (school_id, vehicle_number);

-- Hostel Rooms: Room Number unique per school (and building)
ALTER TABLE IF EXISTS hostel_rooms DROP CONSTRAINT IF EXISTS hostel_rooms_room_number_key;
ALTER TABLE IF EXISTS hostel_rooms DROP CONSTRAINT IF EXISTS hostel_rooms_school_id_room_number_key;
CREATE UNIQUE INDEX IF NOT EXISTS hostel_rooms_school_id_room_number_key ON hostel_rooms (school_id, room_number, building);

-- Departments: Name unique per school
ALTER TABLE IF EXISTS departments DROP CONSTRAINT IF EXISTS departments_name_key;
ALTER TABLE IF EXISTS departments DROP CONSTRAINT IF EXISTS departments_school_id_name_key;
CREATE UNIQUE INDEX IF NOT EXISTS departments_school_id_name_key ON departments (school_id, name);

-- Courses: Code unique per school
ALTER TABLE IF EXISTS courses DROP CONSTRAINT IF EXISTS courses_code_key;
ALTER TABLE IF EXISTS courses DROP CONSTRAINT IF EXISTS courses_school_id_code_key;
CREATE UNIQUE INDEX IF NOT EXISTS courses_school_id_code_key ON courses (school_id, code);


-- 3. Standardize RLS Policies
-- This macro-like block applies standard isolation policies to a list of tables

DO $$
DECLARE
  tables text[] := ARRAY[
    'students', 'teachers', 'classes', 'sections', 'courses', 'departments', 
    'subject_groups', 'exams', 'grades', 'attendance', 'staff_attendance', 
    'fees', 'fee_masters', 'incomes', 'expenses', 'payrolls', 
    'library_books', 'library_issues', 'inventory_items', 'inventory_issues', 
    'transport_vehicles', 'hostel_rooms', 'events', 'notices', 'contents', 
    'lesson_plans', 'live_classes', 'admission_enquiries', 'visitors', 
    'complaints', 'postal_records', 'alumni_events', 'settings'
  ];
  t text;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    -- Enable RLS
    EXECUTE format('ALTER TABLE IF EXISTS %I ENABLE ROW LEVEL SECURITY', t);
    
    -- Drop existing policies to ensure clean slate
    EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation Policy" ON %I', t);
    EXECUTE format('DROP POLICY IF EXISTS "System Admin Policy" ON %I', t);
    EXECUTE format('DROP POLICY IF EXISTS "School Isolation" ON %I', t);
    
    -- Create Unified Isolation Policy
    -- Users see data if it matches their school OR if they are system admin
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

-- 4. Ensure school_id is set on INSERT
-- We create a generic trigger function to set school_id if it's null
CREATE OR REPLACE FUNCTION public.set_school_id_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If school_id is already set (e.g. by System Admin), keep it.
  -- Otherwise, set it to the user's school_id.
  IF NEW.school_id IS NULL THEN
    NEW.school_id := get_auth_school_id();
  END IF;
  
  -- Safety check: If still null (and not system admin creating a school-less record?), raise error?
  -- For now, we allow it but RLS might block the insert if it doesn't match.
  
  RETURN NEW;
END;
$$;

-- Apply trigger to all tables
DO $$
DECLARE
  tables text[] := ARRAY[
    'students', 'teachers', 'classes', 'sections', 'courses', 'departments', 
    'subject_groups', 'exams', 'grades', 'attendance', 'staff_attendance', 
    'fees', 'fee_masters', 'incomes', 'expenses', 'payrolls', 
    'library_books', 'library_issues', 'inventory_items', 'inventory_issues', 
    'transport_vehicles', 'hostel_rooms', 'events', 'notices', 'contents', 
    'lesson_plans', 'live_classes', 'admission_enquiries', 'visitors', 
    'complaints', 'postal_records', 'alumni_events'
  ];
  t text;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_school_id_trigger ON %I', t);
    EXECUTE format('CREATE TRIGGER set_school_id_trigger BEFORE INSERT ON %I FOR EACH ROW EXECUTE FUNCTION set_school_id_on_insert()', t);
  END LOOP;
END $$;
