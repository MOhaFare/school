/*
  # [Initial Schema Setup]
  This script sets up the entire database schema for the School Management System, including tables for all modules, custom types for statuses, and foreign key relationships. It also enables Row Level Security (RLS) on all tables and creates a public storage bucket for avatars.

  ## Query Description: [This is a foundational script that creates the entire database structure. It is safe to run on a new, empty project, but running it on a project with existing tables of the same name will cause errors. It does not delete any data but establishes the necessary tables for the application to function with a database.]
  
  ## Metadata:
  - Schema-Category: ["Structural"]
  - Impact-Level: ["High"]
  - Requires-Backup: [false]
  - Reversible: [false]
  
  ## Structure Details:
  - Creates 17 tables: teachers, students, departments, courses, exams, grades, payroll, library_books, fees, events, attendance_records, hostel_rooms, hostel_occupants, transport_vehicles, notices, expenses, incomes.
  - Creates 12 ENUM types for status fields.
  - Establishes foreign key constraints between related tables.
  - Creates a public storage bucket named 'avatars'.
  
  ## Security Implications:
  - RLS Status: [Enabled] on all new tables.
  - Policy Changes: [Yes], creates default policies allowing authenticated users to read all data and service_role to perform all actions.
  - Auth Requirements: [Policies are based on Supabase's 'authenticated' role.]
  
  ## Performance Impact:
  - Indexes: [Added] Primary keys and foreign keys are indexed by default.
  - Triggers: [None]
  - Estimated Impact: [Low on an empty database. Establishes the structure for future performance considerations.]
*/

-- Create ENUM types
CREATE TYPE public.teacher_status AS ENUM ('active', 'inactive');
CREATE TYPE public.student_status AS ENUM ('active', 'inactive');
CREATE TYPE public.exam_status AS ENUM ('upcoming', 'ongoing', 'completed');
CREATE TYPE public.payroll_status AS ENUM ('paid', 'pending', 'processing');
CREATE TYPE public.book_status AS ENUM ('available', 'unavailable');
CREATE TYPE public.fee_status AS ENUM ('paid', 'unpaid', 'overdue');
CREATE TYPE public.event_type AS ENUM ('academic', 'sports', 'cultural', 'other');
CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'late');
CREATE TYPE public.hostel_room_status AS ENUM ('available', 'full', 'maintenance');
CREATE TYPE public.notice_audience AS ENUM ('all', 'students', 'teachers');
CREATE TYPE public.expense_category AS ENUM ('salaries', 'utilities', 'maintenance', 'supplies', 'technology', 'other');
CREATE TYPE public.income_category AS ENUM ('donations', 'grants', 'rentals', 'fundraising', 'other');

-- Table: teachers
CREATE TABLE public.teachers (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    name text NOT NULL,
    email text NOT NULL UNIQUE,
    subject text,
    phone text,
    join_date date,
    dob date,
    salary numeric,
    status public.teacher_status DEFAULT 'active',
    avatar_url text,
    CONSTRAINT teachers_pkey PRIMARY KEY (id)
);
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read access to teachers" ON public.teachers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow service_role all access to teachers" ON public.teachers FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Table: students
CREATE TABLE public.students (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    name text NOT NULL,
    email text NOT NULL UNIQUE,
    class text,
    section text,
    roll_number text,
    phone text,
    enrollment_date date,
    dob date,
    status public.student_status DEFAULT 'active',
    avatar_url text,
    grade text,
    CONSTRAINT students_pkey PRIMARY KEY (id)
);
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read access to students" ON public.students FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow service_role all access to students" ON public.students FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Table: departments
CREATE TABLE public.departments (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    name text NOT NULL,
    head_of_department_id uuid REFERENCES public.teachers(id) ON DELETE SET NULL,
    description text,
    CONSTRAINT departments_pkey PRIMARY KEY (id)
);
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read access to departments" ON public.departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow service_role all access to departments" ON public.departments FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Table: courses
CREATE TABLE public.courses (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    name text NOT NULL,
    code text,
    teacher_id uuid REFERENCES public.teachers(id) ON DELETE SET NULL,
    credits integer,
    department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
    CONSTRAINT courses_pkey PRIMARY KEY (id)
);
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read access to courses" ON public.courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow service_role all access to courses" ON public.courses FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Table: exams
CREATE TABLE public.exams (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    name text NOT NULL,
    subject text,
    class text,
    date date,
    total_marks integer,
    passing_marks integer,
    duration text,
    status public.exam_status DEFAULT 'upcoming',
    CONSTRAINT exams_pkey PRIMARY KEY (id)
);
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read access to exams" ON public.exams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow service_role all access to exams" ON public.exams FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Table: grades
CREATE TABLE public.grades (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    marks_obtained numeric NOT NULL,
    CONSTRAINT grades_pkey PRIMARY KEY (id),
    CONSTRAINT grades_student_exam_unique UNIQUE (student_id, exam_id)
);
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read access to grades" ON public.grades FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow service_role all access to grades" ON public.grades FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Table: payroll
CREATE TABLE public.payroll (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    month text NOT NULL,
    year integer NOT NULL,
    base_salary numeric,
    bonus numeric,
    deductions numeric,
    net_salary numeric,
    status public.payroll_status DEFAULT 'pending',
    paid_date date,
    CONSTRAINT payroll_pkey PRIMARY KEY (id)
);
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read access to payroll" ON public.payroll FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow service_role all access to payroll" ON public.payroll FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Table: library_books
CREATE TABLE public.library_books (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    title text NOT NULL,
    author text,
    isbn text UNIQUE,
    genre text,
    quantity integer,
    available integer,
    status public.book_status DEFAULT 'available',
    CONSTRAINT library_books_pkey PRIMARY KEY (id)
);
ALTER TABLE public.library_books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read access to library_books" ON public.library_books FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow service_role all access to library_books" ON public.library_books FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Table: fees
CREATE TABLE public.fees (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    amount numeric NOT NULL,
    due_date date,
    status public.fee_status DEFAULT 'unpaid',
    payment_date date,
    description text,
    CONSTRAINT fees_pkey PRIMARY KEY (id)
);
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read access to fees" ON public.fees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow service_role all access to fees" ON public.fees FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Table: events
CREATE TABLE public.events (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    title text NOT NULL,
    date date,
    "time" time,
    location text,
    description text,
    type public.event_type DEFAULT 'other',
    CONSTRAINT events_pkey PRIMARY KEY (id)
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read access to events" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow service_role all access to events" ON public.events FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Table: attendance_records
CREATE TABLE public.attendance_records (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    date date NOT NULL,
    status public.attendance_status NOT NULL,
    class text,
    CONSTRAINT attendance_records_pkey PRIMARY KEY (id),
    CONSTRAINT attendance_records_student_date_unique UNIQUE (student_id, date)
);
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read access to attendance_records" ON public.attendance_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow service_role all access to attendance_records" ON public.attendance_records FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Table: hostel_rooms
CREATE TABLE public.hostel_rooms (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    room_number text NOT NULL UNIQUE,
    building text,
    capacity integer,
    status public.hostel_room_status DEFAULT 'available',
    CONSTRAINT hostel_rooms_pkey PRIMARY KEY (id)
);
ALTER TABLE public.hostel_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read access to hostel_rooms" ON public.hostel_rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow service_role all access to hostel_rooms" ON public.hostel_rooms FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Join Table: hostel_occupants
CREATE TABLE public.hostel_occupants (
    room_id uuid NOT NULL REFERENCES public.hostel_rooms(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    CONSTRAINT hostel_occupants_pkey PRIMARY KEY (room_id, student_id)
);
ALTER TABLE public.hostel_occupants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read access to hostel_occupants" ON public.hostel_occupants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow service_role all access to hostel_occupants" ON public.hostel_occupants FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Table: transport_vehicles
CREATE TABLE public.transport_vehicles (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    vehicle_number text NOT NULL UNIQUE,
    driver_name text,
    route text,
    capacity integer,
    student_count integer,
    CONSTRAINT transport_vehicles_pkey PRIMARY KEY (id)
);
ALTER TABLE public.transport_vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read access to transport_vehicles" ON public.transport_vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow service_role all access to transport_vehicles" ON public.transport_vehicles FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Table: notices
CREATE TABLE public.notices (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    title text NOT NULL,
    content text,
    author_name text,
    date date,
    audience public.notice_audience DEFAULT 'all',
    CONSTRAINT notices_pkey PRIMARY KEY (id)
);
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read access to notices" ON public.notices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow service_role all access to notices" ON public.notices FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Table: expenses
CREATE TABLE public.expenses (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    title text NOT NULL,
    category public.expense_category,
    amount numeric NOT NULL,
    date date,
    description text,
    CONSTRAINT expenses_pkey PRIMARY KEY (id)
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read access to expenses" ON public.expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow service_role all access to expenses" ON public.expenses FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Table: incomes
CREATE TABLE public.incomes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    title text NOT NULL,
    category public.income_category,
    amount numeric NOT NULL,
    date date,
    description text,
    CONSTRAINT incomes_pkey PRIMARY KEY (id)
);
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read access to incomes" ON public.incomes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow service_role all access to incomes" ON public.incomes FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Storage: Create 'avatars' bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'avatars' bucket
CREATE POLICY "Allow public read access to avatars" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');
CREATE POLICY "Allow authenticated users to upload avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Allow authenticated users to update their own avatars" ON storage.objects FOR UPDATE TO authenticated USING (auth.uid() = owner) WITH CHECK (auth.uid() = owner);
CREATE POLICY "Allow authenticated users to delete their own avatars" ON storage.objects FOR DELETE TO authenticated USING (auth.uid() = owner);
