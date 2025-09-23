/*
  # Fix sync_stripe_subscription_to_profile database issue

  1. Database Changes
    - Drop the problematic trigger that references sync_stripe_subscription_to_profile incorrectly
    - Remove any references to the sync function that's causing FROM-clause errors
    - Ensure stripe_subscriptions table works without the problematic trigger

  2. Security
    - Maintain RLS on stripe_subscriptions table
    - Keep existing policies intact
*/

-- Drop the problematic trigger if it exists
DROP TRIGGER IF EXISTS trg_sync_stripe_subscription_to_profile ON stripe_subscriptions;

-- Drop the function if it exists and is causing issues
DROP FUNCTION IF EXISTS sync_stripe_subscription_to_profile();

-- Ensure the stripe_subscriptions table has proper defaults
ALTER TABLE stripe_subscriptions 
ALTER COLUMN created_at SET DEFAULT now(),
ALTER COLUMN updated_at SET DEFAULT now();

-- Create a simple trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add the simple update trigger
CREATE TRIGGER update_stripe_subscriptions_updated_at 
    BEFORE UPDATE ON stripe_subscriptions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();