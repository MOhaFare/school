-- Migration to fix the handle_new_user trigger for robust school_id assignment

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  meta_school_id uuid;
  meta_role text;
  meta_full_name text;
BEGIN
  -- Extract metadata safely with error handling for UUID casting
  BEGIN
    meta_school_id := (new.raw_user_meta_data->>'school_id')::uuid;
  EXCEPTION WHEN OTHERS THEN
    -- If casting fails (e.g. empty string or invalid UUID), set to NULL
    meta_school_id := NULL;
  END;
  
  meta_role := new.raw_user_meta_data->>'role';
  meta_full_name := new.raw_user_meta_data->>'full_name';

  -- Default role if missing
  IF meta_role IS NULL THEN
    meta_role := 'student';
  END IF;

  -- Insert into profiles with the extracted school_id
  INSERT INTO public.profiles (id, email, name, role, school_id)
  VALUES (
    new.id,
    new.email,
    COALESCE(meta_full_name, new.raw_user_meta_data->>'name', new.email),
    meta_role,
    meta_school_id
  )
  ON CONFLICT (id) DO UPDATE
  SET
    school_id = EXCLUDED.school_id,
    role = EXCLUDED.role,
    name = EXCLUDED.name;
  
  RETURN new;
END;
$$;

-- Ensure the trigger is properly attached (re-creating it to be safe)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
