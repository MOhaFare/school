/*
  # Secure Live Classes and Online Exams
  
  1. Security
    - Enable RLS on `live_classes` and `online_exams`
    - Add policies to ensure users only see data for their school
    - Add triggers to automatically set `school_id` on insert
*/

-- 1. Enable RLS
ALTER TABLE live_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE online_exams ENABLE ROW LEVEL SECURITY;

-- 2. Create Policies for live_classes
DROP POLICY IF EXISTS "School Isolation Select" ON live_classes;
CREATE POLICY "School Isolation Select" ON live_classes 
    FOR SELECT USING (school_id = (SELECT school_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "School Isolation Insert" ON live_classes;
CREATE POLICY "School Isolation Insert" ON live_classes 
    FOR INSERT WITH CHECK (school_id = (SELECT school_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "School Isolation Update" ON live_classes;
CREATE POLICY "School Isolation Update" ON live_classes 
    FOR UPDATE USING (school_id = (SELECT school_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "School Isolation Delete" ON live_classes;
CREATE POLICY "School Isolation Delete" ON live_classes 
    FOR DELETE USING (school_id = (SELECT school_id FROM profiles WHERE id = auth.uid()));

-- 3. Create Policies for online_exams
DROP POLICY IF EXISTS "School Isolation Select" ON online_exams;
CREATE POLICY "School Isolation Select" ON online_exams 
    FOR SELECT USING (school_id = (SELECT school_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "School Isolation Insert" ON online_exams;
CREATE POLICY "School Isolation Insert" ON online_exams 
    FOR INSERT WITH CHECK (school_id = (SELECT school_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "School Isolation Update" ON online_exams;
CREATE POLICY "School Isolation Update" ON online_exams 
    FOR UPDATE USING (school_id = (SELECT school_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "School Isolation Delete" ON online_exams;
CREATE POLICY "School Isolation Delete" ON online_exams 
    FOR DELETE USING (school_id = (SELECT school_id FROM profiles WHERE id = auth.uid()));

-- 4. Attach Auto-Assignment Triggers
-- Note: set_school_id() function was created in migration 20250304000007

DROP TRIGGER IF EXISTS set_school_id_live_classes ON live_classes;
CREATE TRIGGER set_school_id_live_classes
  BEFORE INSERT ON live_classes
  FOR EACH ROW
  EXECUTE FUNCTION set_school_id();

DROP TRIGGER IF EXISTS set_school_id_online_exams ON online_exams;
CREATE TRIGGER set_school_id_online_exams
  BEFORE INSERT ON online_exams
  FOR EACH ROW
  EXECUTE FUNCTION set_school_id();
