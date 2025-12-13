-- 1. Helper function to get current user's school_id
CREATE OR REPLACE FUNCTION get_my_school_id()
RETURNS UUID AS $$
  SELECT school_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. Helper to check if super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'system_admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. Add school_id to tables that might miss it
DO $$ 
BEGIN 
    -- Classes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'school_id') THEN
        ALTER TABLE public.classes ADD COLUMN school_id UUID REFERENCES public.schools(id);
    END IF;
    -- Fees
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fees' AND column_name = 'school_id') THEN
        ALTER TABLE public.fees ADD COLUMN school_id UUID REFERENCES public.schools(id);
    END IF;
    -- Exams
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exams' AND column_name = 'school_id') THEN
        ALTER TABLE public.exams ADD COLUMN school_id UUID REFERENCES public.schools(id);
    END IF;
    -- Grades
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grades' AND column_name = 'school_id') THEN
        ALTER TABLE public.grades ADD COLUMN school_id UUID REFERENCES public.schools(id);
    END IF;
    -- Attendance
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance' AND column_name = 'school_id') THEN
        ALTER TABLE public.attendance ADD COLUMN school_id UUID REFERENCES public.schools(id);
    END IF;
    -- Events
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'school_id') THEN
        ALTER TABLE public.events ADD COLUMN school_id UUID REFERENCES public.schools(id);
    END IF;
    -- Notices
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notices' AND column_name = 'school_id') THEN
        ALTER TABLE public.notices ADD COLUMN school_id UUID REFERENCES public.schools(id);
    END IF;
    -- Courses
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'school_id') THEN
        ALTER TABLE public.courses ADD COLUMN school_id UUID REFERENCES public.schools(id);
    END IF;
    -- Departments
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'departments' AND column_name = 'school_id') THEN
        ALTER TABLE public.departments ADD COLUMN school_id UUID REFERENCES public.schools(id);
    END IF;
    -- Library
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'library_books' AND column_name = 'school_id') THEN
        ALTER TABLE public.library_books ADD COLUMN school_id UUID REFERENCES public.schools(id);
    END IF;
    -- Inventory
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'school_id') THEN
        ALTER TABLE public.inventory_items ADD COLUMN school_id UUID REFERENCES public.schools(id);
    END IF;
    -- Transport
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transport_vehicles' AND column_name = 'school_id') THEN
        ALTER TABLE public.transport_vehicles ADD COLUMN school_id UUID REFERENCES public.schools(id);
    END IF;
    -- Hostel
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hostel_rooms' AND column_name = 'school_id') THEN
        ALTER TABLE public.hostel_rooms ADD COLUMN school_id UUID REFERENCES public.schools(id);
    END IF;
END $$;

-- 4. Backfill school_id based on relationships (Data Repair)
-- Update Fees based on Student
UPDATE public.fees f SET school_id = s.school_id FROM public.students s WHERE f.student_id = s.id AND f.school_id IS NULL;
-- Update Grades based on Student
UPDATE public.grades g SET school_id = s.school_id FROM public.students s WHERE g.student_id = s.id AND g.school_id IS NULL;
-- Update Attendance based on Student
UPDATE public.attendance a SET school_id = s.school_id FROM public.students s WHERE a.student_id = s.id AND a.school_id IS NULL;
-- Update Classes based on Teacher
UPDATE public.classes c SET school_id = t.school_id FROM public.teachers t WHERE c.teacher_id = t.id AND c.school_id IS NULL;

-- 5. Create Trigger to automatically assign school_id on INSERT
CREATE OR REPLACE FUNCTION set_school_id_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set if not already provided
  IF NEW.school_id IS NULL THEN
    NEW.school_id := get_my_school_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to all tables
DROP TRIGGER IF EXISTS set_school_id_fees ON public.fees;
CREATE TRIGGER set_school_id_fees BEFORE INSERT ON public.fees FOR EACH ROW EXECUTE FUNCTION set_school_id_trigger_func();

DROP TRIGGER IF EXISTS set_school_id_classes ON public.classes;
CREATE TRIGGER set_school_id_classes BEFORE INSERT ON public.classes FOR EACH ROW EXECUTE FUNCTION set_school_id_trigger_func();

DROP TRIGGER IF EXISTS set_school_id_exams ON public.exams;
CREATE TRIGGER set_school_id_exams BEFORE INSERT ON public.exams FOR EACH ROW EXECUTE FUNCTION set_school_id_trigger_func();

DROP TRIGGER IF EXISTS set_school_id_grades ON public.grades;
CREATE TRIGGER set_school_id_grades BEFORE INSERT ON public.grades FOR EACH ROW EXECUTE FUNCTION set_school_id_trigger_func();

DROP TRIGGER IF EXISTS set_school_id_attendance ON public.attendance;
CREATE TRIGGER set_school_id_attendance BEFORE INSERT ON public.attendance FOR EACH ROW EXECUTE FUNCTION set_school_id_trigger_func();

DROP TRIGGER IF EXISTS set_school_id_events ON public.events;
CREATE TRIGGER set_school_id_events BEFORE INSERT ON public.events FOR EACH ROW EXECUTE FUNCTION set_school_id_trigger_func();

DROP TRIGGER IF EXISTS set_school_id_notices ON public.notices;
CREATE TRIGGER set_school_id_notices BEFORE INSERT ON public.notices FOR EACH ROW EXECUTE FUNCTION set_school_id_trigger_func();

DROP TRIGGER IF EXISTS set_school_id_courses ON public.courses;
CREATE TRIGGER set_school_id_courses BEFORE INSERT ON public.courses FOR EACH ROW EXECUTE FUNCTION set_school_id_trigger_func();

DROP TRIGGER IF EXISTS set_school_id_library ON public.library_books;
CREATE TRIGGER set_school_id_library BEFORE INSERT ON public.library_books FOR EACH ROW EXECUTE FUNCTION set_school_id_trigger_func();

DROP TRIGGER IF EXISTS set_school_id_inventory ON public.inventory_items;
CREATE TRIGGER set_school_id_inventory BEFORE INSERT ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION set_school_id_trigger_func();

DROP TRIGGER IF EXISTS set_school_id_transport ON public.transport_vehicles;
CREATE TRIGGER set_school_id_transport BEFORE INSERT ON public.transport_vehicles FOR EACH ROW EXECUTE FUNCTION set_school_id_trigger_func();

DROP TRIGGER IF EXISTS set_school_id_hostel ON public.hostel_rooms;
CREATE TRIGGER set_school_id_hostel BEFORE INSERT ON public.hostel_rooms FOR EACH ROW EXECUTE FUNCTION set_school_id_trigger_func();


-- 6. Enable RLS and Apply Isolation Policies
-- We drop existing policies to ensure clean slate for these tables
DO $$ 
DECLARE 
    tables TEXT[] := ARRAY['students', 'teachers', 'classes', 'fees', 'exams', 'grades', 'attendance', 'events', 'notices', 'courses', 'departments', 'library_books', 'inventory_items', 'transport_vehicles', 'hostel_rooms'];
    t TEXT;
BEGIN 
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
        
        -- Drop existing policies to avoid conflicts
        EXECUTE format('DROP POLICY IF EXISTS "School Isolation Select" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "School Isolation Insert" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "School Isolation Update" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "School Isolation Delete" ON public.%I', t);
        
        -- Create new strict policies
        -- SELECT: Users can see rows from their school OR if they are super admin
        EXECUTE format('CREATE POLICY "School Isolation Select" ON public.%I FOR SELECT USING (school_id = get_my_school_id() OR is_super_admin())', t);
        
        -- INSERT: Users can insert rows for their school OR if super admin
        EXECUTE format('CREATE POLICY "School Isolation Insert" ON public.%I FOR INSERT WITH CHECK (school_id = get_my_school_id() OR is_super_admin())', t);
        
        -- UPDATE: Users can update rows from their school OR if super admin
        EXECUTE format('CREATE POLICY "School Isolation Update" ON public.%I FOR UPDATE USING (school_id = get_my_school_id() OR is_super_admin())', t);
        
        -- DELETE: Users can delete rows from their school OR if super admin
        EXECUTE format('CREATE POLICY "School Isolation Delete" ON public.%I FOR DELETE USING (school_id = get_my_school_id() OR is_super_admin())', t);
    END LOOP;
END $$;
