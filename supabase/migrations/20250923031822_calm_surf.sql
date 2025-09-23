/*
  # Add subcategory support to inventory items

  1. New Columns
    - `subcategory` (text) - Text field for subcategory name
    - `subcategory_id` (uuid) - Foreign key to user_custom_fields for custom subcategories

  2. Changes
    - Add subcategory and subcategory_id columns to inventory_items table
    - Both columns are optional (nullable)
    - subcategory_id references user_custom_fields table

  3. Security
    - No RLS changes needed as inventory_items table already has proper policies
*/

DO $$
BEGIN
  -- Add subcategory column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_items' AND column_name = 'subcategory'
  ) THEN
    ALTER TABLE inventory_items ADD COLUMN subcategory text DEFAULT '';
  END IF;

  -- subcategory_id column should already exist based on user's statement
  -- But let's ensure it has the proper foreign key constraint
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_items' AND column_name = 'subcategory_id'
  ) THEN
    -- Add foreign key constraint if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'inventory_items' 
      AND kcu.column_name = 'subcategory_id'
      AND tc.constraint_type = 'FOREIGN KEY'
    ) THEN
      ALTER TABLE inventory_items 
      ADD CONSTRAINT fk_inventory_items_subcategory_id 
      FOREIGN KEY (subcategory_id) REFERENCES user_custom_fields(id);
    END IF;
  ELSE
    -- Add subcategory_id column if it doesn't exist
    ALTER TABLE inventory_items ADD COLUMN subcategory_id uuid REFERENCES user_custom_fields(id);
  END IF;
END $$;