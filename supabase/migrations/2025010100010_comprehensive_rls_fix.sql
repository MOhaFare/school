-- =================================================================
-- This script updates the Row Level Security (RLS) policies for all tables
-- to allow authenticated users to insert, update, and delete data.
-- This resolves the "can't insert any data" issue.
-- =================================================================

-- Students
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON "public"."students";
CREATE POLICY "Enable all access for authenticated users" ON "public"."students" FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Teachers
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON "public"."teachers";
CREATE POLICY "Enable all access for authenticated users" ON "public"."teachers" FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Exams
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON "public"."exams";
CREATE POLICY "Enable all access for authenticated users" ON "public"."exams" FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Grades
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON "public"."grades";
CREATE POLICY "Enable all access for authenticated users" ON "public"."grades" FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Courses
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON "public"."courses";
CREATE POLICY "Enable all access for authenticated users" ON "public"."courses" FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Departments
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON "public"."departments";
CREATE POLICY "Enable all access for authenticated users" ON "public"."departments" FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Library Books
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON "public"."library_books";
CREATE POLICY "Enable all access for authenticated users" ON "public"."library_books" FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Fees
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON "public"."fees";
CREATE POLICY "Enable all access for authenticated users" ON "public"."fees" FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Events
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON "public"."events";
CREATE POLICY "Enable all access for authenticated users" ON "public"."events" FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Attendance
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON "public"."attendance";
CREATE POLICY "Enable all access for authenticated users" ON "public"."attendance" FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Hostel Rooms
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON "public"."hostel_rooms";
CREATE POLICY "Enable all access for authenticated users" ON "public"."hostel_rooms" FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Transport Vehicles
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON "public"."transport_vehicles";
CREATE POLICY "Enable all access for authenticated users" ON "public"."transport_vehicles" FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Notices
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON "public"."notices";
CREATE POLICY "Enable all access for authenticated users" ON "public"."notices" FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Expenses
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON "public"."expenses";
CREATE POLICY "Enable all access for authenticated users" ON "public"."expenses" FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Incomes
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON "public"."incomes";
CREATE POLICY "Enable all access for authenticated users" ON "public"."incomes" FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Settings
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON "public"."settings";
CREATE POLICY "Enable all access for authenticated users" ON "public"."settings" FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Profiles (Specific policy to only allow users to manage their own profile)
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON "public"."profiles";
DROP POLICY IF EXISTS "Users can insert their own profile." ON "public"."profiles";
DROP POLICY IF EXISTS "Users can update their own profile." ON "public"."profiles";
CREATE POLICY "Users can insert their own profile." ON "public"."profiles" FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON "public"."profiles" FOR UPDATE TO authenticated USING (auth.uid() = id);


-- Payrolls
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON "public"."payrolls";
CREATE POLICY "Enable all access for authenticated users" ON "public"."payrolls" FOR ALL TO authenticated USING (true) WITH CHECK (true);
