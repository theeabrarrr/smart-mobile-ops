// Subscription tier constants and feature definitions

export type SubscriptionTier = 'free' | 'standard' | 'premium';

export const TIER_LEVELS = {
  free: 0,
  standard: 1,
  premium: 2
} as const;

export type FeatureName = 
  | 'unlimited_inventory'
  | 'profit_tracking'
  | 'reports'
  | 'export_data'
  | 'email_support'
  | 'seller_tracking'
  | 'ai_assistant'
  | 'bulk_purchase'
  | 'custom_reports';

export const FEATURE_REQUIREMENTS: Record<FeatureName, SubscriptionTier> = {
  unlimited_inventory: 'standard',
  profit_tracking: 'standard',
  reports: 'standard',
  export_data: 'standard',
  email_support: 'standard',
  seller_tracking: 'standard',
  ai_assistant: 'premium',
  bulk_purchase: 'premium',
  custom_reports: 'premium'
};

export const canAccessFeature = (
  userTier: SubscriptionTier,
  feature: FeatureName
): boolean => {
  const requiredTier = FEATURE_REQUIREMENTS[feature];
  return TIER_LEVELS[userTier] >= TIER_LEVELS[requiredTier];
};

export const getRequiredTierForFeature = (feature: FeatureName): SubscriptionTier => {
  return FEATURE_REQUIREMENTS[feature];
};

export const getUpgradeMessage = (
  userTier: SubscriptionTier,
  feature: FeatureName
): string => {
  const requiredTier = FEATURE_REQUIREMENTS[feature];
  
  if (userTier === 'free' && requiredTier === 'standard') {
    return 'Upgrade to Standard or Premium to access this feature.';
  }
  if (userTier === 'free' && requiredTier === 'premium') {
    return 'Upgrade to Standard or Premium to access this feature.';
  }
  if (userTier === 'standard' && requiredTier === 'premium') {
    return 'Upgrade to Premium to access this feature.';
  }
  
  return 'Upgrade your plan to access this feature.';
};
