-- Fix 2: Messenger System Setup

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  listing_id uuid REFERENCES price_listings(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  vendor_name text NOT NULL,
  market_name text NOT NULL,
  price decimal,
  unit text,
  status text DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at timestamptz DEFAULT now(),
  last_message_at timestamptz DEFAULT now(),
  buyer_unread_count integer DEFAULT 0,
  vendor_unread_count integer DEFAULT 0,
  UNIQUE(buyer_id, listing_id)
);

-- 2. Create Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sender_type text NOT NULL CHECK (sender_type IN ('buyer', 'vendor')),
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 3. RLS for Conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read conversations"
ON conversations FOR SELECT
TO authenticated
USING (
  buyer_id = auth.uid() OR
  vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
);

CREATE POLICY "Authenticated users can insert conversations"
ON conversations FOR INSERT
TO authenticated
WITH CHECK (true);

-- 4. RLS for Messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read messages"
ON messages FOR SELECT
TO authenticated
USING (
  conversation_id IN (
    SELECT id FROM conversations
    WHERE buyer_id = auth.uid() OR
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Participants can insert messages"
ON messages FOR INSERT
TO authenticated
WITH CHECK (
  conversation_id IN (
    SELECT id FROM conversations
    WHERE buyer_id = auth.uid() OR
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  )
);

-- 5. Realtime Publications
-- Using safe DDL: First check if publication exists or handle publication separately.
-- Note: Realtime usually requires enabling it on the dashboard or via SQL.
-- The publication 'supabase_realtime' usually already exists.
-- Check if publication exists then add tables.
-- ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;
-- (Instead of risky ALTER, you may want to do it individually)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  ELSE
    CREATE PUBLICATION supabase_realtime FOR TABLE conversations, messages;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Skipping publication setup as it might already be configured correctly.';
END $$;

-- 6. Create buyer_profiles table if it does not exist (needed for Fix 4)
CREATE TABLE IF NOT EXISTS buyer_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name text NOT NULL,
  contact_number text,
  barangay text,
  created_at timestamptz DEFAULT now()
);

-- RLS for Buyer Profiles
ALTER TABLE buyer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
ON buyer_profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile"
ON buyer_profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
ON buyer_profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid());
