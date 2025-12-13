-- Ultra-lightweight trigger fix
-- This only updates the logic for NEW users. It does not touch existing data to prevent timeouts.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, school_id)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    CASE 
      WHEN new.raw_user_meta_data->>'school_id' IS NULL OR new.raw_user_meta_data->>'school_id' = '' THEN NULL
      ELSE (new.raw_user_meta_data->>'school_id')::uuid
    END
  );
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the transaction
  RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  RETURN new;
END;
$$;
