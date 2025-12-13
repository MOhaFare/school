-- Drop the old trigger and function if they exist to ensure a clean slate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.create_user_profile_and_link();

-- Create the function to handle new user sign-ups
CREATE OR REPLACE FUNCTION public.create_user_profile_and_link()
RETURNS TRIGGER AS $$
DECLARE
  user_role public.user_role;
  user_full_name TEXT;
  user_class TEXT;
  user_section TEXT;
  user_subject TEXT;
  enrollment_date DATE;
  join_date DATE;
  issued_date DATE;
  expiry_date DATE;
BEGIN
  -- Extract metadata from the new user record
  user_role := (new.raw_user_meta_data->>'role')::public.user_role;
  user_full_name := new.raw_user_meta_data->>'full_name';
  user_class := new.raw_user_meta_data->>'class';
  user_section := new.raw_user_meta_data->>'section';
  user_subject := new.raw_user_meta_data->>'subject';

  -- Insert into public.profiles
  INSERT INTO public.profiles (id, name, role)
  VALUES (new.id, user_full_name, user_role);

  -- Based on the role, insert into students or teachers table
  IF user_role = 'student' THEN
    enrollment_date := NOW()::date;
    issued_date := enrollment_date;
    expiry_date := issued_date + interval '4 years';
    
    INSERT INTO public.students (user_id, name, email, class, section, grade, enrollmentDate, issuedDate, expiryDate, dob)
    VALUES (new.id, user_full_name, new.email, user_class, user_section, 'Grade ' || user_class, enrollment_date, issued_date, expiry_date, '2000-01-01');
  
  ELSIF user_role = 'teacher' THEN
    join_date := NOW()::date;
    issued_date := join_date;
    expiry_date := issued_date + interval '4 years';

    INSERT INTO public.teachers (user_id, name, email, subject, joinDate, issuedDate, expiryDate, dob, salary)
    VALUES (new.id, user_full_name, new.email, user_subject, join_date, issued_date, expiry_date, '1980-01-01', 30000);
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set the search path on the function to fix the security warning
ALTER FUNCTION public.create_user_profile_and_link()
    SET search_path = public;

-- Create the trigger on the auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_user_profile_and_link();
