-- 1. Create subscription_plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Everyone can view subscription plans
CREATE POLICY "Anyone can view subscription plans"
ON public.subscription_plans
FOR SELECT
USING (true);

-- Only admins can manage plans
CREATE POLICY "Admins can manage subscription plans"
ON public.subscription_plans
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default subscription plans
INSERT INTO public.subscription_plans (id, name, price, description) VALUES
  ('basic', 'Free', 0, 'Up to 20 mobiles only'),
  ('standard', 'Standard', 799, 'Unlimited inventory with profit tracking'),
  ('premium', 'Premium', 1499, 'Everything in Standard plus AI Assistant')
ON CONFLICT (id) DO NOTHING;

-- 2. Remove duplicate columns from mobiles table
-- These columns will be managed only in purchases table
ALTER TABLE public.mobiles 
  DROP COLUMN IF EXISTS purchase_price,
  DROP COLUMN IF EXISTS supplier_name,
  DROP COLUMN IF EXISTS seller_cnic,
  DROP COLUMN IF EXISTS seller_phone,
  DROP COLUMN IF EXISTS purchase_date;

-- 3. Add trigger for subscription_plans updated_at
CREATE TRIGGER update_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();