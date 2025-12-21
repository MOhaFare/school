/*
  # Fix Schema and Modules
  1. Creates 'online_exam_questions' if missing.
  2. Creates 'subject_groups' if missing.
  3. Adds 'subject_group_id' to 'classes'.
  4. Ensures 'fee_masters' has 'grade' column.
*/

-- 1. Online Exam Questions
CREATE TABLE IF NOT EXISTS public.online_exam_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_id UUID NOT NULL REFERENCES online_exams(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT,
    option_d TEXT,
    correct_option TEXT NOT NULL CHECK (correct_option IN ('a', 'b', 'c', 'd')),
    marks INTEGER DEFAULT 1,
    school_id UUID DEFAULT get_auth_school_id(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.online_exam_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "School Isolation Policy" ON public.online_exam_questions;
CREATE POLICY "School Isolation Policy" ON public.online_exam_questions
    AS PERMISSIVE FOR ALL TO authenticated
    USING (school_id = get_auth_school_id() OR is_system_admin())
    WITH CHECK (school_id = get_auth_school_id() OR is_system_admin());

-- 2. Subject Groups (For assigning subjects to classes)
CREATE TABLE IF NOT EXISTS public.subject_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID DEFAULT get_auth_school_id(),
    name TEXT NOT NULL,
    description TEXT,
    subjects TEXT[], -- Array of subject names
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.subject_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "School Isolation Policy" ON public.subject_groups;
CREATE POLICY "School Isolation Policy" ON public.subject_groups
    AS PERMISSIVE FOR ALL TO authenticated
    USING (school_id = get_auth_school_id() OR is_system_admin())
    WITH CHECK (school_id = get_auth_school_id() OR is_system_admin());

-- 3. Link Classes to Subject Groups
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'subject_group_id') THEN
        ALTER TABLE public.classes ADD COLUMN subject_group_id UUID REFERENCES public.subject_groups(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Ensure Fee Masters Grade Column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fee_masters' AND column_name = 'grade') THEN
        ALTER TABLE public.fee_masters ADD COLUMN grade TEXT;
    END IF;
END $$;

-- 5. Fix Payrolls RLS just in case
ALTER TABLE public.payrolls ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "School Isolation Policy" ON public.payrolls;
CREATE POLICY "School Isolation Policy" ON public.payrolls
    AS PERMISSIVE FOR ALL TO authenticated
    USING (school_id = get_auth_school_id() OR is_system_admin())
    WITH CHECK (school_id = get_auth_school_id() OR is_system_admin());
