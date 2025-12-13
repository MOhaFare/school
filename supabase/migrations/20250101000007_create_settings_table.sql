/*
          # Create Settings Table
          This script creates a new table to store global application settings as key-value pairs.

          ## Query Description: [This operation creates a new 'settings' table and populates it with default values for the school name and base tuition fee. It is a safe, non-destructive operation.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Table: public.settings
          - Columns: key (TEXT, PRIMARY KEY), value (TEXT)
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [Yes]
          - Auth Requirements: [Authenticated users can read and update settings.]
          
          ## Performance Impact:
          - Indexes: [Primary Key on 'key']
          - Triggers: [None]
          - Estimated Impact: [Negligible impact on performance.]
          */

-- Create settings table
CREATE TABLE public.settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow authenticated users to read settings" ON public.settings
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to update settings" ON public.settings
FOR UPDATE TO authenticated USING (true);

-- Insert default values
INSERT INTO public.settings (key, value)
VALUES
    ('school_name', 'SchoolMS'),
    ('school_fee', '1200')
ON CONFLICT (key) DO NOTHING;
