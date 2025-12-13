-- Create the ENUM type for attendance status if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_status') THEN
        CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'late');
    END IF;
END$$;

-- Create the attendance table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.attendance (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    student_id uuid NOT NULL,
    student_name text NOT NULL,
    date date NOT NULL,
    status public.attendance_status NOT NULL,
    "class" text,
    CONSTRAINT attendance_pkey PRIMARY KEY (id),
    CONSTRAINT attendance_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, to ensure a clean slate
DROP POLICY IF EXISTS "Allow authenticated users to read attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow authenticated users to insert attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow authenticated users to update attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow authenticated users to delete attendance" ON public.attendance;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users to read attendance"
ON public.attendance
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert attendance"
ON public.attendance
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update attendance"
ON public.attendance
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete attendance"
ON public.attendance
FOR DELETE
TO authenticated
USING (true);
