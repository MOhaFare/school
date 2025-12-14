-- Add missing columns to students table
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS student_role text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS parent_name text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS parent_email text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS parent_phone text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS student_house text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.student_categories(id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_parent_email ON public.students(parent_email);
CREATE INDEX IF NOT EXISTS idx_students_category_id ON public.students(category_id);
