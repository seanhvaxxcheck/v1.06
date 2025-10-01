/*
  # Add additional_search_terms column to wishlist_items

  1. Changes
    - Add `additional_search_terms` column to `wishlist_items` table
    - Column is nullable text type for storing extra search keywords
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wishlist_items' AND column_name = 'additional_search_terms'
  ) THEN
    ALTER TABLE wishlist_items ADD COLUMN additional_search_terms text;
  END IF;
END $$;