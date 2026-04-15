-- CREATE TABLE IF NOT EXISTS price_history
-- This script creates the price_history table and sets up RLS and Realtime.
-- If you are seeing 404 errors in the console for price_history, run this SQL in your Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS price_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id uuid REFERENCES price_listings(id)
    ON DELETE CASCADE NOT NULL,
  price decimal NOT NULL,
  recorded_at timestamptz DEFAULT now() NOT NULL,
  recorded_by uuid REFERENCES auth.users(id)
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_price_history_listing
  ON price_history(listing_id, recorded_at DESC);

ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- DROP POLICY IF EXISTS "Public can read price history" ON price_history;
CREATE POLICY "Public can read price history"
  ON price_history FOR SELECT
  USING (true);

-- DROP POLICY IF EXISTS "Authenticated vendors can insert" ON price_history;
CREATE POLICY "Authenticated vendors can insert"
  ON price_history FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Ensure the table is part of the realtime publication
-- Check if publication exists first, or just try to add
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE price_history;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Already added
END $$;
