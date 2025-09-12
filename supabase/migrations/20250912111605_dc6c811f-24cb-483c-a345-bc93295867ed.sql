-- Create secure RLS policies for admin table
-- Only authenticated admins can view other admins (for admin management features)
CREATE POLICY "Authenticated admins can view admin profiles" 
ON public.admins 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE id = auth.uid()
  )
);

-- Only authenticated admins can insert new admins
CREATE POLICY "Authenticated admins can create new admins" 
ON public.admins 
FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE id = auth.uid()
  )
);

-- Only authenticated admins can update admin profiles
CREATE POLICY "Authenticated admins can update admin profiles" 
ON public.admins 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE id = auth.uid()
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE id = auth.uid()
  )
);