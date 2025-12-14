/*
  # Assign Data to Specific School
  
  ## Query Description: 
  This operation will backfill the 'school_id' column for all existing records in the database
  that currently have a NULL school_id. It assigns them to the specific School ID provided by the user.
  This ensures all legacy data is visible under the correct school context.

  ## Metadata:
  - Schema-Category: "Data"
  - Impact-Level: "Medium"
  - Requires-Backup: true
  - Reversible: false (unless backed up)

  ## Structure Details:
  - Updates all major tables (students, teachers, fees, etc.)
  - Sets school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67'
*/

-- 1. Ensure the school exists (create it if it doesn't, to avoid FK errors)
INSERT INTO schools (id, name, is_active)
VALUES ('b65c85aa-3265-45ec-9428-e2b601b3fa67', 'Main School', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Update User Profiles
UPDATE profiles SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;

-- 3. Update Core Entities
UPDATE students SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
UPDATE teachers SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
UPDATE classes SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
UPDATE sections SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
UPDATE courses SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
UPDATE departments SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;

-- 4. Update Academic Data
UPDATE exams SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
UPDATE grades SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
UPDATE attendance SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
UPDATE homework SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
UPDATE lesson_plans SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
UPDATE live_classes SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
UPDATE online_exams SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
UPDATE timetables SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;

-- 5. Update Financial Data
UPDATE fees SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
UPDATE fee_masters SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
UPDATE incomes SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
UPDATE expenses SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
UPDATE payrolls SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;

-- 6. Update Resources (Library, Inventory, Transport, Hostel)
UPDATE library_books SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
UPDATE library_issues SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
UPDATE inventory_items SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
UPDATE inventory_issues SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
UPDATE transport_vehicles SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
UPDATE hostel_rooms SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;

-- 7. Update Communication & Others
UPDATE events SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
UPDATE notices SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
UPDATE alumni_events SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
UPDATE visitors SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
UPDATE admission_enquiries SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
UPDATE complaints SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
UPDATE postal_records SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
UPDATE contents SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
UPDATE leaves SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
UPDATE staff_attendance SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
UPDATE subject_groups SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;
UPDATE student_categories SET school_id = 'b65c85aa-3265-45ec-9428-e2b601b3fa67' WHERE school_id IS NULL;

-- 8. Update Settings (Handle conflicts by ignoring if already set)
INSERT INTO settings (key, value, school_id)
SELECT key, value, 'b65c85aa-3265-45ec-9428-e2b601b3fa67'
FROM settings
WHERE school_id IS NULL
ON CONFLICT (school_id, key) DO NOTHING;

-- Optional: Clean up old null settings if you want
-- DELETE FROM settings WHERE school_id IS NULL;
