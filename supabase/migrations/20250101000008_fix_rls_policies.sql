-- Fixes Row Level Security (RLS) policies for all tables to allow authenticated users to write data.

/*
          # [Update RLS Policies]
          This script updates the Row Level Security (RLS) policies for all application tables.
          The previous policies were too restrictive, only allowing users to read data. This
          script grants full CRUD (Create, Read, Update, Delete) access to any authenticated user.

          ## Query Description: [This operation updates security policies to enable full database access for logged-in users. It drops old, read-only policies and replaces them with new, permissive ones. There is no risk to existing data.]
          
          ## Metadata:
          - Schema-Category: "Security"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Affects RLS policies on all tables except `auth.*` and `storage.*`.
          
          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes
          - Auth Requirements: This enables write access for any authenticated user.
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: Negligible performance impact.
          */

-- Drop old policies and create new permissive policies for each table

-- For students
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.students;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.students;
CREATE POLICY "Enable all access for authenticated users" ON public.students FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- For teachers
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.teachers;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.teachers;
CREATE POLICY "Enable all access for authenticated users" ON public.teachers FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- For exams
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.exams;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.exams;
CREATE POLICY "Enable all access for authenticated users" ON public.exams FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- For grades
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.grades;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.grades;
CREATE POLICY "Enable all access for authenticated users" ON public.grades FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- For payrolls
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.payrolls;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.payrolls;
CREATE POLICY "Enable all access for authenticated users" ON public.payrolls FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- For courses
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.courses;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.courses;
CREATE POLICY "Enable all access for authenticated users" ON public.courses FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- For departments
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.departments;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.departments;
CREATE POLICY "Enable all access for authenticated users" ON public.departments FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- For library_books
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.library_books;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.library_books;
CREATE POLICY "Enable all access for authenticated users" ON public.library_books FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- For fees
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.fees;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.fees;
CREATE POLICY "Enable all access for authenticated users" ON public.fees FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- For events
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.events;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.events;
CREATE POLICY "Enable all access for authenticated users" ON public.events FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- For attendance
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.attendance;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.attendance;
CREATE POLICY "Enable all access for authenticated users" ON public.attendance FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- For hostel_rooms
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.hostel_rooms;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.hostel_rooms;
CREATE POLICY "Enable all access for authenticated users" ON public.hostel_rooms FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- For transport_vehicles
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.transport_vehicles;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.transport_vehicles;
CREATE POLICY "Enable all access for authenticated users" ON public.transport_vehicles FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- For notices
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.notices;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.notices;
CREATE POLICY "Enable all access for authenticated users" ON public.notices FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- For expenses
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.expenses;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.expenses;
CREATE POLICY "Enable all access for authenticated users" ON public.expenses FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- For incomes
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.incomes;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.incomes;
CREATE POLICY "Enable all access for authenticated users" ON public.incomes FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- For settings
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.settings;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.settings;
CREATE POLICY "Enable all access for authenticated users" ON public.settings FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
