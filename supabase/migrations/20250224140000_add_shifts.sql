/*
  # Add Shift Column
  Adds a shift column to students and teachers tables to track Morning/Afternoon sessions.

  ## Query Description:
  This operation adds a 'shift' column to both 'students' and 'teachers' tables.
  It sets a default value of 'Morning' for existing records.
  It adds a check constraint to ensure values are either 'Morning' or 'Afternoon'.

  ## Metadata:
  - Schema-Category: Structural
  - Impact-Level: Low
  - Requires-Backup: false
  - Reversible: true

  ## Structure Details:
  - Table: students, teachers
  - Column: shift (text)
*/

ALTER TABLE students 
ADD COLUMN IF NOT EXISTS shift text DEFAULT 'Morning' CHECK (shift IN ('Morning', 'Afternoon'));

ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS shift text DEFAULT 'Morning' CHECK (shift IN ('Morning', 'Afternoon'));
