-- Drop dependent policies first
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Update subscription tier enum to new plans
ALTER TYPE subscription_tier RENAME TO subscription_tier_old;

CREATE TYPE subscription_tier AS ENUM ('starter_kit', 'dealer_pack', 'empire_plan');

-- Update profiles table to use new enum
ALTER TABLE profiles 
  ALTER COLUMN subscription_tier DROP DEFAULT;

ALTER TABLE profiles
  ALTER COLUMN subscription_tier TYPE subscription_tier 
  USING CASE subscription_tier::text
    WHEN 'basic' THEN 'starter_kit'::subscription_tier
    WHEN 'standard' THEN 'dealer_pack'::subscription_tier
    WHEN 'premium' THEN 'empire_plan'::subscription_tier
  END;

ALTER TABLE profiles
  ALTER COLUMN subscription_tier SET DEFAULT 'starter_kit'::subscription_tier;

DROP TYPE subscription_tier_old;

-- Recreate the policy with updated logic
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND 
    subscription_tier = (SELECT subscription_tier FROM profiles WHERE user_id = auth.uid())
  );

-- Update subscription plans table with new plans
DELETE FROM subscription_plans;

INSERT INTO subscription_plans (id, name, price, description) VALUES
  ('starter_kit', 'Starter Kit', 999, 'Perfect for small mobile sellers - Up to 50 mobiles per month'),
  ('dealer_pack', 'Dealer Pack', 2999, 'Ideal for mid-level shops - Up to 200 mobiles per month'),
  ('empire_plan', 'Empire Plan', 9999, 'For wholesalers & chains - Unlimited records');

-- Create expenses table for expense tracking
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category text NOT NULL,
  amount numeric NOT NULL,
  description text,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- RLS policies for expenses
CREATE POLICY "Users can view their own expenses"
  ON public.expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
  ON public.expenses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
  ON public.expenses FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update subscription tier check function for new tiers
CREATE OR REPLACE FUNCTION public.check_subscription_tier(_user_id uuid, _required_tier text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT CASE _required_tier
    WHEN 'empire_plan' THEN subscription_tier = 'empire_plan'
    WHEN 'dealer_pack' THEN subscription_tier IN ('dealer_pack', 'empire_plan')
    WHEN 'starter_kit' THEN subscription_tier IN ('starter_kit', 'dealer_pack', 'empire_plan')
    ELSE true
  END
  FROM profiles 
  WHERE user_id = _user_id;
$$;

-- Update mobile count limits based on new tiers
CREATE OR REPLACE FUNCTION public.get_tier_mobile_limit(_user_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT CASE subscription_tier
    WHEN 'starter_kit' THEN 50
    WHEN 'dealer_pack' THEN 200
    WHEN 'empire_plan' THEN NULL  -- unlimited
  END
  FROM profiles
  WHERE user_id = _user_id;
$$;

-- Update mobiles insert policy with new tier limits
DROP POLICY IF EXISTS "Users can insert mobiles with tier limit" ON public.mobiles;

CREATE POLICY "Users can insert mobiles with tier limit"
  ON public.mobiles FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND (
      check_subscription_tier(auth.uid(), 'empire_plan') OR
      get_user_mobile_count(auth.uid()) < COALESCE(get_tier_mobile_limit(auth.uid()), 999999)
    )
  );

-- Update purchases insert policy with new tier limits  
DROP POLICY IF EXISTS "Users can insert purchases with tier limit" ON public.purchases;

CREATE POLICY "Users can insert purchases with tier limit"
  ON public.purchases FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND (
      check_subscription_tier(auth.uid(), 'empire_plan') OR
      get_user_mobile_count(auth.uid()) < COALESCE(get_tier_mobile_limit(auth.uid()), 999999)
    )
  );