/*
  # Add purchase_date column to inventory_items

  1. New Columns
    - `purchase_date` (date) - Optional date when the item was purchased

  2. Changes
    - Add purchase_date column to inventory_items table
    - Column is optional (nullable)
*/

DO $$
BEGIN
  -- Add purchase_date column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_items' AND column_name = 'purchase_date'
  ) THEN
    ALTER TABLE inventory_items ADD COLUMN purchase_date date;
  END IF;
END $$;