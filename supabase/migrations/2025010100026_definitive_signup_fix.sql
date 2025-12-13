-- This script fixes the user creation process by replacing the old database trigger and function
-- with a new, robust version that handles all required fields and prevents errors.

-- 1. Drop the old function and trigger if they exist to ensure a clean slate.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user;

-- 2. Create the new, robust function.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- The function runs with the privileges of the user that created it.
SET search_path = public;
AS $$
DECLARE
  user_role public.user_role;
  user_full_name text;
  user_class text;
  user_section text;
  user_subject text;
BEGIN
  -- Extract role and full_name from metadata. These are required.
  user_role := (NEW.raw_user_meta_data ->> 'role')::public.user_role;
  user_full_name := NEW.raw_user_meta_data ->> 'full_name';

  -- If role or name is missing, we can't proceed.
  IF user_role IS NULL OR user_full_name IS NULL THEN
    RAISE EXCEPTION 'User role or full name not provided in metadata';
  END IF;

  -- Insert into public.profiles
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, user_full_name, user_role);

  -- Based on role, insert into students or teachers table
  IF user_role = 'student' THEN
    user_class := NEW.raw_user_meta_data ->> 'class';
    user_section := NEW.raw_user_meta_data ->> 'section';
    
    INSERT INTO public.students (user_id, name, email, class, section, grade, enrollmentDate, dob, rollNumber, phone, status, issuedDate, expiryDate)
    VALUES (
      NEW.id,
      user_full_name,
      NEW.email,
      user_class,
      user_section,
      'Grade ' || user_class, -- Auto-generate grade
      CURRENT_DATE, -- Default enrollment to today
      '1970-01-01', -- Placeholder DOB
      'N/A', -- Placeholder Roll Number
      'N/A', -- Placeholder Phone
      'active',
      CURRENT_DATE, -- Placeholder issuedDate
      (CURRENT_DATE + INTERVAL '4 year')::date -- Placeholder expiryDate
    );
  ELSIF user_role = 'teacher' THEN
    user_subject := NEW.raw_user_meta_data ->> 'subject';

    INSERT INTO public.teachers (user_id, name, email, subject, salary, joinDate, dob, phone, status, issuedDate, expiryDate)
    VALUES (
      NEW.id,
      user_full_name,
      NEW.email,
      user_subject,
      30000, -- Default salary
      CURRENT_DATE, -- Default join date
      '1970-01-01', -- Placeholder DOB
      'N/A', -- Placeholder Phone
      'active',
      CURRENT_DATE, -- Placeholder issuedDate
      (CURRENT_DATE + INTERVAL '4 year')::date -- Placeholder expiryDate
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Create the trigger to call the function.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Add a comment explaining the ownership requirement.
COMMENT ON FUNCTION public.handle_new_user() IS 'This function requires ownership by postgres or a superuser to run with SECURITY DEFINER privileges.';
