/*
  # Fix Missing Helper Function and Secure Tables
  
  1.  Creates the `set_school_id()` function which was missing.
  2.  Adds `school_id` column to `live_classes` and `online_exams` if missing.
  3.  Enables RLS (Row Level Security) on these tables.
  4.  Creates policies so users can only see/edit data from their own school.
  5.  Attaches the trigger to automatically set `school_id` on insert.
*/

-- 1. Create the missing trigger function
CREATE OR REPLACE FUNCTION public.set_school_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set if not already set
  IF NEW.school_id IS NULL THEN
    SELECT school_id INTO NEW.school_id
    FROM public.profiles
    WHERE id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ensure tables have school_id column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'live_classes' AND column_name = 'school_id') THEN
        ALTER TABLE public.live_classes ADD COLUMN school_id UUID REFERENCES public.schools(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'online_exams' AND column_name = 'school_id') THEN
        ALTER TABLE public.online_exams ADD COLUMN school_id UUID REFERENCES public.schools(id);
    END IF;
END $$;

-- 3. Enable RLS
ALTER TABLE public.live_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_exams ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies to avoid conflicts and recreate them
DROP POLICY IF EXISTS "Users can view live classes from their school" ON public.live_classes;
DROP POLICY IF EXISTS "Users can insert live classes for their school" ON public.live_classes;
DROP POLICY IF EXISTS "Users can update live classes for their school" ON public.live_classes;
DROP POLICY IF EXISTS "Users can delete live classes for their school" ON public.live_classes;

DROP POLICY IF EXISTS "Users can view online exams from their school" ON public.online_exams;
DROP POLICY IF EXISTS "Users can insert online exams for their school" ON public.online_exams;
DROP POLICY IF EXISTS "Users can update online exams for their school" ON public.online_exams;
DROP POLICY IF EXISTS "Users can delete online exams for their school" ON public.online_exams;

-- 5. Create Policies for Live Classes
CREATE POLICY "Users can view live classes from their school"
ON public.live_classes FOR SELECT
USING (
  school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid()) 
  OR 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'system_admin'
);

CREATE POLICY "Users can insert live classes for their school"
ON public.live_classes FOR INSERT
WITH CHECK (
  school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid())
  OR 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'system_admin'
);

CREATE POLICY "Users can update live classes for their school"
ON public.live_classes FOR UPDATE
USING (
  school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid())
  OR 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'system_admin'
);

CREATE POLICY "Users can delete live classes for their school"
ON public.live_classes FOR DELETE
USING (
  school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid())
  OR 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'system_admin'
);

-- 6. Create Policies for Online Exams
CREATE POLICY "Users can view online exams from their school"
ON public.online_exams FOR SELECT
USING (
  school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid())
  OR 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'system_admin'
);

CREATE POLICY "Users can insert online exams for their school"
ON public.online_exams FOR INSERT
WITH CHECK (
  school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid())
  OR 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'system_admin'
);

CREATE POLICY "Users can update online exams for their school"
ON public.online_exams FOR UPDATE
USING (
  school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid())
  OR 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'system_admin'
);

CREATE POLICY "Users can delete online exams for their school"
ON public.online_exams FOR DELETE
USING (
  school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid())
  OR 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'system_admin'
);

-- 7. Attach Triggers
DROP TRIGGER IF EXISTS set_live_classes_school_id ON public.live_classes;
CREATE TRIGGER set_live_classes_school_id
BEFORE INSERT ON public.live_classes
FOR EACH ROW
EXECUTE FUNCTION public.set_school_id();

DROP TRIGGER IF EXISTS set_online_exams_school_id ON public.online_exams;
CREATE TRIGGER set_online_exams_school_id
BEFORE INSERT ON public.online_exams
FOR EACH ROW
EXECUTE FUNCTION public.set_school_id();
