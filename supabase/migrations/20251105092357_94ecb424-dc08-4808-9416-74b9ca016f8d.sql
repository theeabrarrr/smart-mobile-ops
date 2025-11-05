-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Create subscription_logs table
CREATE TABLE public.subscription_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  from_tier TEXT,
  to_tier TEXT,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for subscription_logs
ALTER TABLE public.subscription_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscription_logs
CREATE POLICY "Users can view their own logs"
  ON public.subscription_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all logs"
  ON public.subscription_logs
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert logs"
  ON public.subscription_logs
  FOR INSERT
  WITH CHECK (true);

-- Function to handle subscription expiry
CREATE OR REPLACE FUNCTION public.handle_subscription_expiry()
RETURNS TABLE(downgraded_count INTEGER) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expired_record RECORD;
  count INTEGER := 0;
BEGIN
  -- Find and downgrade expired subscriptions
  FOR expired_record IN 
    SELECT user_id, subscription_tier, full_name
    FROM profiles
    WHERE subscription_expires_at IS NOT NULL 
      AND subscription_expires_at < NOW()
      AND subscription_tier != 'basic'
  LOOP
    -- Log the downgrade
    INSERT INTO subscription_logs (user_id, action, from_tier, to_tier, reason)
    VALUES (
      expired_record.user_id,
      'downgraded',
      expired_record.subscription_tier,
      'basic',
      'Subscription expired'
    );
    
    -- Downgrade to basic
    UPDATE profiles
    SET subscription_tier = 'basic',
        subscription_expires_at = NULL,
        updated_at = NOW()
    WHERE user_id = expired_record.user_id;
    
    count := count + 1;
  END LOOP;
  
  RETURN QUERY SELECT count;
END;
$$;

-- Function to get expiring subscriptions (for warnings)
CREATE OR REPLACE FUNCTION public.get_expiring_subscriptions(days_ahead INTEGER DEFAULT 7)
RETURNS TABLE(
  user_id UUID,
  full_name TEXT,
  email TEXT,
  subscription_tier TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  days_remaining INTEGER
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.user_id,
    p.full_name,
    au.email,
    p.subscription_tier::TEXT,
    p.subscription_expires_at,
    EXTRACT(DAY FROM (p.subscription_expires_at - NOW()))::INTEGER as days_remaining
  FROM profiles p
  JOIN auth.users au ON au.id = p.user_id
  WHERE p.subscription_expires_at IS NOT NULL
    AND p.subscription_expires_at > NOW()
    AND p.subscription_expires_at <= NOW() + (days_ahead || ' days')::INTERVAL
    AND p.subscription_tier != 'basic'
  ORDER BY p.subscription_expires_at ASC;
$$;