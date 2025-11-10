import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { SubscriptionTier, TIER_LIMITS } from '@/lib/subscriptionTiers';

interface SubscriptionFeatures {
  canAddMoreMobiles: (currentCount: number) => boolean;
  canAccessExpenseTracker: boolean;
  canAccessCustomerHistory: boolean;
  canAccessMultiUserRoles: boolean;
  canAccessProfitLossSummary: boolean;
  canAccessAdvancedAnalytics: boolean;
  canAccessStockAlerts: boolean;
  canAccessCustomReports: boolean;
  canAccessMultiBranch: boolean;
  canAccessPrioritySupport: boolean;
  // Legacy feature names for backward compatibility
  canAccessProfitTracking: boolean;
  canAccessReports: boolean;
  canTrackSellerInfo: boolean;
  maxMobiles: number | null;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [tier, setTier] = useState<SubscriptionTier>('starter_kit');
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
        setTier(data.subscription_tier as SubscriptionTier);
      }
      setLoading(false);
    };

    fetchTier();
  }, [user]);

  const features: SubscriptionFeatures = {
    canAddMoreMobiles: (currentCount: number) => {
      const limit = TIER_LIMITS[tier];
      if (limit === null) return true; // unlimited
      return currentCount < limit;
    },
    canAccessExpenseTracker: tier === 'dealer_pack' || tier === 'empire_plan',
    canAccessCustomerHistory: tier === 'dealer_pack' || tier === 'empire_plan',
    canAccessMultiUserRoles: tier === 'dealer_pack' || tier === 'empire_plan',
    canAccessProfitLossSummary: tier === 'dealer_pack' || tier === 'empire_plan',
    canAccessAdvancedAnalytics: tier === 'empire_plan',
    canAccessStockAlerts: tier === 'empire_plan',
    canAccessCustomReports: tier === 'empire_plan',
    canAccessMultiBranch: tier === 'empire_plan',
    canAccessPrioritySupport: tier === 'empire_plan',
    // Legacy features for backward compatibility
    canAccessProfitTracking: tier === 'dealer_pack' || tier === 'empire_plan',
    canAccessReports: tier === 'dealer_pack' || tier === 'empire_plan',
    canTrackSellerInfo: tier === 'dealer_pack' || tier === 'empire_plan',
    maxMobiles: TIER_LIMITS[tier],
  };

  return {
    tier,
    features,
    loading,
  };
};
