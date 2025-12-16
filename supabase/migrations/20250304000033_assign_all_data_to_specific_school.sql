-- Migration: Assign ALL current data to School ID 78bdc42c-e7c7-45f7-ae78-41e2e934f39b

-- 1. Ensure the target school exists
INSERT INTO schools (id, name, subscription_plan, is_active)
VALUES ('78bdc42c-e7c7-45f7-ae78-41e2e934f39b', 'Main School', 'enterprise', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Update all data tables to belong to this school
-- We use a DO block to handle tables that might not exist or might not have the column yet (though they should)

DO $$
DECLARE
    target_school_id UUID := '78bdc42c-e7c7-45f7-ae78-41e2e934f39b';
BEGIN
    -- Core Entities
    UPDATE students SET school_id = target_school_id;
    UPDATE teachers SET school_id = target_school_id;
    UPDATE classes SET school_id = target_school_id;
    UPDATE sections SET school_id = target_school_id;
    UPDATE courses SET school_id = target_school_id;
    UPDATE departments SET school_id = target_school_id;
    UPDATE subject_groups SET school_id = target_school_id;
    UPDATE student_categories SET school_id = target_school_id;

    -- Finance
    UPDATE fees SET school_id = target_school_id;
    UPDATE fee_masters SET school_id = target_school_id;
    UPDATE incomes SET school_id = target_school_id;
    UPDATE expenses SET school_id = target_school_id;
    UPDATE payrolls SET school_id = target_school_id;

    -- Academics & Exams
    UPDATE exams SET school_id = target_school_id;
    UPDATE grades SET school_id = target_school_id;
    UPDATE homework SET school_id = target_school_id;
    UPDATE lesson_plans SET school_id = target_school_id;
    UPDATE live_classes SET school_id = target_school_id;
    UPDATE online_exams SET school_id = target_school_id;
    UPDATE contents SET school_id = target_school_id; -- Download center

    -- Operations
    UPDATE attendance SET school_id = target_school_id;
    UPDATE staff_attendance SET school_id = target_school_id;
    UPDATE leaves SET school_id = target_school_id;
    UPDATE library_books SET school_id = target_school_id;
    UPDATE library_issues SET school_id = target_school_id;
    UPDATE inventory_items SET school_id = target_school_id;
    UPDATE inventory_issues SET school_id = target_school_id;
    UPDATE transport_vehicles SET school_id = target_school_id;
    UPDATE hostel_rooms SET school_id = target_school_id;
    UPDATE events SET school_id = target_school_id;
    UPDATE notices SET school_id = target_school_id;
    UPDATE alumni_events SET school_id = target_school_id;

    -- Front Office
    UPDATE admission_enquiries SET school_id = target_school_id;
    UPDATE visitors SET school_id = target_school_id;
    UPDATE complaints SET school_id = target_school_id;
    UPDATE postal_records SET school_id = target_school_id;

    -- 3. Update Profiles (Users)
    -- Link all users (except system admins) to this school
    UPDATE profiles 
    SET school_id = target_school_id 
    WHERE role != 'system_admin';

END $$;
