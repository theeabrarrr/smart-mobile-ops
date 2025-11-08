-- Fix RLS policy on profiles table
-- The current SELECT policy has incorrect column reference (id instead of user_id)

-- Drop the incorrect policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create the correct SELECT policy using user_id
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = user_id);