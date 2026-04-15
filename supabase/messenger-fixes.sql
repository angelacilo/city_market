-- ==========================================
-- BCMIS Messenger System - Complete Fix
-- ==========================================

-- ==========================================
-- STEP 1: DIAGNOSTIC QUERIES (FOR INSPECTION)
-- ==========================================

-- Query 1: Check existing conversations
SELECT id, buyer_id, vendor_id,
       product_name, vendor_name, last_message_at,
       buyer_unread_count, vendor_unread_count
FROM conversations
ORDER BY created_at DESC
LIMIT 20;

-- Query 2: Check all messages 
SELECT m.id, m.conversation_id,
       m.sender_id, m.sender_type, m.content,
       m.is_read, m.created_at
FROM messages m
ORDER BY m.created_at DESC
LIMIT 20;

-- Query 3: Check vendor user_ids
SELECT v.id, v.user_id,
       v.business_name, v.is_approved
FROM vendors v
ORDER BY v.created_at DESC;

-- Query 4: Check existing RLS policies
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename IN ('conversations', 'messages')
ORDER BY tablename, policyname;

-- Query 5: Check Realtime publication status
SELECT pub.pubname, pt.tablename
FROM pg_publication pub
JOIN pg_publication_tables pt
ON pub.pubname = pt.pubname
WHERE pt.tablename IN ('conversations', 'messages');

-- ==========================================
-- STEP 2: DROP EXISTING POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Participants can read conversations" ON conversations;
DROP POLICY IF EXISTS "Authenticated users can insert conversations" ON conversations;
DROP POLICY IF EXISTS "Buyers can read own conversations" ON conversations;
DROP POLICY IF EXISTS "Vendors can read own conversations" ON conversations;

DROP POLICY IF EXISTS "Participants can read messages" ON messages;
DROP POLICY IF EXISTS "Participants can insert messages" ON messages;
DROP POLICY IF EXISTS "Authenticated participants can insert messages" ON messages;

-- ==========================================
-- STEP 3: ENSURE RLS IS ENABLED
-- ==========================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- STEP 4: CREATE CORRECTED CONVERSATIONS POLICIES
-- ==========================================

-- Buyers can read their own conversations
CREATE POLICY "Buyers can read own conversations"
ON conversations FOR SELECT
USING (auth.uid() = buyer_id);

-- Vendors can read conversations they participate in
CREATE POLICY "Vendors can read own conversations"
ON conversations FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM vendors
    WHERE id = conversations.vendor_id
  )
);

-- Authenticated users can create conversations
CREATE POLICY "Authenticated users can insert conversations"
ON conversations FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Buyers can update their own conversations
CREATE POLICY "Buyers can update own conversations"
ON conversations FOR UPDATE
USING (auth.uid() = buyer_id);

-- Vendors can update their conversations
CREATE POLICY "Vendors can update own conversations"
ON conversations FOR UPDATE
USING (
  auth.uid() IN (
    SELECT user_id FROM vendors
    WHERE id = conversations.vendor_id
  )
);

-- ==========================================
-- STEP 5: CREATE CORRECTED MESSAGES POLICIES
-- ==========================================

-- Participants can read messages in their conversations
CREATE POLICY "Participants can read messages"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND (
      c.buyer_id = auth.uid()
      OR auth.uid() IN (
        SELECT user_id FROM vendors
        WHERE id = c.vendor_id
      )
    )
  )
);

-- Authenticated participants can insert messages
CREATE POLICY "Authenticated participants can insert messages"
ON messages FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND (
      c.buyer_id = auth.uid()
      OR auth.uid() IN (
        SELECT user_id FROM vendors
        WHERE id = c.vendor_id
      )
    )
  )
);

-- Participants can update messages
CREATE POLICY "Participants can update messages"
ON messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND (
      c.buyer_id = auth.uid()
      OR auth.uid() IN (
        SELECT user_id FROM vendors
        WHERE id = c.vendor_id
      )
    )
  )
);

-- ==========================================
-- STEP 6: CONFIGURE REALTIME PUBLICATIONS
-- ==========================================

-- Ensure tables are in Realtime publication
ALTER PUBLICATION supabase_realtime
ADD TABLE conversations;

ALTER PUBLICATION supabase_realtime
ADD TABLE messages;

-- ==========================================
-- STEP 7: ADD STATUS AND ACTIVE COLUMNS
-- ==========================================

-- Add message status to messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS status text
NOT NULL DEFAULT 'sent'
CHECK (status IN ('sent', 'delivered', 'seen'));

-- Add online status to buyer_profiles
ALTER TABLE buyer_profiles
ADD COLUMN IF NOT EXISTS is_online boolean
NOT NULL DEFAULT false;

ALTER TABLE buyer_profiles
ADD COLUMN IF NOT EXISTS last_seen_at timestamptz
DEFAULT now();

-- Add online status to vendors
ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS is_online boolean
NOT NULL DEFAULT false;

ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS last_seen_at timestamptz
DEFAULT now();

-- ==========================================
-- STEP 8: CREATE INDEXES FOR PERFORMANCE
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_messages_status
ON messages(conversation_id, status);

CREATE INDEX IF NOT EXISTS idx_conversations_vendor
ON conversations(vendor_id);

CREATE INDEX IF NOT EXISTS idx_conversations_buyer
ON conversations(buyer_id);

CREATE INDEX IF NOT EXISTS idx_buyer_profiles_online
ON buyer_profiles(is_online, last_seen_at);

CREATE INDEX IF NOT EXISTS idx_vendors_online
ON vendors(is_online, last_seen_at);

-- ==========================================
-- STEP 9: VERIFICATION QUERIES
-- ==========================================

-- Verify column additions
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name IN ('messages', 'buyer_profiles', 'vendors')
AND column_name IN ('status', 'is_online', 'last_seen_at')
ORDER BY table_name, column_name;

-- Verify policies are correct
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('conversations', 'messages')
ORDER BY tablename, policyname;

-- Verify Realtime is enabled
SELECT tablename, relreplident
FROM pg_class
JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
WHERE pg_namespace.nspname = 'public'
AND pg_class.relname IN ('conversations', 'messages');
