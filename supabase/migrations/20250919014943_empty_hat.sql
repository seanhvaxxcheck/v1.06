/*
  # Fix user signup database trigger

  1. Database Function
    - Create or replace `handle_new_user` function
    - Handles automatic profile creation when users sign up
    - Uses SECURITY DEFINER to bypass RLS during trigger execution

  2. Trigger Setup
    - Create trigger on auth.users table
    - Fires after INSERT to create corresponding profile entry
    - Maps user metadata to profile fields

  3. Security
    - Function runs with elevated privileges to ensure profile creation
    - Proper error handling for edge cases
*/

-- Create or replace the function that handles new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name,
    terms_version_agreed,
    privacy_version_agreed,
    policy_agreed_at,
    policy_ip_address
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'terms_version',
    NEW.raw_user_meta_data->>'privacy_version',
    CASE 
      WHEN NEW.raw_user_meta_data->>'policy_agreed_at' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'policy_agreed_at')::timestamptz
      ELSE NULL
    END,
    NEW.raw_user_meta_data->>'policy_ip_address'
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists and recreate it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS policies allow profile creation
DO $$
BEGIN
  -- Check if the INSERT policy exists, if not create it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile"
      ON profiles
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;