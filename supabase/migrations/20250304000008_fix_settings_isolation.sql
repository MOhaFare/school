-- Fix Settings Table Isolation
-- This ensures that settings (School Name, Fees, etc.) are unique per school

-- 1. Add school_id to settings if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'school_id') THEN
        ALTER TABLE settings ADD COLUMN school_id UUID REFERENCES schools(id);
    END IF;
END $$;

-- 2. Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 3. Drop old unique constraint on 'key' if it exists (it was likely global)
ALTER TABLE settings DROP CONSTRAINT IF EXISTS settings_key_key;

-- 4. Add new unique constraint on (school_id, key)
-- We use a unique index which acts as a constraint and allows NULL school_id for system-wide defaults if needed
DROP INDEX IF EXISTS settings_school_key_idx;
CREATE UNIQUE INDEX settings_school_key_idx ON settings (school_id, key);

-- 5. Create RLS Policies for Settings

-- Policy: Users can see settings for their own school
DROP POLICY IF EXISTS "Users can view own school settings" ON settings;
CREATE POLICY "Users can view own school settings" ON settings
    FOR SELECT
    USING (
        school_id = (SELECT school_id FROM profiles WHERE id = auth.uid())
        OR 
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'system_admin')
    );

-- Policy: School Admins can insert/update their own school settings
DROP POLICY IF EXISTS "Admins can manage own school settings" ON settings;
CREATE POLICY "Admins can manage own school settings" ON settings
    FOR ALL
    USING (
        school_id = (SELECT school_id FROM profiles WHERE id = auth.uid())
        AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'principal', 'system_admin'))
    );

-- 6. Create Trigger to auto-assign school_id to settings
CREATE OR REPLACE FUNCTION public.set_settings_school_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.school_id IS NULL THEN
    SELECT school_id INTO NEW.school_id
    FROM public.profiles
    WHERE id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_settings_school_id_trigger ON settings;
CREATE TRIGGER set_settings_school_id_trigger
BEFORE INSERT ON settings
FOR EACH ROW
EXECUTE FUNCTION public.set_settings_school_id();
