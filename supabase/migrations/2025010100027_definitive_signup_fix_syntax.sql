-- Drop old triggers and functions to ensure a clean state
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.create_user_profile_and_link();

-- Create the new, robust function to handle user creation and linking
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger -- A function to be used in a trigger must return the 'trigger' type
LANGUAGE plpgsql
SECURITY DEFINER -- The function will have the permissions of the user that defined it (the admin)
SET search_path = public, extensions;
AS $$
DECLARE
  user_id uuid := new.id;
  user_email text := new.email;
  user_role public.user_role := (new.raw_user_meta_data->>'role')::public.user_role;
  user_full_name text := new.raw_user_meta_data->>'full_name';
  user_class text := new.raw_user_meta_data->>'class';
  user_section text := new.raw_user_meta_data->>'section';
  user_subject text := new.raw_user_meta_data->>'subject';
  enrollment_date date := now();
  expiry_date date := now() + interval '4 year';
BEGIN
  -- Create a profile for the new user
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (user_id, user_full_name, user_role);

  -- Based on the role provided during sign-up, create a corresponding student or teacher record
  IF user_role = 'student' THEN
    INSERT INTO public.students (user_id, name, email, class, section, grade, enrollment_date, dob, issued_date, expiry_date, status, roll_number, phone)
    VALUES (user_id, user_full_name, user_email, user_class, user_section, 'Grade ' || user_class, enrollment_date, '1970-01-01', enrollment_date, expiry_date, 'active', '0', '');
  
  ELSIF user_role = 'teacher' THEN
    INSERT INTO public.teachers (user_id, name, email, subject, join_date, dob, issued_date, expiry_date, salary, status, phone)
    VALUES (user_id, user_full_name, user_email, user_subject, enrollment_date, '1970-01-01', enrollment_date, expiry_date, 30000, 'active', '');
  END IF;

  RETURN new;
END;
$$;

-- Create the trigger on the auth.users table to call the function
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
