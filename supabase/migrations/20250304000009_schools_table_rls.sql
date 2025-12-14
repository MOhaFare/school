/*
  # Fix Schools Table RLS
  
  ## Purpose
  Enables Row Level Security on the 'schools' table and adds policies to:
  1. Allow System Admins to do everything (CRUD).
  2. Allow authenticated users to VIEW (Select) only their own school.
  
  ## Why this is needed?
  Without this, when a school admin or student logs in, the application tries to fetch 
  the School Name and Logo. If RLS is enabled but no policy exists for them, 
  the fetch returns nothing, and they see the default "SchoolMS" instead of their school name.
*/

-- Enable RLS on schools table
ALTER TABLE "public"."schools" ENABLE ROW LEVEL SECURITY;

-- 1. Policy for System Admins (Full Access)
CREATE POLICY "System Admins can do everything on schools"
ON "public"."schools"
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'system_admin'
  )
);

-- 2. Policy for Users (Read Own School Only)
-- Users can see the school row if their profile's school_id matches the school's id
CREATE POLICY "Users can view their own school"
ON "public"."schools"
FOR SELECT
USING (
  id IN (
    SELECT school_id FROM "public"."profiles"
    WHERE profiles.id = auth.uid()
  )
);

-- 3. Policy for Public/Anon (Optional - if you want login page to show school info based on subdomain later)
-- For now, we keep it restricted to authenticated users.
