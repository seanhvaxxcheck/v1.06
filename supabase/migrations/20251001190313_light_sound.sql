/*
  # Update wishlist items schema for collection-style functionality

  1. Schema Changes
    - Add new columns for collection-style wishlist items
    - Remove old search-based columns
    - Add photo support and detailed item information

  2. New Columns
    - `category` (text) - Item category
    - `subcategory` (text) - Item subcategory  
    - `manufacturer` (text) - Item manufacturer
    - `pattern` (text) - Item pattern
    - `year_manufactured` (integer) - Year item was made
    - `condition` (text) - Desired condition
    - `location` (text) - Preferred source/location
    - `description` (text) - Item description and notes
    - `photo_url` (text) - Photo of desired item
    - `quantity` (integer) - Quantity wanted

  3. Remove Old Columns
    - Remove eBay and Facebook search functionality columns
    - Remove last_checked_at as we're not doing automated searches
*/

-- Add new columns for collection-style wishlist
DO $$
BEGIN
  -- Add category column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wishlist_items' AND column_name = 'category'
  ) THEN
    ALTER TABLE wishlist_items ADD COLUMN category text DEFAULT '';
  END IF;

  -- Add subcategory column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wishlist_items' AND column_name = 'subcategory'
  ) THEN
    ALTER TABLE wishlist_items ADD COLUMN subcategory text DEFAULT '';
  END IF;

  -- Add manufacturer column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wishlist_items' AND column_name = 'manufacturer'
  ) THEN
    ALTER TABLE wishlist_items ADD COLUMN manufacturer text DEFAULT '';
  END IF;

  -- Add pattern column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wishlist_items' AND column_name = 'pattern'
  ) THEN
    ALTER TABLE wishlist_items ADD COLUMN pattern text DEFAULT '';
  END IF;

  -- Add year_manufactured column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wishlist_items' AND column_name = 'year_manufactured'
  ) THEN
    ALTER TABLE wishlist_items ADD COLUMN year_manufactured integer;
  END IF;

  -- Add condition column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wishlist_items' AND column_name = 'condition'
  ) THEN
    ALTER TABLE wishlist_items ADD COLUMN condition text DEFAULT 'good';
  END IF;

  -- Add location column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wishlist_items' AND column_name = 'location'
  ) THEN
    ALTER TABLE wishlist_items ADD COLUMN location text DEFAULT '';
  END IF;

  -- Add description column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wishlist_items' AND column_name = 'description'
  ) THEN
    ALTER TABLE wishlist_items ADD COLUMN description text DEFAULT '';
  END IF;

  -- Add photo_url column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wishlist_items' AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE wishlist_items ADD COLUMN photo_url text;
  END IF;

  -- Add quantity column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wishlist_items' AND column_name = 'quantity'
  ) THEN
    ALTER TABLE wishlist_items ADD COLUMN quantity integer DEFAULT 1;
  END IF;
END $$;

-- Update existing records to have default values
UPDATE wishlist_items 
SET 
  category = COALESCE(category, ''),
  subcategory = COALESCE(subcategory, ''),
  manufacturer = COALESCE(manufacturer, ''),
  pattern = COALESCE(pattern, ''),
  condition = COALESCE(condition, 'good'),
  location = COALESCE(location, ''),
  description = COALESCE(description, ''),
  quantity = COALESCE(quantity, 1)
WHERE 
  category IS NULL OR 
  subcategory IS NULL OR 
  manufacturer IS NULL OR 
  pattern IS NULL OR 
  condition IS NULL OR 
  location IS NULL OR 
  description IS NULL OR 
  quantity IS NULL;