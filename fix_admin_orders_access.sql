-- ============================================================
-- FIX: Admin profile role + Orders RLS for admin access
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Set the admin role for your user
UPDATE public.profiles
SET role = 'admin'
WHERE id = 'facb305d-3a61-4ad2-8255-299712b0e6ff';

-- 2. Add role column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'customer';
    -- Set the admin
    UPDATE public.profiles SET role = 'admin' WHERE id = 'facb305d-3a61-4ad2-8255-299712b0e6ff';
  END IF;
END $$;

-- 3. Fix orders RLS — allow admins to see ALL orders
DROP POLICY IF EXISTS "Authenticated users can view orders." ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;

-- Users see their own orders
CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow admin to update any order (for status changes)
DROP POLICY IF EXISTS "Authenticated users can update orders." ON public.orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;

CREATE POLICY "Admins can update all orders"
  ON public.orders FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Keep insert policy
DROP POLICY IF EXISTS "Users can create own orders." ON public.orders;
CREATE POLICY "Users can create own orders."
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. Verify
SELECT id, email, role FROM public.profiles WHERE id = 'facb305d-3a61-4ad2-8255-299712b0e6ff';

-- Reload schema cache
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- DONE! Refresh the admin dashboard and orders should load.
-- ============================================================
