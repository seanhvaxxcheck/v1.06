/*
  # Create share_links table for collection sharing

  1. New Tables
    - `share_links`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `unique_share_id` (uuid, unique) - the ID used in shareable URLs
      - `settings` (jsonb) - privacy settings for what to hide/show
      - `is_active` (boolean) - whether the link is currently active
      - `expires_at` (timestamp, nullable) - optional expiration date
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `share_links` table
    - Add policies for users to manage their own share links
    - Add indexes for performance

  3. Notes
    - The `unique_share_id` is what gets used in the public URL
    - Settings control what information is visible to viewers
    - Links can be disabled without deleting them
*/

CREATE TABLE IF NOT EXISTS share_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  unique_share_id uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  settings jsonb DEFAULT '{"hide_purchase_price": true}'::jsonb,
  is_active boolean DEFAULT true,
  expires_at timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own share links"
  ON share_links
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_share_links_user_id ON share_links(user_id);
CREATE INDEX IF NOT EXISTS idx_share_links_unique_share_id ON share_links(unique_share_id);
CREATE INDEX IF NOT EXISTS idx_share_links_active ON share_links(is_active) WHERE is_active = true;