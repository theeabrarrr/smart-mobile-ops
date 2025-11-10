// Subscription tier constants and feature definitions

export type SubscriptionTier = 'starter_kit' | 'dealer_pack' | 'empire_plan';

export const TIER_LEVELS = {
  starter_kit: 0,
  dealer_pack: 1,
  empire_plan: 2
} as const;

export const TIER_LIMITS = {
  starter_kit: 50,
  dealer_pack: 200,
  empire_plan: null // unlimited
} as const;

export type FeatureName = 
  | 'expense_tracker'
  | 'customer_history'
  | 'multi_user_roles'
  | 'profit_loss_summary'
  | 'advanced_analytics'
  | 'stock_alerts'
  | 'custom_reports'
  | 'multi_branch'
  | 'priority_support';

export const FEATURE_REQUIREMENTS: Record<FeatureName, SubscriptionTier> = {
  expense_tracker: 'dealer_pack',
  customer_history: 'dealer_pack',
  multi_user_roles: 'dealer_pack',
  profit_loss_summary: 'dealer_pack',
  advanced_analytics: 'empire_plan',
  stock_alerts: 'empire_plan',
  custom_reports: 'empire_plan',
  multi_branch: 'empire_plan',
  priority_support: 'empire_plan'
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
  
  if (userTier === 'starter_kit' && requiredTier === 'dealer_pack') {
    return 'Upgrade to Dealer Pack or Empire Plan to access this feature.';
  }
  if (userTier === 'starter_kit' && requiredTier === 'empire_plan') {
    return 'Upgrade to Empire Plan to access this feature.';
  }
  if (userTier === 'dealer_pack' && requiredTier === 'empire_plan') {
    return 'Upgrade to Empire Plan to access this feature.';
  }
  
  return 'Upgrade your plan to access this feature.';
};

export const getTierDisplayName = (tier: SubscriptionTier): string => {
  const names = {
    starter_kit: 'Starter Kit',
    dealer_pack: 'Dealer Pack',
    empire_plan: 'Empire Plan'
  };
  return names[tier];
};

export const getTierLimit = (tier: SubscriptionTier): number | null => {
  return TIER_LIMITS[tier];
};
