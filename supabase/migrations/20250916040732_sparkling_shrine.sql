/*
  # Sync Stripe subscription data to user profiles

  1. New Functions
    - `sync_stripe_subscription_to_profile()` - Syncs subscription data from stripe_subscriptions to profiles table
    - Automatically maps Stripe price IDs to subscription tiers
    - Updates subscription status and expiration dates

  2. Triggers
    - Trigger on stripe_subscriptions table to auto-sync when subscription data changes

  3. Manual Sync
    - Function can be called manually to sync existing data
*/

-- Function to map Stripe price IDs to subscription tiers
CREATE OR REPLACE FUNCTION get_subscription_tier_from_price_id(price_id TEXT)
RETURNS TEXT AS $$
BEGIN
  CASE price_id
    WHEN 'price_1S5equCZfIVspKe98prCSSX2' THEN RETURN 'free';
    WHEN 'price_1S5euOCZfIVspKe9ysPWz3NY' THEN RETURN 'pro';
    WHEN 'price_1S3iyBCZfIVspKe9hG2VK67R' THEN RETURN 'collector';
    ELSE RETURN 'free';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to sync Stripe subscription data to profiles
CREATE OR REPLACE FUNCTION sync_stripe_subscription_to_profile()
RETURNS TRIGGER AS $$
DECLARE
  user_uuid UUID;
  subscription_tier TEXT;
  subscription_status TEXT;
  expires_at TIMESTAMPTZ;
BEGIN
  -- Get the user_id from stripe_customers table
  SELECT sc.user_id INTO user_uuid
  FROM stripe_customers sc
  WHERE sc.customer_id = COALESCE(NEW.customer_id, OLD.customer_id)
    AND sc.deleted_at IS NULL;

  -- If no user found, exit
  IF user_uuid IS NULL THEN
    RAISE LOG 'No user found for customer_id: %', COALESCE(NEW.customer_id, OLD.customer_id);
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Handle DELETE operation
  IF TG_OP = 'DELETE' THEN
    UPDATE profiles 
    SET 
      subscription_status = 'inactive',
      subscription_tier = 'free',
      subscription_expires_at = NULL,
      updated_at = now()
    WHERE id = user_uuid;
    
    RAISE LOG 'Subscription deleted for user: %, set to free tier', user_uuid;
    RETURN OLD;
  END IF;

  -- For INSERT/UPDATE operations
  -- Map Stripe status to our status
  subscription_status := CASE NEW.status
    WHEN 'active' THEN 'active'
    WHEN 'trialing' THEN 'active'
    WHEN 'past_due' THEN 'past_due'
    WHEN 'canceled' THEN 'cancelled'
    WHEN 'unpaid' THEN 'past_due'
    WHEN 'incomplete' THEN 'inactive'
    WHEN 'incomplete_expired' THEN 'inactive'
    WHEN 'paused' THEN 'inactive'
    ELSE 'inactive'
  END;

  -- Get subscription tier from price_id
  subscription_tier := get_subscription_tier_from_price_id(NEW.price_id);

  -- Calculate expiration date from current_period_end
  IF NEW.current_period_end IS NOT NULL THEN
    expires_at := to_timestamp(NEW.current_period_end);
  ELSE
    expires_at := NULL;
  END IF;

  -- Update the profiles table
  UPDATE profiles 
  SET 
    subscription_status = sync_stripe_subscription_to_profile.subscription_status,
    subscription_tier = sync_stripe_subscription_to_profile.subscription_tier,
    subscription_expires_at = expires_at,
    updated_at = now()
  WHERE id = user_uuid;

  RAISE LOG 'Synced subscription for user: %, tier: %, status: %', user_uuid, subscription_tier, subscription_status;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically sync subscription changes
DROP TRIGGER IF EXISTS trg_sync_stripe_subscription_to_profile ON stripe_subscriptions;

CREATE TRIGGER trg_sync_stripe_subscription_to_profile
  AFTER INSERT OR UPDATE OR DELETE ON stripe_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_stripe_subscription_to_profile();

-- Function to manually sync all existing subscriptions
CREATE OR REPLACE FUNCTION sync_all_stripe_subscriptions_to_profiles()
RETURNS TABLE(user_id UUID, old_tier TEXT, new_tier TEXT, old_status TEXT, new_status TEXT) AS $$
DECLARE
  sub_record RECORD;
  user_uuid UUID;
  new_tier TEXT;
  new_status TEXT;
  old_tier TEXT;
  old_status TEXT;
BEGIN
  -- Loop through all active stripe subscriptions
  FOR sub_record IN 
    SELECT ss.*, sc.user_id
    FROM stripe_subscriptions ss
    JOIN stripe_customers sc ON ss.customer_id = sc.customer_id
    WHERE ss.deleted_at IS NULL AND sc.deleted_at IS NULL
  LOOP
    -- Get current profile data
    SELECT p.subscription_tier, p.subscription_status 
    INTO old_tier, old_status
    FROM profiles p 
    WHERE p.id = sub_record.user_id;

    -- Calculate new values
    new_tier := get_subscription_tier_from_price_id(sub_record.price_id);
    new_status := CASE sub_record.status
      WHEN 'active' THEN 'active'
      WHEN 'trialing' THEN 'active'
      WHEN 'past_due' THEN 'past_due'
      WHEN 'canceled' THEN 'cancelled'
      WHEN 'unpaid' THEN 'past_due'
      WHEN 'incomplete' THEN 'inactive'
      WHEN 'incomplete_expired' THEN 'inactive'
      WHEN 'paused' THEN 'inactive'
      ELSE 'inactive'
    END;

    -- Update profile
    UPDATE profiles 
    SET 
      subscription_status = new_status,
      subscription_tier = new_tier,
      subscription_expires_at = CASE 
        WHEN sub_record.current_period_end IS NOT NULL 
        THEN to_timestamp(sub_record.current_period_end)
        ELSE NULL 
      END,
      updated_at = now()
    WHERE id = sub_record.user_id;

    -- Return the changes
    user_id := sub_record.user_id;
    RETURN NEXT;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql;