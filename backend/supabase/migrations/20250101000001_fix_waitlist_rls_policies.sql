BEGIN;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can insert into waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Only admins can read waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Only admins can update waitlist" ON public.waitlist;

-- Create new policies that work with service role
CREATE POLICY "Allow service role to insert into waitlist" ON public.waitlist
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service role to read waitlist" ON public.waitlist
    FOR SELECT USING (true);

CREATE POLICY "Allow service role to update waitlist" ON public.waitlist
    FOR UPDATE USING (true);

-- Also allow authenticated users to insert (for direct frontend access)
CREATE POLICY "Allow authenticated users to insert into waitlist" ON public.waitlist
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

COMMIT;

