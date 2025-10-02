/*
  # The Exchange and Real-Time Messaging System

  ## Overview
  Creates an internal The Exchange where authenticated users can list items for sale or trade,
  and communicate with each other through real-time messaging.

  ## New Tables

  ### marketplace_listings
  Stores items users post to The Exchange
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to profiles) - The user who posted the listing
  - `inventory_item_id` (bigint, nullable, foreign key to inventory) - Optional link to existing inventory item
  - `title` (text) - Listing title
  - `description` (text) - Detailed description
  - `category` (text) - Item category
  - `subcategory` (text, nullable) - Item subcategory
  - `condition` (text) - Item condition
  - `photo_url` (text, nullable) - Primary photo
  - `listing_type` (text) - 'sale', 'trade', or 'both'
  - `asking_price` (decimal, nullable) - Price if for sale
  - `trade_preferences` (text, nullable) - What user wants in trade
  - `listing_status` (text) - 'active', 'sold', 'completed', 'removed'
  - `view_count` (integer) - Number of views
  - `created_at` (timestamp)
  - `updated_at` (timestamp)

  ### conversations
  Tracks message threads between two users
  - `id` (uuid, primary key)
  - `user1_id` (uuid, foreign key to profiles) - First participant
  - `user2_id` (uuid, foreign key to profiles) - Second participant
  - `listing_id` (uuid, nullable, foreign key to marketplace_listings) - Related listing if applicable
  - `last_message_at` (timestamp) - When last message was sent
  - `created_at` (timestamp)

  ### messages
  Individual messages within conversations
  - `id` (uuid, primary key)
  - `conversation_id` (uuid, foreign key to conversations)
  - `sender_id` (uuid, foreign key to profiles)
  - `message_text` (text) - Message content
  - `is_read` (boolean) - Read status
  - `read_at` (timestamp, nullable) - When message was read
  - `created_at` (timestamp)

  ### user_notifications
  Tracks notifications for messages and marketplace activity
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to profiles) - Recipient of notification
  - `type` (text) - 'new_message', 'listing_inquiry', 'listing_sold'
  - `title` (text) - Notification title
  - `message` (text) - Notification content
  - `related_id` (uuid, nullable) - ID of related entity (message, listing, etc.)
  - `is_read` (boolean) - Read status
  - `created_at` (timestamp)

  ## Security
  - Enable RLS on all tables
  - Users can only create listings for themselves
  - Users can view all active marketplace listings
  - Users can only access their own conversations
  - Users can only send messages in conversations they're part of
  - Users can only view their own notifications

  ## Indexes
  - Index on marketplace_listings for user_id and listing_status
  - Index on conversations for both user IDs
  - Index on messages for conversation_id and created_at
  - Index on user_notifications for user_id and is_read
*/

-- Create marketplace_listings table
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  inventory_item_id bigint REFERENCES inventory(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text DEFAULT '',
  category text DEFAULT '',
  subcategory text,
  condition text DEFAULT '',
  photo_url text,
  listing_type text NOT NULL CHECK (listing_type IN ('sale', 'trade', 'both')) DEFAULT 'sale',
  asking_price decimal(10,2),
  trade_preferences text,
  listing_status text NOT NULL CHECK (listing_status IN ('active', 'sold', 'completed', 'removed')) DEFAULT 'active',
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user2_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  listing_id uuid REFERENCES marketplace_listings(id) ON DELETE SET NULL,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT different_users CHECK (user1_id != user2_id),
  CONSTRAINT ordered_users CHECK (user1_id < user2_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message_text text NOT NULL,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create user_notifications table
CREATE TABLE IF NOT EXISTS user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('new_message', 'listing_inquiry', 'listing_sold')),
  title text NOT NULL,
  message text NOT NULL,
  related_id uuid,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Policies for marketplace_listings
CREATE POLICY "Authenticated users can view active listings"
  ON marketplace_listings
  FOR SELECT
  TO authenticated
  USING (listing_status = 'active' OR user_id = auth.uid());

CREATE POLICY "Users can insert own listings"
  ON marketplace_listings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own listings"
  ON marketplace_listings
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own listings"
  ON marketplace_listings
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Policies for conversations
CREATE POLICY "Users can view own conversations"
  ON conversations
  FOR SELECT
  TO authenticated
  USING (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "Users can create conversations"
  ON conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "Users can update own conversations"
  ON conversations
  FOR UPDATE
  TO authenticated
  USING (user1_id = auth.uid() OR user2_id = auth.uid())
  WITH CHECK (user1_id = auth.uid() OR user2_id = auth.uid());

-- Policies for messages
CREATE POLICY "Users can view messages in their conversations"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_id
      AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can update own messages"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
    )
  );

-- Policies for user_notifications
CREATE POLICY "Users can view own notifications"
  ON user_notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON user_notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON user_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can delete own notifications"
  ON user_notifications
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_user_id ON marketplace_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status ON marketplace_listings(listing_status);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_created_at ON marketplace_listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_user1 ON conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2 ON conversations(user2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON user_notifications(is_read);

-- Function to update conversation last_message_at
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS trigger AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update conversation timestamp on new message
DROP TRIGGER IF EXISTS on_message_created ON messages;
CREATE TRIGGER on_message_created
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_timestamp();

-- Function to create notification on new message
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS trigger AS $$
DECLARE
  recipient_id uuid;
  sender_name text;
BEGIN
  -- Determine recipient (the other user in conversation)
  SELECT CASE
    WHEN user1_id = NEW.sender_id THEN user2_id
    ELSE user1_id
  END INTO recipient_id
  FROM conversations
  WHERE id = NEW.conversation_id;

  -- Get sender's name
  SELECT COALESCE(full_name, email) INTO sender_name
  FROM profiles
  WHERE id = NEW.sender_id;

  -- Create notification for recipient
  INSERT INTO user_notifications (user_id, type, title, message, related_id)
  VALUES (
    recipient_id,
    'new_message',
    'New message from ' || sender_name,
    LEFT(NEW.message_text, 100),
    NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create notification on new message
DROP TRIGGER IF EXISTS on_message_notification ON messages;
CREATE TRIGGER on_message_notification
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION create_message_notification();