-- Create security definer function to check subscription tier
CREATE OR REPLACE FUNCTION public.check_subscription_tier(
  _user_id uuid, 
  _required_tier text
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE _required_tier
    WHEN 'premium' THEN subscription_tier = 'premium'
    WHEN 'standard' THEN subscription_tier IN ('standard', 'premium')
    ELSE true  -- basic tier
  END
  FROM profiles 
  WHERE user_id = _user_id;
$$;

-- Create security definer function to get mobile count for a user
CREATE OR REPLACE FUNCTION public.get_user_mobile_count(_user_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer FROM mobiles WHERE user_id = _user_id;
$$;

-- Drop existing INSERT policies on mobiles table
DROP POLICY IF EXISTS "Users can manage their own mobiles" ON mobiles;

-- Recreate policies with subscription enforcement
CREATE POLICY "Users can view their own mobiles"
ON mobiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert mobiles with tier limit"
ON mobiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  (
    check_subscription_tier(auth.uid(), 'standard')
    OR get_user_mobile_count(auth.uid()) < 20
  )
);

CREATE POLICY "Users can update their own mobiles"
ON mobiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mobiles"
ON mobiles
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Drop existing INSERT policies on purchases table
DROP POLICY IF EXISTS "Users can manage their own purchases" ON purchases;

-- Recreate policies with subscription enforcement
CREATE POLICY "Users can view their own purchases"
ON purchases
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert purchases with tier limit"
ON purchases
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  (
    check_subscription_tier(auth.uid(), 'standard')
    OR get_user_mobile_count(auth.uid()) < 20
  )
);

CREATE POLICY "Users can update their own purchases"
ON purchases
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own purchases"
ON purchases
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Drop existing UPDATE policy on profiles table
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Recreate policy preventing subscription tier manipulation
CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND
  subscription_tier = (SELECT subscription_tier FROM profiles WHERE user_id = auth.uid())
);