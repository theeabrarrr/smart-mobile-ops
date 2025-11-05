import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { SubscriptionTier } from '@/lib/subscriptionTiers';

// Map database tiers to app tiers
const mapDatabaseTier = (tier: string): SubscriptionTier => {
  if (tier === 'basic') return 'free';
  return tier as SubscriptionTier;
};

interface SubscriptionFeatures {
  canAddMoreMobiles: (currentCount: number) => boolean;
  canAccessProfitTracking: boolean;
  canExportData: boolean;
  canAccessReports: boolean;
  canAccessAI: boolean;
  canAccessBulkPurchase: boolean;
  canAccessCustomReports: boolean;
  canTrackSellerInfo: boolean;
  maxMobiles: number | null;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchTier = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setTier(mapDatabaseTier(data.subscription_tier));
      }
      setLoading(false);
    };

    fetchTier();
  }, [user]);

  const features: SubscriptionFeatures = {
    canAddMoreMobiles: (currentCount: number) => {
      if (tier === 'free') return currentCount < 20;
      return true; // standard and premium have unlimited
    },
    canAccessProfitTracking: tier === 'standard' || tier === 'premium',
    canExportData: tier === 'standard' || tier === 'premium',
    canAccessReports: tier === 'standard' || tier === 'premium',
    canAccessAI: tier === 'premium',
    canAccessBulkPurchase: tier === 'premium',
    canAccessCustomReports: tier === 'premium',
    canTrackSellerInfo: tier === 'standard' || tier === 'premium',
    maxMobiles: tier === 'free' ? 20 : null,
  };

  return {
    tier,
    features,
    loading,
  };
};
