-- Insert a default profile for existing users who don't have one
INSERT INTO public.profiles (user_id, full_name, subscription_tier)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email) as full_name,
  'basic'::subscription_tier
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.user_id = u.id
);