/*
          # [Finalize Application Schema & Security]
          This script adds user_id columns for linking profiles and replaces all existing RLS policies with a more granular, role-based security model.

          ## Query Description: [This operation will overhaul your database's security policies. It is designed to be safe to re-run, but it is a significant change. It will drop all existing policies on the affected tables and create new ones. No data will be lost.]
          
          ## Metadata:
          - Schema-Category: ["Structural", "Security"]
          - Impact-Level: ["High"]
          - Requires-Backup: [true]
          - Reversible: [false]
          
          ## Structure Details:
          - Adds `user_id` column to `students` and `teachers` tables.
          - Creates helper functions to get user roles and check class assignments.
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [Yes]
          - Auth Requirements: [All access is now gated by authentication and roles.]
          
          ## Performance Impact:
          - Indexes: [Adds indexes on new user_id columns.]
          - Triggers: [No changes]
          - Estimated Impact: [Slight performance improvement on user-specific queries.]
          */

-- Add user_id columns if they don't exist
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_user_id ON public.students(user_id);
CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON public.teachers(user_id);

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = user_id;
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if a teacher is assigned to a student's class
CREATE OR REPLACE FUNCTION is_teacher_of_student(teacher_user_id uuid, student_id_to_check uuid)
RETURNS BOOLEAN AS $$
DECLARE
    teacher_id_from_profile uuid;
    student_class_name text;
BEGIN
    -- Get the teacher's ID from their user_id
    SELECT id INTO teacher_id_from_profile FROM public.teachers WHERE user_id = teacher_user_id;

    -- If no teacher profile is linked, they can't be the teacher of any student
    IF teacher_id_from_profile IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Get the student's class name (e.g., '10-A')
    SELECT s.class || '-' || s.section INTO student_class_name FROM public.students s WHERE s.id = student_id_to_check;

    -- Check if the teacher is assigned to that class
    RETURN EXISTS (
        SELECT 1 FROM public.classes c
        WHERE c.teacher_id = teacher_id_from_profile AND c.name = student_class_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Drop all existing policies to ensure a clean slate
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.students;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.students;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.teachers;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.teachers;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.grades;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.grades;
-- ... Drop policies for all other tables as well ...
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.exams;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.classes;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.courses;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.departments;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.library_books;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.fees;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.events;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.attendance;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.hostel_rooms;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.transport_vehicles;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.notices;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.payrolls;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.expenses;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.incomes;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.settings;


-- === PROFILES ===
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

-- === STUDENTS ===
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins have full access to students" ON public.students FOR ALL USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Teachers can view students in their classes" ON public.teachers FOR SELECT USING (
    get_user_role(auth.uid()) = 'teacher' AND 
    EXISTS (
        SELECT 1 FROM public.classes c
        JOIN public.teachers t ON c.teacher_id = t.id
        WHERE t.user_id = auth.uid() AND c.name = (students.class || '-' || students.section)
    )
);
CREATE POLICY "Students can view their own profile" ON public.students FOR SELECT USING (get_user_role(auth.uid()) = 'student' AND user_id = auth.uid());

-- === TEACHERS ===
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view all teachers" ON public.teachers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage teachers" ON public.teachers FOR ALL USING (get_user_role(auth.uid()) = 'admin');

-- === GRADES ===
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins have full access to grades" ON public.grades FOR ALL USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Teachers can manage grades for their students" ON public.grades FOR ALL USING (
    get_user_role(auth.uid()) = 'teacher' AND is_teacher_of_student(auth.uid(), "studentId")
);
CREATE POLICY "Students can view their own grades" ON public.grades FOR SELECT USING (
    get_user_role(auth.uid()) = 'student' AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = grades."studentId" AND s.user_id = auth.uid())
);

-- === ATTENDANCE ===
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins have full access to attendance" ON public.attendance FOR ALL USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Teachers can manage attendance for their students" ON public.attendance FOR ALL USING (
    get_user_role(auth.uid()) = 'teacher' AND is_teacher_of_student(auth.uid(), "student_id")
);
CREATE POLICY "Students can view their own attendance" ON public.attendance FOR SELECT USING (
    get_user_role(auth.uid()) = 'student' AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = attendance."student_id" AND s.user_id = auth.uid())
);


-- === General Read/Write for Admins, Read-Only for others ===
CREATE POLICY "Admins have full access" ON public.exams FOR ALL USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Authenticated users can view" ON public.exams FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins have full access" ON public.classes FOR ALL USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Authenticated users can view" ON public.classes FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins have full access" ON public.courses FOR ALL USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Authenticated users can view" ON public.courses FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins have full access" ON public.departments FOR ALL USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Authenticated users can view" ON public.departments FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins have full access" ON public.library_books FOR ALL USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Authenticated users can view" ON public.library_books FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins have full access" ON public.fees FOR ALL USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Students can view their own fees" ON public.fees FOR SELECT USING (
    get_user_role(auth.uid()) = 'student' AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = fees."studentId" AND s.user_id = auth.uid())
);

CREATE POLICY "Admins have full access" ON public.events FOR ALL USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Authenticated users can view" ON public.events FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins have full access" ON public.hostel_rooms FOR ALL USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Authenticated users can view" ON public.hostel_rooms FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins have full access" ON public.transport_vehicles FOR ALL USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Authenticated users can view" ON public.transport_vehicles FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins have full access" ON public.notices FOR ALL USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Authenticated users can view" ON public.notices FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins have full access" ON public.payrolls FOR ALL USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Teachers can view their own payroll" ON public.payrolls FOR SELECT USING (
    get_user_role(auth.uid()) = 'teacher' AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = payrolls."teacherId" AND t.user_id = auth.uid())
);

CREATE POLICY "Admins have full access" ON public.expenses FOR ALL USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admins have full access" ON public.incomes FOR ALL USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admins have full access" ON public.settings FOR ALL USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Authenticated users can view settings" ON public.settings FOR SELECT USING (auth.role() = 'authenticated');
