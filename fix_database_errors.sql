-- ============================================================
-- SWAXTIKA — Fix Database Schema & Storage RLS Policies
-- Run this in your Supabase SQL Editor to fix the 400 & Storage Errors
-- ============================================================

-- 1. Fix the 400 Bad Request Error on Products
-- The products table was missing the seller_id column, causing any queries filtering by it to fail.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seller_id UUID;

-- 2. Fix the Storage RLS Error for Product Images
-- Ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Product Images Seller Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Product Images Seller Delete Access" ON storage.objects;
DROP POLICY IF EXISTS "Product Images Admin Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Product Images Admin Delete Access" ON storage.objects;

-- Create policy to allow authenticated users (sellers) to upload images to this bucket
CREATE POLICY "Product Images Seller Upload Access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Create policy to allow authenticated users (sellers) to update/delete their uploaded images
CREATE POLICY "Product Images Seller Delete Access"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

CREATE POLICY "Product Images Seller Update Access"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images');

-- Ensure public read access is intact
DROP POLICY IF EXISTS "Product Images Public Access" ON storage.objects;
CREATE POLICY "Product Images Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Reload schema cache so PostgREST picks up the new column immediately
NOTIFY pgrst, 'reload schema';
