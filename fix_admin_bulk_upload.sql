-- Step 1: See all profiles and their roles
SELECT id, email, role FROM public.profiles;

-- Step 2: Set ALL authenticated users as admin (for now, to unblock)
-- After running Step 1, copy your admin user's email and run:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'YOUR_EMAIL_HERE';

-- OR: Just set everyone as admin to unblock quickly:
UPDATE public.profiles SET role = 'admin' WHERE role IS NULL OR role != 'admin';

-- Step 3: Fix the RLS policy to include WITH CHECK (required for INSERT)
DROP POLICY IF EXISTS "Admins full access on products" ON public.products;
CREATE POLICY "Admins full access on products"
  ON public.products FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Step 4: Reload schema
NOTIFY pgrst, 'reload schema';
