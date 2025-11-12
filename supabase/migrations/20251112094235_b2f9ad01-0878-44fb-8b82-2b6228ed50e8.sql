-- Update subscription plan prices to match the new pricing structure
UPDATE subscription_plans
SET price = 0, updated_at = now()
WHERE id = 'starter_kit';

UPDATE subscription_plans
SET price = 600, updated_at = now()
WHERE id = 'dealer_pack';

UPDATE subscription_plans
SET price = 1500, updated_at = now()
WHERE id = 'empire_plan';