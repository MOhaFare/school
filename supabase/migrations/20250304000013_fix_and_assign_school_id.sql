/*
  # Fix and Assign School ID
  
  1. Checks if 'live_classes' and 'online_exams' have 'school_id'.
  2. Adds the column if missing.
  3. Assigns the specific school ID to all records where it is NULL.
*/

-- 1. Ensure School Exists (Idempotent)
INSERT INTO schools (id, name, subscription_plan, is_active)
VALUES ('b65c85aa-3265-45ec-9428-e2b601b3fa67', 'Main School', 'enterprise', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Fix live_classes table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'live_classes' AND column_name = 'school_id') THEN
        ALTER TABLE live_classes ADD COLUMN school_id UUID REFERENCES schools(id);
    END IF;
END $$;

-- 3. Fix online_exams table (just in case)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'online_exams' AND column_name = 'school_id') THEN
        ALTER TABLE online_exams ADD COLUMN school_id UUID REFERENCES schools(id);
    END IF;
END $$;

-- 4. Assign Data (Safe to re-run)
-- We use UPDATE ... WHERE school_id IS NULL to avoid overwriting already assigned data if any
UPDATE students SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
UPDATE teachers SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
UPDATE fees SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
UPDATE classes SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
UPDATE exams SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
UPDATE grades SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
UPDATE attendance SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
UPDATE library_books SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
UPDATE hostel_rooms SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
UPDATE transport_vehicles SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
UPDATE notices SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
UPDATE events SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
UPDATE expenses SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
UPDATE incomes SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
UPDATE profiles SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL AND role != 'system_admin';

-- Update the newly fixed tables
UPDATE live_classes SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
UPDATE online_exams SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
