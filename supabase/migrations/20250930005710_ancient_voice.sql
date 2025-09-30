/*
  # Add AI Recognition Fields to Inventory Items

  1. New Columns
    - `ai_identified` (boolean) - Flag to track if item was AI-identified vs manually entered
    - `ai_confidence` (numeric) - Confidence score from AI recognition (0.0 to 1.0)
    - `ai_analysis_id` (text) - Reference to the AI analysis session for tracking

  2. Changes
    - Add new columns to inventory_items table
    - Set default values for existing items
    - Add indexes for performance

  3. Notes
    - Existing items will have ai_identified = false by default
    - New fields are optional and don't affect existing functionality
*/

-- Add AI recognition fields to inventory_items table
DO $$
BEGIN
  -- Add ai_identified column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_items' AND column_name = 'ai_identified'
  ) THEN
    ALTER TABLE inventory_items ADD COLUMN ai_identified boolean DEFAULT false;
  END IF;

  -- Add ai_confidence column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_items' AND column_name = 'ai_confidence'
  ) THEN
    ALTER TABLE inventory_items ADD COLUMN ai_confidence numeric(3,2) DEFAULT NULL;
  END IF;

  -- Add ai_analysis_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_items' AND column_name = 'ai_analysis_id'
  ) THEN
    ALTER TABLE inventory_items ADD COLUMN ai_analysis_id text DEFAULT NULL;
  END IF;
END $$;

-- Add indexes for AI-related queries
CREATE INDEX IF NOT EXISTS idx_inventory_items_ai_identified 
ON inventory_items (ai_identified) 
WHERE ai_identified = true;

CREATE INDEX IF NOT EXISTS idx_inventory_items_ai_confidence 
ON inventory_items (ai_confidence DESC) 
WHERE ai_confidence IS NOT NULL;

-- Add constraint to ensure confidence is between 0 and 1
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'inventory_items_ai_confidence_check'
  ) THEN
    ALTER TABLE inventory_items 
    ADD CONSTRAINT inventory_items_ai_confidence_check 
    CHECK (ai_confidence IS NULL OR (ai_confidence >= 0 AND ai_confidence <= 1));
  END IF;
END $$;