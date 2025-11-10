import { SubscriptionTier } from '@/lib/subscriptionTiers';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  business_name: string | null;
  phone: string | null;
  address: string | null;
  subscription_tier: SubscriptionTier;
  subscription_expires_at: string | null;
  created_at: string;
  updated_at: string;
}
