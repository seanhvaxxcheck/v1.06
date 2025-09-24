/*
  # Create share_links table for collection sharing

  1. New Tables
    - `share_links`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles.id)
      - `unique_share_id` (uuid, unique) - used in shareable URLs
      - `settings` (jsonb) - sharing preferences like hide_purchase_price
      - `is_active` (boolean) - to enable/disable links
      - `created_at` (timestamp)
      - `expires_at` (timestamp, nullable) - for optional expiration
      
  2. Security
    - Enable RLS on `share_links` table
    - Add policies for users to manage their own share links
    
  3. Indexes
    - Index on unique_share_id for fast public lookups
    - Index on user_id for user's share link management
*/

CREATE TABLE IF NOT EXISTS share_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  unique_share_id uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  settings jsonb DEFAULT '{"hide_purchase_price": true}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT NULL
);

-- Enable RLS
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;

-- Policies for share_links
CREATE POLICY "Users can manage own share links"
  ON share_links
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Public read access for active share links (no auth required)
CREATE POLICY "Public can read active share links"
  ON share_links
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_share_links_unique_share_id ON share_links(unique_share_id);
CREATE INDEX IF NOT EXISTS idx_share_links_user_id ON share_links(user_id);
CREATE INDEX IF NOT EXISTS idx_share_links_active ON share_links(is_active) WHERE is_active = true;