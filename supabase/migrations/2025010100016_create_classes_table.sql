/*
  # Create Classes Table
  This script creates the 'classes' table and its associated security policies.
  It is designed to be safely re-runnable.

  ## Query Description:
  - Creates the 'classes' table if it does not already exist.
  - Defines columns for class name and links to a teacher.
  - Enables Row Level Security and sets up basic policies for access.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (by dropping the table)
*/

-- Create the classes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.classes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    teacher_id uuid REFERENCES public.teachers(id) ON DELETE SET NULL,
    CONSTRAINT classes_pkey PRIMARY KEY (id),
    CONSTRAINT classes_name_key UNIQUE (name)
);

-- Enable Row Level Security
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Create policies for classes
DROP POLICY IF EXISTS "Allow all users to view classes" ON public.classes;
CREATE POLICY "Allow all users to view classes"
ON public.classes
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow admins to manage classes" ON public.classes;
CREATE POLICY "Allow admins to manage classes"
ON public.classes
FOR ALL
USING (auth.role() = 'admin'::text)
WITH CHECK (auth.role() = 'admin'::text);
