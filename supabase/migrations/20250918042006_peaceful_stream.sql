/*
  # Add policy agreement tracking to profiles

  1. New Columns
    - `terms_version_agreed` (text) - Version of terms and conditions the user agreed to
    - `privacy_version_agreed` (text) - Version of privacy policy the user agreed to
    - `policy_agreed_at` (timestamp) - When the user agreed to the policies
    - `policy_ip_address` (text) - IP address when policies were agreed to (optional)

  2. Changes
    - Add new columns to profiles table to track policy agreement
    - Set default values for existing users
    - Update the handle_new_user trigger to set policy versions on signup

  3. Security
    - No RLS changes needed as profiles table already has proper policies
*/

-- Add policy agreement tracking columns to profiles table
DO $$
BEGIN
  -- Add terms_version_agreed column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'terms_version_agreed'
  ) THEN
    ALTER TABLE profiles ADD COLUMN terms_version_agreed text;
  END IF;

  -- Add privacy_version_agreed column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'privacy_version_agreed'
  ) THEN
    ALTER TABLE profiles ADD COLUMN privacy_version_agreed text;
  END IF;

  -- Add policy_agreed_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'policy_agreed_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN policy_agreed_at timestamptz;
  END IF;

  -- Add policy_ip_address column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'policy_ip_address'
  ) THEN
    ALTER TABLE profiles ADD COLUMN policy_ip_address text;
  END IF;
END $$;

-- Update existing users to have current policy versions (grandfathered in)
UPDATE profiles 
SET 
  terms_version_agreed = '1.0.0',
  privacy_version_agreed = '1.0.0',
  policy_agreed_at = created_at
WHERE 
  terms_version_agreed IS NULL 
  OR privacy_version_agreed IS NULL;

-- Update the handle_new_user function to include policy agreement tracking
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name,
    terms_version_agreed,
    privacy_version_agreed,
    policy_agreed_at
  )
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'terms_version',
    new.raw_user_meta_data->>'privacy_version',
    new.raw_user_meta_data->>'policy_agreed_at'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;