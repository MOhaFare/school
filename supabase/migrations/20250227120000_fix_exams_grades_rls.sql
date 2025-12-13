/*
  # Fix RLS for Exams and Grades
  Reset and apply correct policies for exams and grades tables.

  ## Query Description: This operation will reset security policies for 'exams' and 'grades' tables to ensure proper access control. It is safe and reversible.
  
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Medium"
  - Requires-Backup: false
  - Reversible: true
  
  ## Structure Details:
  - Tables: exams, grades
  - Policies: Resetting all policies to ensure Admin write access and public/role-based read access.
  
  ## Security Implications:
  - RLS Status: Enabled
  - Policy Changes: Yes, existing policies are dropped and recreated.
*/

-- Fix 'exams' table policies
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON exams;
DROP POLICY IF EXISTS "Enable insert for admins" ON exams;
DROP POLICY IF EXISTS "Enable update for admins" ON exams;
DROP POLICY IF EXISTS "Enable delete for admins" ON exams;

CREATE POLICY "Enable read access for all authenticated users" ON exams FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for admins" ON exams FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Enable update for admins" ON exams FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Enable delete for admins" ON exams FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Fix 'grades' table policies
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON grades;
DROP POLICY IF EXISTS "Enable insert for admins and teachers" ON grades;
DROP POLICY IF EXISTS "Enable update for admins and teachers" ON grades;
DROP POLICY IF EXISTS "Enable delete for admins" ON grades;

CREATE POLICY "Enable read access for all authenticated users" ON grades FOR SELECT USING (auth.role() = 'authenticated');

-- Allow Admins AND Teachers to add/edit grades
CREATE POLICY "Enable insert for admins and teachers" ON grades FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
);
CREATE POLICY "Enable update for admins and teachers" ON grades FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
);

CREATE POLICY "Enable delete for admins" ON grades FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
