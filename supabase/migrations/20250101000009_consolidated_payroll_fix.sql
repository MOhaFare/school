/*
# [Consolidated Payroll Fix]
This script safely creates the payrolls table and its related components,
ensuring it can be run even if previous migrations partially completed.

## Query Description:
This operation is structural and safe. It checks for the existence of the
'payroll_status' type and the 'payrolls' table before creating them. It also
replaces any existing security policies to ensure they are up-to-date. No data
will be lost.

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: false
- Reversible: false

## Structure Details:
- Creates ENUM type 'payroll_status' if it doesn't exist.
- Creates table 'payrolls' if it doesn't exist.
- Creates RLS policies for 'payrolls'.

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes (recreates policies for select and all operations for authenticated users)
- Auth Requirements: Authenticated user role.

## Performance Impact:
- Indexes: Adds a primary key.
- Triggers: None.
- Estimated Impact: Negligible.
*/

-- Create the ENUM type for payroll status if it doesn't already exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payroll_status') THEN
        CREATE TYPE public.payroll_status AS ENUM (
            'paid',
            'pending',
            'processing'
        );
    END IF;
END$$;

-- Create the payrolls table if it doesn't already exist
CREATE TABLE IF NOT EXISTS public.payrolls (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    teacher_id uuid NOT NULL,
    teacher_name text NOT NULL,
    month text NOT NULL,
    year smallint NOT NULL,
    base_salary numeric NOT NULL,
    bonus numeric DEFAULT 0 NOT NULL,
    deductions numeric DEFAULT 0 NOT NULL,
    net_salary numeric NOT NULL,
    status public.payroll_status DEFAULT 'pending'::public.payroll_status NOT NULL,
    paid_date date,
    CONSTRAINT payrolls_pkey PRIMARY KEY (id),
    CONSTRAINT payrolls_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.payrolls ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Allow authenticated users to view payrolls" ON public.payrolls;
CREATE POLICY "Allow authenticated users to view payrolls"
ON public.payrolls
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to manage payrolls" ON public.payrolls;
CREATE POLICY "Allow authenticated users to manage payrolls"
ON public.payrolls
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
