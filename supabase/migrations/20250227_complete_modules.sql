-- Timetable
CREATE TABLE IF NOT EXISTS public.timetables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  day_of_week TEXT NOT NULL, -- Monday, Tuesday, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL
);

-- Inventory
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity INTEGER DEFAULT 0,
  unit_price DECIMAL(10, 2) DEFAULT 0,
  supplier TEXT,
  purchase_date DATE,
  description TEXT
);

-- Library Issues
CREATE TABLE IF NOT EXISTS public.library_issues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  book_id UUID REFERENCES public.library_books(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  return_date DATE,
  status TEXT DEFAULT 'issued' -- issued, returned, overdue
);

-- Leaves
CREATE TABLE IF NOT EXISTS public.leaves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- Sick, Casual, etc.
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' -- pending, approved, rejected
);

-- Certificates
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  certificate_type TEXT NOT NULL,
  issue_date DATE DEFAULT CURRENT_DATE,
  certificate_number TEXT UNIQUE
);

-- Enable RLS
ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Create simplified policies (Allow read/write for authenticated users for now)
CREATE POLICY "Enable read access for all users" ON public.timetables FOR SELECT USING (true);
CREATE POLICY "Enable write access for authenticated" ON public.timetables FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON public.inventory_items FOR SELECT USING (true);
CREATE POLICY "Enable write access for authenticated" ON public.inventory_items FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON public.library_issues FOR SELECT USING (true);
CREATE POLICY "Enable write access for authenticated" ON public.library_issues FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON public.leaves FOR SELECT USING (true);
CREATE POLICY "Enable write access for authenticated" ON public.leaves FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON public.certificates FOR SELECT USING (true);
CREATE POLICY "Enable write access for authenticated" ON public.certificates FOR ALL USING (auth.role() = 'authenticated');
