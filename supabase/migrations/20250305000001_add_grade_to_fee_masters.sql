/*
  # Add Grade to Fee Masters
  
  Adds a 'grade' column to the fee_masters table.
  This allows creating fee structures specific to a grade (e.g., "Grade 10 Tuition" vs "Grade 1 Tuition").
  
  - grade: TEXT (nullable). If null, applies to all. If set (e.g. '9', 'KG1'), applies to that grade.
*/

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'fee_masters' 
        AND column_name = 'grade'
    ) THEN
        ALTER TABLE public.fee_masters 
        ADD COLUMN grade TEXT;
    END IF;
END $$;
