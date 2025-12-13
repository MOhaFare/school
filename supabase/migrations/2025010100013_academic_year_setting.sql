/*
          # [Operation Name]
          Adds the academic_year setting to the settings table.

          ## Query Description: [This operation adds a new key-value pair to the `settings` table to store the academic year. It is a safe, non-destructive operation.]
          
          ## Metadata:
          - Schema-Category: ["Data"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Affects table: `public.settings`
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [No]
          - Auth Requirements: [Authenticated user]
          
          ## Performance Impact:
          - Indexes: [No change]
          - Triggers: [No change]
          - Estimated Impact: [None]
          */
INSERT INTO public.settings (key, value)
VALUES ('academic_year', '2024-2025')
ON CONFLICT (key) DO NOTHING;
