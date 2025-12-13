-- Helper function to get the role of the current user
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN (
    SELECT raw_user_meta_data->>'role'
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$;

-- Enable RLS for all tables
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payrolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Allow all for admins" ON public.students;
DROP POLICY IF EXISTS "Allow students to view own profile" ON public.students;
DROP POLICY IF EXISTS "Allow teachers to view students in their class" ON public.students;
DROP POLICY IF EXISTS "Allow all for admins" ON public.teachers;
DROP POLICY IF EXISTS "Allow teachers to view their own profile" ON public.teachers;
DROP POLICY IF EXISTS "Allow authenticated users to view teachers" ON public.teachers;
DROP POLICY IF EXISTS "Allow all for admins" ON public.classes;
DROP POLICY IF EXISTS "Allow authenticated to view classes" ON public.classes;
DROP POLICY IF EXISTS "Allow all for admins" ON public.courses;
DROP POLICY IF EXISTS "Allow authenticated to view courses" ON public.courses;
DROP POLICY IF EXISTS "Allow all for admins" ON public.departments;
DROP POLICY IF EXISTS "Allow authenticated to view departments" ON public.departments;
DROP POLICY IF EXISTS "Allow all for admins" ON public.exams;
DROP POLICY IF EXISTS "Allow authenticated to view exams" ON public.exams;
DROP POLICY IF EXISTS "Allow all for admins" ON public.grades;
DROP POLICY IF EXISTS "Allow students to view own grades" ON public.grades;
DROP POLICY IF EXISTS "Allow teachers to manage grades for their students" ON public.grades;
DROP POLICY IF EXISTS "Allow all for admins" ON public.fees;
DROP POLICY IF EXISTS "Allow students to view own fees" ON public.fees;
DROP POLICY IF EXISTS "Allow all for admins" ON public.payrolls;
DROP POLICY IF EXISTS "Allow all for admins" ON public.attendance;
DROP POLICY IF EXISTS "Allow students to view own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow teachers to manage attendance for their students" ON public.attendance;
DROP POLICY IF EXISTS "Allow all for admins" ON public.events;
DROP POLICY IF EXISTS "Allow authenticated to view events" ON public.events;
DROP POLICY IF EXISTS "Allow all for admins" ON public.library_books;
DROP POLICY IF EXISTS "Allow authenticated to view books" ON public.library_books;
DROP POLICY IF EXISTS "Allow all for admins" ON public.hostel_rooms;
DROP POLICY IF EXISTS "Allow all for admins" ON public.transport_vehicles;
DROP POLICY IF EXISTS "Allow all for admins" ON public.notices;
DROP POLICY IF EXISTS "Allow authenticated to view notices" ON public.notices;
DROP POLICY IF EXISTS "Allow all for admins" ON public.expenses;
DROP POLICY IF EXISTS "Allow all for admins" ON public.incomes;
DROP POLICY IF EXISTS "Allow all for admins" ON public.settings;
DROP POLICY IF EXISTS "Allow authenticated to read settings" ON public.settings;
DROP POLICY IF EXISTS "Allow all for admins" ON public.profiles;
DROP POLICY IF EXISTS "Allow user to view own profile" ON public.profiles;

-- === PROFILES ===
CREATE POLICY "Allow all for admins" ON public.profiles FOR ALL USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "Allow user to view own profile" ON public.profiles FOR SELECT USING (id = auth.uid());

-- === SETTINGS ===
CREATE POLICY "Allow all for admins" ON public.settings FOR ALL USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "Allow authenticated to read settings" ON public.settings FOR SELECT USING (auth.role() = 'authenticated');

-- === STUDENTS ===
CREATE POLICY "Allow all for admins" ON public.students FOR ALL USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "Allow students to view own profile" ON public.students FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Allow teachers to view students in their class" ON public.students FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM classes
    WHERE classes.teacher_id = (SELECT id FROM teachers WHERE user_id = auth.uid())
    AND students.class = SPLIT_PART(classes.name, '-', 1)
    AND students.section = SPLIT_PART(classes.name, '-', 2)
  )
);

-- === TEACHERS ===
CREATE POLICY "Allow all for admins" ON public.teachers FOR ALL USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "Allow teachers to view their own profile" ON public.teachers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Allow authenticated users to view teachers" ON public.teachers FOR SELECT USING (auth.role() = 'authenticated');

-- === CLASSES ===
CREATE POLICY "Allow all for admins" ON public.classes FOR ALL USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "Allow authenticated to view classes" ON public.classes FOR SELECT USING (auth.role() = 'authenticated');

-- === COURSES & DEPARTMENTS ===
CREATE POLICY "Allow all for admins" ON public.courses FOR ALL USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "Allow authenticated to view courses" ON public.courses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for admins" ON public.departments FOR ALL USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "Allow authenticated to view departments" ON public.departments FOR SELECT USING (auth.role() = 'authenticated');

-- === EXAMS ===
CREATE POLICY "Allow all for admins" ON public.exams FOR ALL USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "Allow authenticated to view exams" ON public.exams FOR SELECT USING (auth.role() = 'authenticated');

-- === GRADES ===
CREATE POLICY "Allow all for admins" ON public.grades FOR ALL USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "Allow students to view own grades" ON public.grades FOR SELECT USING (
  studentId IN (SELECT id FROM students WHERE user_id = auth.uid())
);
CREATE POLICY "Allow teachers to manage grades for their students" ON public.grades FOR ALL USING (
  studentId IN (SELECT id FROM students WHERE class IN (SELECT SPLIT_PART(name, '-', 1) FROM classes WHERE teacher_id = (SELECT id FROM teachers WHERE user_id = auth.uid())))
) WITH CHECK (
  studentId IN (SELECT id FROM students WHERE class IN (SELECT SPLIT_PART(name, '-', 1) FROM classes WHERE teacher_id = (SELECT id FROM teachers WHERE user_id = auth.uid())))
);

-- === FEES ===
CREATE POLICY "Allow all for admins" ON public.fees FOR ALL USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "Allow students to view own fees" ON public.fees FOR SELECT USING (
  studentId IN (SELECT id FROM students WHERE user_id = auth.uid())
);

-- === PAYROLL ===
CREATE POLICY "Allow all for admins" ON public.payrolls FOR ALL USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');

-- === ATTENDANCE ===
CREATE POLICY "Allow all for admins" ON public.attendance FOR ALL USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "Allow students to view own attendance" ON public.attendance FOR SELECT USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);
CREATE POLICY "Allow teachers to manage attendance for their students" ON public.attendance FOR ALL USING (
  student_id IN (SELECT id FROM students WHERE class IN (SELECT SPLIT_PART(name, '-', 1) FROM classes WHERE teacher_id = (SELECT id FROM teachers WHERE user_id = auth.uid())))
) WITH CHECK (
  student_id IN (SELECT id FROM students WHERE class IN (SELECT SPLIT_PART(name, '-', 1) FROM classes WHERE teacher_id = (SELECT id FROM teachers WHERE user_id = auth.uid())))
);

-- === SHARED RESOURCES ===
CREATE POLICY "Allow all for admins" ON public.events FOR ALL USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "Allow authenticated to view events" ON public.events FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for admins" ON public.library_books FOR ALL USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "Allow authenticated to view books" ON public.library_books FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for admins" ON public.hostel_rooms FOR ALL USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "Allow all for admins" ON public.transport_vehicles FOR ALL USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "Allow all for admins" ON public.notices FOR ALL USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "Allow authenticated to view notices" ON public.notices FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for admins" ON public.expenses FOR ALL USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "Allow all for admins" ON public.incomes FOR ALL USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');
