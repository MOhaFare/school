/*
          # [Operation Name]
          Create Student Promotion Function

          ## Query Description: [This script creates a new database function `promote_students()` that handles the end-of-year process. When executed, it will:
          1. Promote students from grades 9, 10, and 11 to the next grade (e.g., 9th graders become 10th graders).
          2. Graduate students in grade 12 by setting their status to 'inactive'.
          This function is designed to be safe and only affects active students. No data will be deleted.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Medium"]
          - Requires-Backup: [false]
          - Reversible: [false]
          
          ## Structure Details:
          - Creates a new RPC function: `public.promote_students()`
          
          ## Security Implications:
          - RLS Status: [Not Applicable]
          - Policy Changes: [No]
          - Auth Requirements: [The function is callable by any authenticated user by default. Access should be restricted at the application level.]
          
          ## Performance Impact:
          - Indexes: [Not Applicable]
          - Triggers: [Not Applicable]
          - Estimated Impact: [Low. The function performs batch updates which are efficient. Performance depends on the number of students.]
          */

CREATE OR REPLACE FUNCTION promote_students()
RETURNS json AS $$
DECLARE
  promoted_11_to_12_count INT;
  promoted_10_to_11_count INT;
  promoted_9_to_10_count INT;
  graduated_12_count INT;
BEGIN
  -- Graduate 12th graders
  WITH graduated AS (
    UPDATE students
    SET status = 'inactive'
    WHERE class = '12' AND status = 'active'
    RETURNING id
  )
  SELECT count(*) INTO graduated_12_count FROM graduated;

  -- Promote 11th to 12th
  WITH promoted AS (
    UPDATE students
    SET class = '12', grade = 'Grade 12'
    WHERE class = '11' AND status = 'active'
    RETURNING id
  )
  SELECT count(*) INTO promoted_11_to_12_count FROM promoted;

  -- Promote 10th to 11th
  WITH promoted AS (
    UPDATE students
    SET class = '11', grade = 'Grade 11'
    WHERE class = '10' AND status = 'active'
    RETURNING id
  )
  SELECT count(*) INTO promoted_10_to_11_count FROM promoted;

  -- Promote 9th to 10th
  WITH promoted AS (
    UPDATE students
    SET class = '10', grade = 'Grade 10'
    WHERE class = '9' AND status = 'active'
    RETURNING id
  )
  SELECT count(*) INTO promoted_9_to_10_count FROM promoted;

  RETURN json_build_object(
    'graduated_12', graduated_12_count,
    'promoted_11_to_12', promoted_11_to_12_count,
    'promoted_10_to_11', promoted_10_to_11_count,
    'promoted_9_to_10', promoted_9_to_10_count
  );
END;
$$ LANGUAGE plpgsql;
