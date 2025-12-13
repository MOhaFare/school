-- Drop the old trigger and function if they exist to ensure a clean slate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create a new, robust function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  user_full_name TEXT;
  user_class TEXT;
  user_section TEXT;
  user_subject TEXT;
  new_student_id UUID;
  new_teacher_id UUID;
BEGIN
  -- Extract metadata from the new user record
  user_role := NEW.raw_user_meta_data->>'role';
  user_full_name := NEW.raw_user_meta_data->>'full_name';
  user_class := NEW.raw_user_meta_data->>'class';
  user_section := NEW.raw_user_meta_data->>'section';
  user_subject := NEW.raw_user_meta_data->>'subject';

  -- Insert into the public.profiles table
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, user_full_name, user_role);

  -- Conditionally insert into students or teachers table
  IF user_role = 'student' THEN
    INSERT INTO public.students (user_id, name, email, class, section, grade, status, enrollmentDate, dob, issuedDate, expiryDate, rollNumber, phone)
    VALUES (
      NEW.id,
      user_full_name,
      NEW.email,
      user_class,
      user_section,
      'Grade ' || user_class,
      'active',
      CURRENT_DATE,
      '1970-01-01', -- Default DOB, user should update later
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '4 year',
      'N/A',
      'N/A'
    );
  ELSIF user_role = 'teacher' THEN
    INSERT INTO public.teachers (user_id, name, email, subject, salary, status, joinDate, dob, issuedDate, expiryDate, phone)
    VALUES (
      NEW.id,
      user_full_name,
      NEW.email,
      user_subject,
      30000, -- Default salary
      'active',
      CURRENT_DATE,
      '1970-01-01', -- Default DOB
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '4 year',
      'N/A'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger to call the function after a new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
