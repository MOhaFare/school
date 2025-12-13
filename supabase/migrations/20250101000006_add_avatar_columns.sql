/*
  # [Operation] Add Avatar Columns
  [This migration adds the 'avatar' column to the 'students' and 'teachers' tables to store URLs for profile pictures.]

  ## Query Description: [This operation alters the 'students' and 'teachers' tables by adding a new 'avatar' text column to each. This is a non-destructive change and will not affect existing data. The new column will be populated with NULL for existing records.]
  
  ## Metadata:
  - Schema-Category: ["Structural"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]
  
  ## Structure Details:
  - Tables affected: students, teachers
  - Columns added: avatar (TEXT)
  
  ## Security Implications:
  - RLS Status: [Enabled]
  - Policy Changes: [No]
  - Auth Requirements: [None for this migration]
  
  ## Performance Impact:
  - Indexes: [None]
  - Triggers: [None]
  - Estimated Impact: [Negligible. Adding a nullable column is a fast metadata change.]
*/

ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS avatar TEXT;

ALTER TABLE public.teachers
ADD COLUMN IF NOT EXISTS avatar TEXT;
