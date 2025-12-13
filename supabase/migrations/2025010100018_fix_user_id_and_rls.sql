-- This is a consolidated script to fix missing user_id columns and reset RLS policies.
-- It is safe to re-run.

-- Step 1: Add user_id columns to students and teachers tables if they don't exist.
-- This column will link students and teachers to their authentication records.
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;


-- Step 2: Ensure the get_user_role helper function is secure and exists.
-- This function safely retrieves the role of the currently logged-in user.
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = auth.uid();
  RETURN user_role;
END;
$$;


-- Step 3: Recreate RLS policies for the 'students' table.
-- This drops all old policies to prevent conflicts and creates a correct new set.

-- Drop all existing policies on the table to ensure a clean slate.
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'students' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.students;';
    END LOOP;
END $$;

-- Create new, correct policies for students.
CREATE POLICY "Admins have full access to students"
  ON public.students FOR ALL
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Students can view their own profile"
  ON public.students FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view all students"
  ON public.students FOR SELECT
  USING (get_user_role() = 'teacher');


-- Step 4: Recreate RLS policies for the 'teachers' table.

-- Drop all existing policies on the table.
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'teachers' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.teachers;';
    END LOOP;
END $$;

-- Create new, correct policies for teachers.
CREATE POLICY "Admins have full access to teachers"
  ON public.teachers FOR ALL
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Teachers can view their own profile"
  ON public.teachers FOR SELECT
  USING (auth.uid() = user_id);
