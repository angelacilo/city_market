-- =============================================================
-- Supabase RLS Policies for the `inquiries` table
-- Apply these in the Supabase SQL editor (Dashboard > SQL Editor).
--
-- NOTE: The public insert policy is INTENTIONAL.
-- Buyers do not need to log in to contact a vendor.
-- All other access (select, update, delete) is restricted to
-- the vendor who owns the inquiry.
-- =============================================================

-- ── 1. Public insert (unauthenticated buyers can send inquiries) ──
CREATE POLICY "Public can insert inquiries"
ON public.inquiries
FOR INSERT
TO public
WITH CHECK (true);

-- ── 2. Vendors can only read their own inquiries ──────────────────
CREATE POLICY "Vendors can read own inquiries"
ON public.inquiries
FOR SELECT
TO authenticated
USING (
  vendor_id IN (
    SELECT id FROM public.vendors WHERE user_id = auth.uid()
  )
);

-- ── 3. Vendors can update their own inquiries (e.g. mark as read) ─
CREATE POLICY "Vendors can update own inquiries"
ON public.inquiries
FOR UPDATE
TO authenticated
USING (
  vendor_id IN (
    SELECT id FROM public.vendors WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  vendor_id IN (
    SELECT id FROM public.vendors WHERE user_id = auth.uid()
  )
);
