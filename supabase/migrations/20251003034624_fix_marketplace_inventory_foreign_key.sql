/*
  # Fix Marketplace Inventory Foreign Key

  ## Changes
  1. Drop the existing foreign key constraint that points to the wrong table
  2. Change inventory_item_id column from bigint to uuid to match inventory_items.id
  3. Add new foreign key constraint pointing to inventory_items table

  ## Notes
  - The original constraint referenced 'inventory' (bigint id) but the app uses 'inventory_items' (uuid id)
  - This fixes the foreign key violation errors when creating marketplace listings
*/

-- Drop the existing incorrect foreign key constraint
ALTER TABLE marketplace_listings
DROP CONSTRAINT IF EXISTS marketplace_listings_inventory_item_id_fkey;

-- Change the column type from bigint to uuid to match inventory_items
ALTER TABLE marketplace_listings
ALTER COLUMN inventory_item_id TYPE uuid USING inventory_item_id::text::uuid;

-- Add the correct foreign key constraint to inventory_items
ALTER TABLE marketplace_listings
ADD CONSTRAINT marketplace_listings_inventory_item_id_fkey
FOREIGN KEY (inventory_item_id)
REFERENCES inventory_items(id)
ON DELETE SET NULL;
