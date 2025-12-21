/*
  # Add Grade to Fee Masters
  1. Adds 'grade' column to 'fee_masters' table.
  2. Updates unique constraints to allow the same fee name (e.g. "Tuition Fee") 
     to exist multiple times if it is for different grades.
*/

-- 1. Add grade column
ALTER TABLE public.fee_masters 
ADD COLUMN IF NOT EXISTS grade TEXT;

-- 2. Drop old constraint that prevented duplicate names per school
ALTER TABLE public.fee_masters 
DROP CONSTRAINT IF EXISTS fee_masters_name_school_id_key;

-- 3. Create new unique index: Name + School + Grade must be unique.
-- We use COALESCE to treat NULL grade as 'All' for uniqueness purposes.
CREATE UNIQUE INDEX IF NOT EXISTS idx_fee_masters_unique_grade 
ON public.fee_masters (school_id, name, COALESCE(grade, 'All'));
