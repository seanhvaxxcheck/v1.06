/*
  # Create share_links table for collection sharing

  1. New Tables
    - `share_links`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `unique_share_id` (text, unique identifier for public URLs)
      - `settings` (jsonb, privacy settings for what to hide/show)
      - `is_active` (boolean, whether the link is enabled)
      - `expires_at` (timestamptz, optional expiration date)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `share_links` table
    - Add policies for authenticated users to manage their own share links

  3. Indexes
    - Index on user_id for efficient queries
    - Unique index on unique_share_id for public access
    - Index on is_active for filtering active links
*/

-- Create share_links table
CREATE TABLE IF NOT EXISTS share_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  unique_share_id text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  settings jsonb DEFAULT '{
    "hide_purchase_price": true,
    "hide_purchase_date": false,
    "hide_location": false,
    "hide_description": false,
    "hide_personal_notes": false
  }'::jsonb,
  is_active boolean DEFAULT true,
  expires_at timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_share_links_user_id ON share_links(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_share_links_unique_share_id ON share_links(unique_share_id);
CREATE INDEX IF NOT EXISTS idx_share_links_active ON share_links(is_active) WHERE is_active = true;

-- Add foreign key constraint
ALTER TABLE share_links 
ADD CONSTRAINT fk_share_links_user_id 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- RLS Policies
CREATE POLICY "Users can read own share links"
  ON share_links
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own share links"
  ON share_links
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own share links"
  ON share_links
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own share links"
  ON share_links
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());