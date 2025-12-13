/*
  # [Operation] Add Date Columns for ID Cards
  [This migration adds missing date columns to the `students` and `teachers` tables to support ID card generation and fix a data insertion error.]

  ## Query Description:
  - Adds `enrollment_date`, `issued_date`, and `expiry_date` to the `students` table.
  - Adds `join_date`, `issued_date`, and `expiry_date` to the `teachers` table.
  - This operation is safe and will not affect existing data. It uses `IF NOT EXISTS` to prevent errors on re-runs.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (by dropping the columns)

  ## Structure Details:
  - Affects: `public.students`, `public.teachers`
  - Columns Added: `enrollment_date`, `join_date`, `issued_date`, `expiry_date`

  ## Security Implications:
  - RLS Status: Unchanged
  - Policy Changes: No
  - Auth Requirements: None

  ## Performance Impact:
  - Indexes: None
  - Triggers: None
  - Estimated Impact: Negligible
*/
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS enrollment_date date,
ADD COLUMN IF NOT EXISTS issued_date date,
ADD COLUMN IF NOT EXISTS expiry_date date;

ALTER TABLE public.teachers
ADD COLUMN IF NOT EXISTS join_date date,
ADD COLUMN IF NOT EXISTS issued_date date,
ADD COLUMN IF NOT EXISTS expiry_date date;
