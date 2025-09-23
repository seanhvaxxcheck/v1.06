/*
  # Add subcategory to field_type check constraint

  1. Changes
    - Drop existing check constraint on user_custom_fields.field_type
    - Add new check constraint that includes 'subcategory' as valid value
    - Allow field_type to be 'category', 'condition', or 'subcategory'

  2. Security
    - No RLS changes needed
    - Maintains existing table structure and policies
*/

-- Drop the existing check constraint
ALTER TABLE user_custom_fields DROP CONSTRAINT IF EXISTS user_custom_fields_field_type_check;

-- Add new check constraint that includes 'subcategory'
ALTER TABLE user_custom_fields 
ADD CONSTRAINT user_custom_fields_field_type_check 
CHECK (field_type IN ('category', 'condition', 'subcategory'));