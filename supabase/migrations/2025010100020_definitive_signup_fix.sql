-- Drop the old trigger and function if they exist to ensure a clean slate.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- This function is triggered when a new user signs up.
-- It creates a corresponding profile and a student/teacher record.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
-- Set a secure search_path
SET search_path = public
AS $$
BEGIN
  -- Create a profile for the new user
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    (new.raw_user_meta_data->>'role')::user_role
  );

  -- If the user is a student, create a student record
  IF (new.raw_user_meta_data->>'role') = 'student' THEN
    INSERT INTO public.students (user_id, name, email, class, section, grade, enrollmentDate, dob, issuedDate, expiryDate, status, rollNumber, phone)
    VALUES (
      new.id,
      new.raw_user_meta_data->>'full_name',
      new.email,
      new.raw_user_meta_data->>'class',
      new.raw_user_meta_data->>'section',
      'Grade ' || (new.raw_user_meta_data->>'class'),
      current_date,
      '2000-01-01', -- Placeholder DOB
      current_date,
      current_date + interval '4 year',
      'active',
      'N/A', -- Placeholder Roll Number
      '' -- Placeholder Phone
    );
  
  -- If the user is a teacher, create a teacher record
  ELSIF (new.raw_user_meta_data->>'role') = 'teacher' THEN
    INSERT INTO public.teachers (user_id, name, email, subject, salary, joinDate, dob, issuedDate, expiryDate, status, phone)
    VALUES (
      new.id,
      new.raw_user_meta_data->>'full_name',
      new.email,
      new.raw_user_meta_data->>'subject',
      35000, -- Default salary
      current_date,
      '1990-01-01', -- Placeholder DOB
      current_date,
      current_date + interval '4 year',
      'active',
      '' -- Placeholder Phone
    );
  END IF;

  RETURN new;
END;
$$;

-- Create the trigger that calls the function
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
