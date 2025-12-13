/*
# [STRUCTURAL] Add Date Column to Grades Table
This operation adds a `date` column to the `grades` table to store the date of the exam, which is necessary for performance tracking and data consistency.

## Query Description: [This operation adds a new `date` column of type `DATE` to the `grades` table. It is a non-destructive change, but existing grade records will have a `NULL` value for this new column until they are updated. The application logic has been written to expect this column, and this migration brings the database schema in line with the code.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Table: `public.grades`
- Column Added: `date` (Type: `DATE`)

## Security Implications:
- RLS Status: [Not Changed]
- Policy Changes: [No]
- Auth Requirements: [None]

## Performance Impact:
- Indexes: [None]
- Triggers: [None]
- Estimated Impact: [Low. The operation will be fast on tables of small to medium size. Queries using this new column will be slower until an index is added, if required for performance.]
*/
ALTER TABLE public.grades
ADD COLUMN date DATE;
