/*
  # Fix sync trigger function call

  1. Database Fix
    - Drop the existing trigger that has incorrect function reference
    - Recreate the trigger with correct function call syntax
    - Ensure the sync function is properly called on subscription changes

  2. Function Call Fix
    - Change from table reference to proper function call
    - Use correct PostgreSQL function call syntax
*/

-- Drop the existing trigger if it exists
DROP TRIGGER IF EXISTS trg_sync_stripe_subscription_to_profile ON stripe_subscriptions;

-- Recreate the trigger with correct function call syntax
CREATE TRIGGER trg_sync_stripe_subscription_to_profile
  AFTER INSERT OR UPDATE OR DELETE ON stripe_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_stripe_subscription_to_profile();