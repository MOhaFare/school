/*
          # [Operation Name]
          Comprehensive RLS Policy Update

          ## Query Description: [This script updates the Row Level Security (RLS) policies for all tables in the public schema to grant full CRUD (Create, Read, Update, Delete) access to any authenticated user. This is necessary to allow the application to function correctly after a user logs in. It replaces any existing, more restrictive policies.]

          ## Metadata:
          - Schema-Category: ["Security"]
          - Impact-Level: ["Medium"]
          - Requires-Backup: [false]
          - Reversible: [true]

          ## Structure Details:
          - Affects RLS policies on all user-created tables.

          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [Yes]
          - Auth Requirements: [Authenticated User]

          ## Performance Impact:
          - Indexes: [No change]
          - Triggers: [No change]
          - Estimated Impact: [Low. RLS checks are efficient.]
          */

-- Drop and Create Policies for all tables

-- Students
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.students;
CREATE POLICY "Enable all access for authenticated users" ON public.students FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Teachers
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.teachers;
CREATE POLICY "Enable all access for authenticated users" ON public.teachers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Exams
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.exams;
CREATE POLICY "Enable all access for authenticated users" ON public.exams FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Grades
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.grades;
CREATE POLICY "Enable all access for authenticated users" ON public.grades FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Payrolls
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.payrolls;
CREATE POLICY "Enable all access for authenticated users" ON public.payrolls FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Departments
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.departments;
CREATE POLICY "Enable all access for authenticated users" ON public.departments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Courses
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.courses;
CREATE POLICY "Enable all access for authenticated users" ON public.courses FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Library Books
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.library_books;
CREATE POLICY "Enable all access for authenticated users" ON public.library_books FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Fees
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.fees;
CREATE POLICY "Enable all access for authenticated users" ON public.fees FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Events
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.events;
CREATE POLICY "Enable all access for authenticated users" ON public.events FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Attendance
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.attendance;
CREATE POLICY "Enable all access for authenticated users" ON public.attendance FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Hostel Rooms
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.hostel_rooms;
CREATE POLICY "Enable all access for authenticated users" ON public.hostel_rooms FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Transport Vehicles
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.transport_vehicles;
CREATE POLICY "Enable all access for authenticated users" ON public.transport_vehicles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Notices
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.notices;
CREATE POLICY "Enable all access for authenticated users" ON public.notices FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Expenses
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.expenses;
CREATE POLICY "Enable all access for authenticated users" ON public.expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Incomes
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.incomes;
CREATE POLICY "Enable all access for authenticated users" ON public.incomes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Settings
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.settings;
CREATE POLICY "Enable all access for authenticated users" ON public.settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Profiles
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.profiles;
CREATE POLICY "Enable all access for authenticated users" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
