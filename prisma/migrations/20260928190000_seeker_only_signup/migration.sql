-- Public Auth sign-up must not be able to self-assign AGENT/ADMIN via user_metadata.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  display_name text;
BEGIN
  display_name := coalesce(
    nullif(NEW.raw_user_meta_data->>'name', ''),
    split_part(NEW.email, '@', 1),
    'Pisome'
  );

  INSERT INTO public."User" (id, email, name, role, locale, "createdAt", "updatedAt")
  VALUES (
    NEW.id,
    lower(NEW.email),
    display_name,
    'SEEKER',
    coalesce(NEW.raw_user_meta_data->>'locale', 'es'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;
