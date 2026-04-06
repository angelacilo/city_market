-- Fix 1: Correct RLS for Inquiries Table
-- Drop existing insert policy if any
DROP POLICY IF EXISTS "Authenticated users can insert inquiries" ON inquiries;
DROP POLICY IF EXISTS "Vendors can read own inquiries" ON inquiries;
DROP POLICY IF EXISTS "Buyers can read own inquiries" ON inquiries;

-- Enable RLS
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- 1. Insert Policy: Logged-in users can send inquiries
CREATE POLICY "Authenticated users can insert inquiries"
ON inquiries FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

-- 2. Select Policy: Vendors can read own inquiries
CREATE POLICY "Vendors can read own inquiries"
ON inquiries FOR SELECT
TO authenticated
USING (
  vendor_id IN (
    SELECT id FROM vendors WHERE user_id = auth.uid()
  )
);

-- 3. Select Policy: Buyers can read own inquiries
-- (Assuming buyer_profiles table exists with user_id)
CREATE POLICY "Buyers can read own inquiries"
ON inquiries FOR SELECT
TO authenticated
USING (
  buyer_id IN (
    SELECT id FROM buyer_profiles WHERE user_id = auth.uid()
  )
);
