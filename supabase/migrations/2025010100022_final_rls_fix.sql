-- =================================================================
-- Comprehensive RLS Policy Fix
-- This script drops all existing policies and recreates them with the correct syntax.
-- This will resolve any inconsistencies from previous failed migrations.
-- =================================================================

-- Helper function to get user's role from JWT claims
create or replace function get_my_claim(claim text) returns jsonb
    language sql stable
    as $$
  select nullif(current_setting('request.jwt.claims', true), '')::jsonb -> claim;
$$;

-- =================================================================
-- PROFILES
-- =================================================================
-- Drop old policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL USING (get_my_claim('role') = '"admin"');

-- =================================================================
-- Helper function to create standard policies
-- =================================================================
CREATE OR REPLACE FUNCTION create_admin_and_read_policies(table_name text)
RETURNS void AS $$
BEGIN
  -- Enable RLS on the table
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', table_name);

  -- Drop existing policies to be safe
  EXECUTE format('DROP POLICY IF EXISTS "Enable full access for admins" ON public.%I;', table_name);
  EXECUTE format('DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.%I;', table_name);

  -- Create admin policy
  EXECUTE format('CREATE POLICY "Enable full access for admins" ON public.%I FOR ALL USING (get_my_claim(''role'') = ''"admin"'') WITH CHECK (get_my_claim(''role'') = ''"admin"'');', table_name);

  -- Create read policy
  EXECUTE format('CREATE POLICY "Enable read access for all authenticated users" ON public.%I FOR SELECT USING (auth.role() = ''authenticated'');', table_name);
END;
$$ LANGUAGE plpgsql;

-- =================================================================
-- Apply standard policies to most tables
-- =================================================================
SELECT create_admin_and_read_policies('classes');
SELECT create_admin_and_read_policies('courses');
SELECT create_admin_and_read_policies('departments');
SELECT create_admin_and_read_policies('exams');
SELECT create_admin_and_read_policies('payrolls');
SELECT create_admin_and_read_policies('fees');
SELECT create_admin_and_read_policies('attendance');
SELECT create_admin_and_read_policies('library_books');
SELECT create_admin_and_read_policies('hostel_rooms');
SELECT create_admin_and_read_policies('transport_vehicles');
SELECT create_admin_and_read_policies('notices');
SELECT create_admin_and_read_policies('expenses');
SELECT create_admin_and_read_policies('incomes');
SELECT create_admin_and_read_policies('settings');
SELECT create_admin_and_read_policies('teachers');
SELECT create_admin_and_read_policies('students');

-- Drop the helper function
DROP FUNCTION create_admin_and_read_policies(text);

-- =================================================================
-- GRADES (Specific Policies)
-- =================================================================
-- Drop old policies
DROP POLICY IF EXISTS "Enable full access for admins" ON public.grades;
DROP POLICY IF EXISTS "Students can view their own grades" ON public.grades;
DROP POLICY IF EXISTS "Teachers can manage grades for their students" ON public.grades;

-- Enable RLS
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Enable full access for admins" ON public.grades
  FOR ALL USING (get_my_claim('role') = '"admin"') WITH CHECK (get_my_claim('role') = '"admin"');

CREATE POLICY "Students can view their own grades" ON public.grades
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.students WHERE students.user_id = auth.uid() AND students.id = grades.student_id
  ));

CREATE POLICY "Teachers can manage grades for their students" ON public.grades
  FOR ALL USING (EXISTS (
    SELECT 1
    FROM public.teachers t
    JOIN public.classes c ON t.id = c.teacher_id
    JOIN public.students s ON s.class = SPLIT_PART(c.name, '-', 1) AND s.section = SPLIT_PART(c.name, '-', 2)
    WHERE t.user_id = auth.uid() AND s.id = grades.student_id
  )) WITH CHECK (EXISTS (
    SELECT 1
    FROM public.teachers t
    JOIN public.classes c ON t.id = c.teacher_id
    JOIN public.students s ON s.class = SPLIT_PART(c.name, '-', 1) AND s.section = SPLIT_PART(c.name, '-', 2)
    WHERE t.user_id = auth.uid() AND s.id = grades.student_id
  ));
