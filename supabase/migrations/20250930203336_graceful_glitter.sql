/*
  # eBay Integration Tables

  1. New Tables
    - `ebay_credentials`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `access_token` (text, encrypted)
      - `refresh_token` (text, encrypted)
      - `expires_at` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `ebay_listings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `inventory_item_id` (uuid, foreign key to inventory_items)
      - `ebay_listing_id` (text, eBay's listing ID)
      - `listing_url` (text)
      - `title` (text)
      - `start_price` (numeric)
      - `buy_it_now_price` (numeric)
      - `status` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
*/

-- Create ebay_credentials table
CREATE TABLE IF NOT EXISTS ebay_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create ebay_listings table
CREATE TABLE IF NOT EXISTS ebay_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  inventory_item_id uuid NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  ebay_listing_id text NOT NULL,
  listing_url text NOT NULL,
  title text NOT NULL,
  start_price numeric(10,2) NOT NULL,
  buy_it_now_price numeric(10,2),
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(ebay_listing_id)
);

-- Enable RLS
ALTER TABLE ebay_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE ebay_listings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ebay_credentials
CREATE POLICY "Users can read own eBay credentials"
  ON ebay_credentials
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own eBay credentials"
  ON ebay_credentials
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own eBay credentials"
  ON ebay_credentials
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own eBay credentials"
  ON ebay_credentials
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for ebay_listings
CREATE POLICY "Users can read own eBay listings"
  ON ebay_listings
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own eBay listings"
  ON ebay_listings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own eBay listings"
  ON ebay_listings
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own eBay listings"
  ON ebay_listings
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_ebay_credentials_user_id ON ebay_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_ebay_credentials_expires_at ON ebay_credentials(expires_at);
CREATE INDEX IF NOT EXISTS idx_ebay_listings_user_id ON ebay_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_ebay_listings_inventory_item_id ON ebay_listings(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_ebay_listings_status ON ebay_listings(status);