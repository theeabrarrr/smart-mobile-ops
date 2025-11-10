-- Create function to get users with low stock
CREATE OR REPLACE FUNCTION public.get_users_with_low_stock()
RETURNS TABLE(user_id UUID, available_count BIGINT)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    m.user_id,
    COUNT(*) as available_count
  FROM mobiles m
  WHERE m.is_sold = false
  GROUP BY m.user_id
  HAVING COUNT(*) < 5;
$$;