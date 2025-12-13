-- Drop the old trigger and function if they exist to ensure a clean slate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role public.user_role;
  user_full_name text;
  user_class text;
  user_section text;
  user_subject text;
  enrollment_date date;
  join_date date;
  id_issued_date date;
  id_expiry_date date;
BEGIN
  -- Extract data from the new user's metadata
  user_role := (new.raw_user_meta_data->>'role')::public.user_role;
  user_full_name := new.raw_user_meta_data->>'full_name';
  user_class := new.raw_user_meta_data->>'class';
  user_section := new.raw_user_meta_data->>'section';
  user_subject := new.raw_user_meta_data->>'subject';
  
  -- Insert into public.profiles
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, user_full_name, user_role);

  -- Based on the role, create a student or teacher record
  IF user_role = 'student' THEN
    enrollment_date := current_date;
    id_issued_date := current_date;
    id_expiry_date := current_date + interval '4 years';

    INSERT INTO public.students (user_id, name, email, class, section, grade, enrollment_date, issued_date, expiry_date, dob)
    VALUES (new.id, user_full_name, new.email, user_class, user_section, 'Grade ' || user_class, enrollment_date, id_issued_date, id_expiry_date, '2000-01-01');

  ELSIF user_role = 'teacher' THEN
    join_date := current_date;
    id_issued_date := current_date;
    id_expiry_date := current_date + interval '4 years';

    INSERT INTO public.teachers (user_id, name, email, subject, join_date, issued_date, expiry_date, dob, salary)
    VALUES (new.id, user_full_name, new.email, user_subject, join_date, id_issued_date, id_expiry_date, '1980-01-01', 30000);
  END IF;

  RETURN new;
END;
$$;

-- Create the trigger to run the function on new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
