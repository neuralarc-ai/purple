// Environment mode types
export enum EnvMode {
  LOCAL = 'local',
  STAGING = 'staging',
  PRODUCTION = 'production',
}

// Subscription tier structure
export interface SubscriptionTierData {
  priceId: string;
  name: string;
}

// Subscription tiers structure
export interface SubscriptionTiers {
  FREE: SubscriptionTierData;
  TIER_RIDICULOUSLY_CHEAP: SubscriptionTierData;
  TIER_SERIOUS_BUSINESS: SubscriptionTierData;
  // Yearly plans with 15% discount
  TIER_RIDICULOUSLY_CHEAP_YEARLY: SubscriptionTierData;
  TIER_SERIOUS_BUSINESS_YEARLY: SubscriptionTierData;
}

// Configuration object
interface Config {
  ENV_MODE: EnvMode;
  IS_LOCAL: boolean;
  IS_STAGING: boolean;
  SUBSCRIPTION_TIERS: SubscriptionTiers;
  BACKEND_URL: string;
}

// Production tier IDs
const PROD_TIERS: SubscriptionTiers = {
  FREE: {
    priceId: 'price_1S1ud4AnxOD5rXBGNHW2yHp8',
    name: 'Free',
  },
  TIER_RIDICULOUSLY_CHEAP: {
    priceId: 'price_1S2VNiAnxOD5rXBGWs7gO2rv',
    name: 'Outrageously Smart - $24.99/month',
  },
  TIER_SERIOUS_BUSINESS: {
    priceId: 'price_1S2VO6AnxOD5rXBGU5KcFi0O',
    name: 'Supremely Serious - $94.99/month',
  },
  // Yearly plans with 15% discount
  TIER_RIDICULOUSLY_CHEAP_YEARLY: {
    priceId: 'price_1S2VOMAnxOD5rXBGOfBNWIe4',
    name: 'Outrageously Smart - $254.89/year',
  },
  TIER_SERIOUS_BUSINESS_YEARLY: {
    priceId: 'price_1S2VOfAnxOD5rXBGI80iSxA5',
    name: 'Supremely Serious - $968.88/year',
  },
} as const;

// Staging tier IDs
const STAGING_TIERS: SubscriptionTiers = {
  FREE: {
    priceId: 'price_1RIGvuG6l1KZGqIrw14abxeL',
    name: 'Free',
  },
  TIER_RIDICULOUSLY_CHEAP: {
    priceId: 'price_1RIGvuG6l1KZGqIrCRu0E4Gi',
    name: 'Outrageously Smart - $24.99/month',
  },
  TIER_SERIOUS_BUSINESS: {
    priceId: 'price_1RIGvuG6l1KZGqIrvjlz5p5V',
    name: 'Supremely Serious - $94.99/month',
  },
  // Yearly plans with 15% discount
  TIER_RIDICULOUSLY_CHEAP_YEARLY: {
    priceId: 'price_1ReGogG6l1KZGqIrEyBTmtPk',
    name: 'Outrageously Smart - $254.89/year',
  },
  TIER_SERIOUS_BUSINESS_YEARLY: {
    priceId: 'price_1ReGoJG6l1KZGqIr0DJWtoOc',
    name: 'Supremely Serious - $968.88/year',
  },
} as const;

function getEnvironmentMode(): EnvMode {
  const envMode = (process.env.NEXT_PUBLIC_ENV_MODE || '').toUpperCase();
  switch (envMode) {
    case 'LOCAL':
      return EnvMode.LOCAL;
    case 'STAGING':
      return EnvMode.STAGING;
    case 'PRODUCTION':
      return EnvMode.PRODUCTION;
    default:
      if (process.env.NODE_ENV === 'development') {
        return EnvMode.LOCAL;
      } else {
        return EnvMode.PRODUCTION;
      }
  }
}

function getBackendUrl(): string {
  const envMode = getEnvironmentMode();
  
  switch (envMode) {
    case EnvMode.LOCAL:
      return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    case EnvMode.STAGING:
      return process.env.NEXT_PUBLIC_BACKEND_URL || 'https://staging-api.he2.ai';
    case EnvMode.PRODUCTION:
      return process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.he2.ai';
    default:
      return 'http://localhost:8000';
  }
}

const currentEnvMode = getEnvironmentMode();

export const config: Config = {
  ENV_MODE: currentEnvMode,
  IS_LOCAL: currentEnvMode === EnvMode.LOCAL,
  IS_STAGING: currentEnvMode === EnvMode.STAGING,
  SUBSCRIPTION_TIERS:
    currentEnvMode === EnvMode.STAGING ? STAGING_TIERS : PROD_TIERS,
  BACKEND_URL: getBackendUrl(),
};

export const isLocalMode = (): boolean => {
  return config.IS_LOCAL;
};

export const isStagingMode = (): boolean => {
  return config.IS_STAGING;
};

export const isProductionMode = (): boolean => {
  return config.ENV_MODE === EnvMode.PRODUCTION;
};

// Plan type identification functions
export const isMonthlyPlan = (priceId: string): boolean => {
  const allTiers = config.SUBSCRIPTION_TIERS;
  const monthlyTiers = [
    allTiers.TIER_RIDICULOUSLY_CHEAP, allTiers.TIER_SERIOUS_BUSINESS
  ];
  return monthlyTiers.some(tier => tier.priceId === priceId);
};

export const isYearlyPlan = (priceId: string): boolean => {
  const allTiers = config.SUBSCRIPTION_TIERS;
  const yearlyTiers = [
    allTiers.TIER_RIDICULOUSLY_CHEAP_YEARLY, allTiers.TIER_SERIOUS_BUSINESS_YEARLY
  ];
  return yearlyTiers.some(tier => tier.priceId === priceId);
};

// Tier level mappings for all plan types
const PLAN_TIERS = {
  // Monthly plans
  [PROD_TIERS.TIER_RIDICULOUSLY_CHEAP.priceId]: { tier: 1, type: 'monthly', name: 'Outrageously Smart - $24.99/month' },
  [PROD_TIERS.TIER_SERIOUS_BUSINESS.priceId]: { tier: 2, type: 'monthly', name: 'Supremely Serious - $94.99/month' },
  
  // Yearly plans  
  [PROD_TIERS.TIER_RIDICULOUSLY_CHEAP_YEARLY.priceId]: { tier: 1, type: 'yearly', name: 'Outrageously Smart - $254.89/year' },
  [PROD_TIERS.TIER_SERIOUS_BUSINESS_YEARLY.priceId]: { tier: 2, type: 'yearly', name: 'Supremely Serious - $968.88/year' },

  // Staging plans
  [STAGING_TIERS.TIER_RIDICULOUSLY_CHEAP.priceId]: { tier: 1, type: 'monthly', name: 'Outrageously Smart - $24.99/month' },
  [STAGING_TIERS.TIER_SERIOUS_BUSINESS.priceId]: { tier: 2, type: 'monthly', name: 'Supremely Serious - $94.99/month' },
  
  [STAGING_TIERS.TIER_RIDICULOUSLY_CHEAP_YEARLY.priceId]: { tier: 1, type: 'yearly', name: 'Outrageously Smart - $254.89/year' },
  [STAGING_TIERS.TIER_SERIOUS_BUSINESS_YEARLY.priceId]: { tier: 2, type: 'yearly', name: 'Supremely Serious - $968.88/year' },
} as const;

export const getPlanInfo = (priceId: string) => {
  return PLAN_TIERS[priceId as keyof typeof PLAN_TIERS] || { tier: 0, type: 'unknown', name: 'Unknown' };
};

// Plan change validation function
export const isPlanChangeAllowed = (currentPriceId: string, newPriceId: string): { allowed: boolean; reason?: string } => {
  const currentPlan = getPlanInfo(currentPriceId);
  const newPlan = getPlanInfo(newPriceId);

  // Allow if same plan
  if (currentPriceId === newPriceId) {
    return { allowed: true };
  }

  // Restriction: Don't allow downgrade from monthly to lower monthly
  if (currentPlan.type === 'monthly' && newPlan.type === 'monthly' && newPlan.tier < currentPlan.tier) {
    return { 
      allowed: false, 
      reason: 'Downgrading to a lower monthly plan is not allowed. You can only upgrade to a higher tier or switch to yearly billing.' 
    };
  }

  // Restriction: Don't allow downgrade from yearly to lower yearly
  if (currentPlan.type === 'yearly' && newPlan.type === 'yearly' && newPlan.tier < currentPlan.tier) {
    return { 
      allowed: false, 
      reason: 'Downgrading to a lower yearly plan is not allowed. You can only upgrade to higher yearly tiers.' 
    };
  }

  // Allow all other changes (upgrades, monthly to yearly, yearly to monthly, etc.)
  return { allowed: true };
};

// Get API base URL based on environment
export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    // Server-side rendering
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  }
  
  // Client-side
  if (isLocalMode()) {
    return 'http://localhost:3000';
  } else if (isStagingMode()) {
    return 'https://staging.yourdomain.com';
  }
  return 'https://api.yourdomain.com';
}

// Export subscription tier type for typing elsewhere
export type SubscriptionTier = keyof typeof config.SUBSCRIPTION_TIERS;
