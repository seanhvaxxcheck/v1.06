/*
  # Add inventory photo function

  1. New Functions
    - `add_inventory_photo` - Handles saving photo paths to inventory items
    
  2. Security
    - Function uses security definer to ensure proper access control
    - Validates user ownership of inventory item before updating
*/

CREATE OR REPLACE FUNCTION add_inventory_photo(
  _inventory_id uuid,
  _user_id uuid,
  _photo_path text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify the user owns this inventory item
  IF NOT EXISTS (
    SELECT 1 FROM inventory_items 
    WHERE id = _inventory_id AND user_id = _user_id
  ) THEN
    RAISE EXCEPTION 'Inventory item not found or access denied';
  END IF;
  
  -- Update the inventory item with the photo path
  UPDATE inventory_items 
  SET 
    photo_url = _photo_path,
    updated_at = now()
  WHERE id = _inventory_id AND user_id = _user_id;
END;
$$;