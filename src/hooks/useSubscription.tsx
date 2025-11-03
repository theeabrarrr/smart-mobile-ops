import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type SubscriptionTier = 'basic' | 'standard' | 'premium';

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
  const [tier, setTier] = useState<SubscriptionTier>('basic');
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
      if (tier === 'basic') return currentCount < 20;
      return true; // standard and premium have unlimited
    },
    canAccessProfitTracking: tier === 'standard' || tier === 'premium',
    canExportData: tier === 'standard' || tier === 'premium',
    canAccessReports: tier === 'standard' || tier === 'premium',
    canAccessAI: tier === 'premium',
    canAccessBulkPurchase: tier === 'premium',
    canAccessCustomReports: tier === 'premium',
    canTrackSellerInfo: tier === 'standard' || tier === 'premium',
    maxMobiles: tier === 'basic' ? 20 : null,
  };

  return {
    tier,
    features,
    loading,
  };
};
