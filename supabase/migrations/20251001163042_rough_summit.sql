/*
  # Add wishlist sharing functionality

  1. New Tables
    - `wishlist_shares`
      - `id` (uuid, primary key)
      - `wishlist_item_id` (uuid, foreign key to wishlist_items)
      - `user_id` (uuid, foreign key to profiles)
      - `unique_share_id` (text, unique identifier for public sharing)
      - `settings` (jsonb, privacy settings)
      - `is_active` (boolean, whether share is active)
      - `expires_at` (timestamp, optional expiration)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Updates to wishlist_items
    - Add `additional_search_terms` column for broader search coverage
    - Add `share_count` column to track how many times item has been shared

  3. Security
    - Enable RLS on `wishlist_shares` table
    - Add policies for CRUD operations
    - Add indexes for performance
*/

-- Add additional search terms to wishlist_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wishlist_items' AND column_name = 'additional_search_terms'
  ) THEN
    ALTER TABLE wishlist_items ADD COLUMN additional_search_terms text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wishlist_items' AND column_name = 'share_count'
  ) THEN
    ALTER TABLE wishlist_items ADD COLUMN share_count integer DEFAULT 0;
  END IF;
END $$;

-- Create wishlist_shares table
CREATE TABLE IF NOT EXISTS wishlist_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_item_id uuid NOT NULL REFERENCES wishlist_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  unique_share_id text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  settings jsonb DEFAULT '{
    "include_search_terms": true,
    "include_price_limit": true,
    "include_facebook_url": false,
    "allow_public_view": true
  }'::jsonb,
  is_active boolean DEFAULT true,
  expires_at timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE wishlist_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wishlist_shares
CREATE POLICY "Users can read own wishlist shares"
  ON wishlist_shares
  FOR SELECT
  TO authenticated
  USING (user_id = uid());

CREATE POLICY "Users can insert own wishlist shares"
  ON wishlist_shares
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = uid());

CREATE POLICY "Users can update own wishlist shares"
  ON wishlist_shares
  FOR UPDATE
  TO authenticated
  USING (user_id = uid())
  WITH CHECK (user_id = uid());

CREATE POLICY "Users can delete own wishlist shares"
  ON wishlist_shares
  FOR DELETE
  TO authenticated
  USING (user_id = uid());

-- Public access policy for viewing shared wishlist items
CREATE POLICY "Public can view active shared wishlist items"
  ON wishlist_shares
  FOR SELECT
  TO public
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_wishlist_shares_user_id ON wishlist_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_shares_wishlist_item_id ON wishlist_shares(wishlist_item_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_shares_unique_share_id ON wishlist_shares(unique_share_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_shares_active ON wishlist_shares(is_active) WHERE is_active = true;

-- Function to increment share count
CREATE OR REPLACE FUNCTION increment_wishlist_share_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE wishlist_items 
  SET share_count = COALESCE(share_count, 0) + 1,
      updated_at = now()
  WHERE id = NEW.wishlist_item_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to increment share count when new share is created
DROP TRIGGER IF EXISTS trg_increment_wishlist_share_count ON wishlist_shares;
CREATE TRIGGER trg_increment_wishlist_share_count
  AFTER INSERT ON wishlist_shares
  FOR EACH ROW
  EXECUTE FUNCTION increment_wishlist_share_count();