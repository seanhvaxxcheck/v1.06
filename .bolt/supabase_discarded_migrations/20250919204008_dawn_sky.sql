/*
  # Create user custom fields table

  1. New Tables
    - `user_custom_fields`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `field_type` (text, 'category' or 'condition')
      - `field_name` (text, the custom field name)
      - `is_active` (boolean, whether field is active or deleted)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_custom_fields` table
    - Add policies for authenticated users to manage their own custom fields

  3. Indexes
    - Index on user_id for performance
    - Index on field_type for filtering
    - Unique constraint on user_id + field_type + field_name to prevent duplicates
*/

CREATE TABLE IF NOT EXISTS user_custom_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  field_type text NOT NULL CHECK (field_type IN ('category', 'condition')),
  field_name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign key constraint
ALTER TABLE user_custom_fields 
ADD CONSTRAINT user_custom_fields_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add unique constraint to prevent duplicate field names per user and type
ALTER TABLE user_custom_fields 
ADD CONSTRAINT user_custom_fields_unique_name 
UNIQUE (user_id, field_type, field_name);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_custom_fields_user_id 
ON user_custom_fields(user_id);

CREATE INDEX IF NOT EXISTS idx_user_custom_fields_type 
ON user_custom_fields(field_type);

CREATE INDEX IF NOT EXISTS idx_user_custom_fields_active 
ON user_custom_fields(is_active);

-- Enable RLS
ALTER TABLE user_custom_fields ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own custom fields"
  ON user_custom_fields
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own custom fields"
  ON user_custom_fields
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own custom fields"
  ON user_custom_fields
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own custom fields"
  ON user_custom_fields
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_custom_fields_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_custom_fields_updated_at
  BEFORE UPDATE ON user_custom_fields
  FOR EACH ROW
  EXECUTE FUNCTION update_user_custom_fields_updated_at();