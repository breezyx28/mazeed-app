-- Add missing INSERT policy for profiles
-- This allows users to create their own profile (needed for upsert to work)
CREATE POLICY "Users can insert own profile" 
ON profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Ensure the trigger function has proper permissions
-- Re-create the trigger function with proper error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth user creation
    RAISE WARNING 'Error creating profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
