/*
  # Create user custom fields table

  1. New Tables
    - `user_custom_fields`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `field_type` (text, 'category' or 'condition')
      - `field_name` (text, the custom field name)
      - `is_active` (boolean, for soft deletes)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_custom_fields` table
    - Add policies for authenticated users to manage their own custom fields

  3. Indexes
    - Index on user_id and field_type for efficient queries
    - Index on user_id and is_active for filtering active fields
*/

CREATE TABLE IF NOT EXISTS user_custom_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  field_type text NOT NULL CHECK (field_type IN ('category', 'condition')),
  field_name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_custom_fields ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_custom_fields_user_type 
  ON user_custom_fields(user_id, field_type);

CREATE INDEX IF NOT EXISTS idx_user_custom_fields_active 
  ON user_custom_fields(user_id, is_active) 
  WHERE is_active = true;

-- Create unique constraint to prevent duplicate field names per user per type
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_custom_fields_unique 
  ON user_custom_fields(user_id, field_type, field_name) 
  WHERE is_active = true;