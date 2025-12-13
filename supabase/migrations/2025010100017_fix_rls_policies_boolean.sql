-- Drop existing policies to ensure a clean slate
DROP POLICY IF EXISTS "Allow admins full access" ON public.students;
DROP POLICY IF EXISTS "Allow teachers to view students" ON public.students;
DROP POLICY IF EXISTS "Allow students to view their own profile" ON public.students;
DROP POLICY IF EXISTS "Allow admins full access" ON public.teachers;
DROP POLICY IF EXISTS "Allow authenticated users to view teachers" ON public.teachers;
DROP POLICY IF EXISTS "Allow admins full access" ON public.classes;
DROP POLICY IF EXISTS "Allow authenticated users to view classes" ON public.classes;
-- Add drops for other tables as well
DROP POLICY IF EXISTS "Allow full access for admins" ON public.courses;
DROP POLICY IF EXISTS "Allow read access for all authenticated" ON public.courses;
DROP POLICY IF EXISTS "Allow full access for admins" ON public.departments;
DROP POLICY IF EXISTS "Allow read access for all authenticated" ON public.departments;
DROP POLICY IF EXISTS "Allow full access for admins" ON public.exams;
DROP POLICY IF EXISTS "Allow read access for all authenticated" ON public.exams;
DROP POLICY IF EXISTS "Allow full access for admins" ON public.grades;
DROP POLICY IF EXISTS "Allow teachers to manage grades for their students" ON public.grades;
DROP POLICY IF EXISTS "Allow students to view their own grades" ON public.grades;
DROP POLICY IF EXISTS "Allow full access for admins" ON public.attendance;
DROP POLICY IF EXISTS "Allow teachers to manage attendance for their students" ON public.attendance;
DROP POLICY IF EXISTS "Allow students to view their own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow full access for admins" ON public.fees;
DROP POLICY IF EXISTS "Allow students to view their own fees" ON public.fees;
DROP POLICY IF EXISTS "Allow full access for admins" ON public.payrolls;
DROP POLICY IF EXISTS "Allow teachers to view their own payroll" ON public.payrolls;
DROP POLICY IF EXISTS "Allow full access for admins" ON public.library_books;
DROP POLICY IF EXISTS "Allow read access for all authenticated" ON public.library_books;
DROP POLICY IF EXISTS "Allow full access for admins" ON public.hostel_rooms;
DROP POLICY IF EXISTS "Allow read access for all authenticated" ON public.hostel_rooms;
DROP POLICY IF EXISTS "Allow full access for admins" ON public.transport_vehicles;
DROP POLICY IF EXISTS "Allow read access for all authenticated" ON public.transport_vehicles;
DROP POLICY IF EXISTS "Allow full access for admins" ON public.events;
DROP POLICY IF EXISTS "Allow read access for all authenticated" ON public.events;
DROP POLICY IF EXISTS "Allow full access for admins" ON public.notices;
DROP POLICY IF EXISTS "Allow read access for all authenticated" ON public.notices;
DROP POLICY IF EXISTS "Allow full access for admins" ON public.expenses;
DROP POLICY IF EXISTS "Allow full access for admins" ON public.incomes;
DROP POLICY IF EXISTS "Allow full access for admins" ON public.settings;
DROP POLICY IF EXISTS "Allow read access for all authenticated" ON public.settings;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$;

-- Students Table Policies
CREATE POLICY "Allow admins full access" ON public.students FOR ALL USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "Allow teachers to view students" ON public.students FOR SELECT USING (get_user_role() = 'teacher');
CREATE POLICY "Allow students to view their own profile" ON public.students FOR SELECT USING (auth.uid() = user_id);

-- Teachers Table Policies
CREATE POLICY "Allow admins full access" ON public.teachers FOR ALL USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "Allow authenticated users to view teachers" ON public.teachers FOR SELECT USING (auth.role() = 'authenticated');

-- Classes Table Policies
CREATE POLICY "Allow admins full access" ON public.classes FOR ALL USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "Allow authenticated users to view classes" ON public.classes FOR SELECT USING (auth.role() = 'authenticated');

-- Grades Table Policies
CREATE POLICY "Allow admins full access" ON public.grades FOR ALL USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "Allow students to view their own grades" ON public.grades FOR SELECT USING (EXISTS (SELECT 1 FROM students WHERE students.id = grades.student_id AND students.user_id = auth.uid()));
CREATE POLICY "Allow teachers to manage grades for their students" ON public.grades FOR ALL USING (EXISTS (SELECT 1 FROM classes JOIN students ON students.class = SPLIT_PART(classes.name, '-', 1) AND students.section = SPLIT_PART(classes.name, '-', 2) WHERE classes.teacher_id = (SELECT id FROM teachers WHERE user_id = auth.uid()) AND students.id = grades.student_id)) WITH CHECK (EXISTS (SELECT 1 FROM classes JOIN students ON students.class = SPLIT_PART(classes.name, '-', 1) AND students.section = SPLIT_PART(classes.name, '-', 2) WHERE classes.teacher_id = (SELECT id FROM teachers WHERE user_id = auth.uid()) AND students.id = grades.student_id));

-- Attendance Table Policies
CREATE POLICY "Allow admins full access" ON public.attendance FOR ALL USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "Allow students to view their own attendance" ON public.attendance FOR SELECT USING (EXISTS (SELECT 1 FROM students WHERE students.id = attendance.student_id AND students.user_id = auth.uid()));
CREATE POLICY "Allow teachers to manage attendance for their students" ON public.attendance FOR ALL USING (EXISTS (SELECT 1 FROM classes JOIN students ON students.class = SPLIT_PART(classes.name, '-', 1) AND students.section = SPLIT_PART(classes.name, '-', 2) WHERE classes.teacher_id = (SELECT id FROM teachers WHERE user_id = auth.uid()) AND students.id = attendance.student_id)) WITH CHECK (EXISTS (SELECT 1 FROM classes JOIN students ON students.class = SPLIT_PART(classes.name, '-', 1) AND students.section = SPLIT_PART(classes.name, '-', 2) WHERE classes.teacher_id = (SELECT id FROM teachers WHERE user_id = auth.uid()) AND students.id = attendance.student_id));

-- Generic Policies for other tables
CREATE POLICY "Allow full access for admins" ON public.courses FOR ALL USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "Allow read access for all authenticated" ON public.courses FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow full access for admins" ON public.departments FOR ALL USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "Allow read access for all authenticated" ON public.departments FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow full access for admins" ON public.exams FOR ALL USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "Allow read access for all authenticated" ON public.exams FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow full access for admins" ON public.fees FOR ALL USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "Allow students to view their own fees" ON public.fees FOR SELECT USING (EXISTS (SELECT 1 FROM students WHERE students.id = fees.student_id AND students.user_id = auth.uid()));

CREATE POLICY "Allow full access for admins" ON public.payrolls FOR ALL USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "Allow teachers to view their own payroll" ON public.payrolls FOR SELECT USING (EXISTS (SELECT 1 FROM teachers WHERE teachers.id = payrolls.teacher_id AND teachers.user_id = auth.uid()));

CREATE POLICY "Allow full access for admins" ON public.library_books FOR ALL USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "Allow read access for all authenticated" ON public.library_books FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow full access for admins" ON public.hostel_rooms FOR ALL USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "Allow read access for all authenticated" ON public.hostel_rooms FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow full access for admins" ON public.transport_vehicles FOR ALL USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "Allow read access for all authenticated" ON public.transport_vehicles FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow full access for admins" ON public.events FOR ALL USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "Allow read access for all authenticated" ON public.events FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow full access for admins" ON public.notices FOR ALL USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "Allow read access for all authenticated" ON public.notices FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow full access for admins" ON public.expenses FOR ALL USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "Allow full access for admins" ON public.incomes FOR ALL USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Allow full access for admins" ON public.settings FOR ALL USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "Allow read access for all authenticated" ON public.settings FOR SELECT USING (auth.role() = 'authenticated');
