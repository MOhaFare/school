-- This is a comprehensive script to fix and finalize all RLS policies.
-- It is designed to be safely re-runnable to fix any partial migration issues.

-- Step 1: Ensure helper function exists
CREATE OR REPLACE FUNCTION get_my_claim(claim TEXT) RETURNS TEXT AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::json->>claim, '')::text;
$$ LANGUAGE SQL STABLE;

-- Step 2: Add user_id columns if they don't exist
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Step 3: Reset and create RLS policies for all tables

-- === Students Table ===
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins have full access" ON public.students;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.students;
DROP POLICY IF EXISTS "Teachers can view students in their classes" ON public.students;

CREATE POLICY "Admins have full access" ON public.students FOR ALL USING (get_my_claim('role')::text = 'admin');
CREATE POLICY "Users can view their own profile" ON public.students FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Teachers can view students in their classes" ON public.students FOR SELECT USING (get_my_claim('role')::text = 'teacher' AND (students.class || '-' || students.section) IN (SELECT c.name FROM public.classes c JOIN public.teachers t ON c.teacher_id = t.id WHERE t.user_id = auth.uid()));

-- === Teachers Table ===
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view teachers" ON public.teachers;
DROP POLICY IF EXISTS "Admins have full access" ON public.teachers;

CREATE POLICY "Public can view teachers" ON public.teachers FOR SELECT USING (true);
CREATE POLICY "Admins have full access" ON public.teachers FOR ALL USING (get_my_claim('role')::text = 'admin');

-- === Grades Table ===
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins have full access" ON public.grades;
DROP POLICY IF EXISTS "Students can view their own grades" ON public.grades;
DROP POLICY IF EXISTS "Teachers can manage grades for their students" ON public.grades;

CREATE POLICY "Admins have full access" ON public.grades FOR ALL USING (get_my_claim('role')::text = 'admin');
CREATE POLICY "Students can view their own grades" ON public.grades FOR SELECT USING (get_my_claim('role')::text = 'student' AND "studentId" IN (SELECT id FROM public.students WHERE user_id = auth.uid()));
CREATE POLICY "Teachers can manage grades for their students" ON public.grades FOR ALL USING (get_my_claim('role')::text = 'teacher' AND "studentId" IN (SELECT s.id FROM public.students s WHERE (s.class || '-' || s.section) IN (SELECT c.name FROM public.classes c JOIN public.teachers t ON c.teacher_id = t.id WHERE t.user_id = auth.uid())));

-- === Attendance Table ===
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins have full access" ON public.attendance;
DROP POLICY IF EXISTS "Students can view their own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Teachers can manage attendance for their students" ON public.attendance;

CREATE POLICY "Admins have full access" ON public.attendance FOR ALL USING (get_my_claim('role')::text = 'admin');
CREATE POLICY "Students can view their own attendance" ON public.attendance FOR SELECT USING (get_my_claim('role')::text = 'student' AND student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));
CREATE POLICY "Teachers can manage attendance for their students" ON public.attendance FOR ALL USING (get_my_claim('role')::text = 'teacher' AND student_id IN (SELECT s.id FROM public.students s WHERE (s.class || '-' || s.section) IN (SELECT c.name FROM public.classes c JOIN public.teachers t ON c.teacher_id = t.id WHERE t.user_id = auth.uid())));

-- === Fees Table ===
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins have full access" ON public.fees;
DROP POLICY IF EXISTS "Students can view their own fees" ON public.fees;

CREATE POLICY "Admins have full access" ON public.fees FOR ALL USING (get_my_claim('role')::text = 'admin');
CREATE POLICY "Students can view their own fees" ON public.fees FOR SELECT USING (get_my_claim('role')::text = 'student' AND "studentId" IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

-- === Other tables (Admin only or public read) ===
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins have full access" ON public.classes;
DROP POLICY IF EXISTS "Authenticated users can read" ON public.classes;
CREATE POLICY "Admins have full access" ON public.classes FOR ALL USING (get_my_claim('role')::text = 'admin');
CREATE POLICY "Authenticated users can read" ON public.classes FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins have full access" ON public.courses;
DROP POLICY IF EXISTS "Authenticated users can read" ON public.courses;
CREATE POLICY "Admins have full access" ON public.courses FOR ALL USING (get_my_claim('role')::text = 'admin');
CREATE POLICY "Authenticated users can read" ON public.courses FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins have full access" ON public.departments;
DROP POLICY IF EXISTS "Authenticated users can read" ON public.departments;
CREATE POLICY "Admins have full access" ON public.departments FOR ALL USING (get_my_claim('role')::text = 'admin');
CREATE POLICY "Authenticated users can read" ON public.departments FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins have full access" ON public.exams;
DROP POLICY IF EXISTS "Authenticated users can read" ON public.exams;
CREATE POLICY "Admins have full access" ON public.exams FOR ALL USING (get_my_claim('role')::text = 'admin');
CREATE POLICY "Authenticated users can read" ON public.exams FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins have full access" ON public.expenses;
CREATE POLICY "Admins have full access" ON public.expenses FOR ALL USING (get_my_claim('role')::text = 'admin');

ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins have full access" ON public.incomes;
CREATE POLICY "Admins have full access" ON public.incomes FOR ALL USING (get_my_claim('role')::text = 'admin');

ALTER TABLE public.library_books ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins have full access" ON public.library_books;
DROP POLICY IF EXISTS "Authenticated users can read" ON public.library_books;
CREATE POLICY "Admins have full access" ON public.library_books FOR ALL USING (get_my_claim('role')::text = 'admin');
CREATE POLICY "Authenticated users can read" ON public.library_books FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE public.payrolls ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins have full access" ON public.payrolls;
CREATE POLICY "Admins have full access" ON public.payrolls FOR ALL USING (get_my_claim('role')::text = 'admin');

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins have full access" ON public.settings;
DROP POLICY IF EXISTS "Authenticated users can read" ON public.settings;
CREATE POLICY "Admins have full access" ON public.settings FOR ALL USING (get_my_claim('role')::text = 'admin');
CREATE POLICY "Authenticated users can read" ON public.settings FOR SELECT USING (auth.role() = 'authenticated');

-- Policies for tables that might not have been created by earlier scripts
-- These will only run if the tables exist.
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'events') THEN
    ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Admins have full access" ON public.events;
    DROP POLICY IF EXISTS "Authenticated users can read" ON public.events;
    CREATE POLICY "Admins have full access" ON public.events FOR ALL USING (get_my_claim('role')::text = 'admin');
    CREATE POLICY "Authenticated users can read" ON public.events FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'hostel_rooms') THEN
    ALTER TABLE public.hostel_rooms ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Admins have full access" ON public.hostel_rooms;
    DROP POLICY IF EXISTS "Authenticated users can read" ON public.hostel_rooms;
    CREATE POLICY "Admins have full access" ON public.hostel_rooms FOR ALL USING (get_my_claim('role')::text = 'admin');
    CREATE POLICY "Authenticated users can read" ON public.hostel_rooms FOR SELECT USING (auth.role() = 'authenticated');
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notices') THEN
    ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Admins have full access" ON public.notices;
    DROP POLICY IF EXISTS "Authenticated users can read" ON public.notices;
    CREATE POLICY "Admins have full access" ON public.notices FOR ALL USING (get_my_claim('role')::text = 'admin');
    CREATE POLICY "Authenticated users can read" ON public.notices FOR SELECT USING (auth.role() = 'authenticated');
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transport_vehicles') THEN
    ALTER TABLE public.transport_vehicles ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Admins have full access" ON public.transport_vehicles;
    DROP POLICY IF EXISTS "Authenticated users can read" ON public.transport_vehicles;
    CREATE POLICY "Admins have full access" ON public.transport_vehicles FOR ALL USING (get_my_claim('role')::text = 'admin');
    CREATE POLICY "Authenticated users can read" ON public.transport_vehicles FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END $$;
