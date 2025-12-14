-- Create student_categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.student_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.student_categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view categories from their school" ON public.student_categories
    FOR SELECT USING (auth.uid() IN (
        SELECT id FROM public.profiles WHERE school_id = public.student_categories.school_id OR role = 'system_admin'
    ));

CREATE POLICY "Admins can insert categories for their school" ON public.student_categories
    FOR INSERT WITH CHECK (auth.uid() IN (
        SELECT id FROM public.profiles WHERE school_id = public.student_categories.school_id AND role IN ('admin', 'principal', 'system_admin')
    ));

CREATE POLICY "Admins can update categories for their school" ON public.student_categories
    FOR UPDATE USING (auth.uid() IN (
        SELECT id FROM public.profiles WHERE school_id = public.student_categories.school_id AND role IN ('admin', 'principal', 'system_admin')
    ));

CREATE POLICY "Admins can delete categories for their school" ON public.student_categories
    FOR DELETE USING (auth.uid() IN (
        SELECT id FROM public.profiles WHERE school_id = public.student_categories.school_id AND role IN ('admin', 'principal', 'system_admin')
    ));

-- Insert default categories for existing schools (optional, helps to have some data)
-- This uses a DO block to loop through schools and add defaults if they don't have any
DO $$
DECLARE
    school_record RECORD;
BEGIN
    FOR school_record IN SELECT id FROM public.schools LOOP
        IF NOT EXISTS (SELECT 1 FROM public.student_categories WHERE school_id = school_record.id) THEN
            INSERT INTO public.student_categories (name, school_id) VALUES 
            ('General', school_record.id),
            ('Scholarship', school_record.id),
            ('Staff Child', school_record.id),
            ('Sibling', school_record.id);
        END IF;
    END LOOP;
END $$;
