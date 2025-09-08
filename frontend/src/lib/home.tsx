import { config } from '@/lib/config';

export interface PricingTier {
  name: string;
  price: string;
  yearlyPrice?: string;
  description: string;
  subDescription?: string;
  buttonText: string;
  buttonColor: string;
  isPopular: boolean;
  /** @deprecated */
  hours: string;
  features: string[];
  stripePriceId: string;
  yearlyStripePriceId?: string;
  upgradePlans: any[];
  hidden?: boolean;
  billingPeriod?: 'monthly' | 'yearly';
  originalYearlyPrice?: string;
  discountPercentage?: number;
}

export const siteConfig = {
  name: 'Helium AI',
  description: 'The Generalist AI Worker that can act on your behalf.',
  cta: 'Start Free',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  keywords: ['AI Worker', 'Generalist AI', 'Open Source AI', 'Autonomous Agent'],
  links: {
    email: 'support@neuralarc.ai',
    twitter: 'https://x.com/kortixai',
    github: 'https://github.com/Kortix-ai/Suna',
    instagram: 'https://instagram.com/kortixai',
  },
  cloudPricingItems: [
    {
      name: 'Free',
      price: '$0',
      description: 'No credit card required',
      buttonText: 'Start Free',
      buttonColor: 'bg-secondary text-white',
      isPopular: false,
      /** @deprecated */
      hours: '60 min',
      features: [
        '799 credits/month',
        '2 custom agents',
        'Public projects',
        'Upto 2 Integrations',
        'Community support',
      ],
      stripePriceId: config.SUBSCRIPTION_TIERS.FREE.priceId,
      upgradePlans: [],
    },
    {
      name: 'Outrageously Smart',
      price: '$24.99',
      yearlyPrice: '$254.89',
      originalYearlyPrice: '$299.88',
      discountPercentage: 15,
      description: 'Perfect for individuals and small projects',
      buttonText: 'Start Free',
      buttonColor: 'bg-primary text-white dark:text-black',
      isPopular: false,
      /** @deprecated */
      hours: '2 hours',
      features: [
        '3,000 credits/month',
        '5 custom agents',
        'Private projects',
        'Upto 10 Integrations',
        'Community support',
      ],
      stripePriceId: config.SUBSCRIPTION_TIERS.TIER_RIDICULOUSLY_CHEAP.priceId,
      yearlyStripePriceId: config.SUBSCRIPTION_TIERS.TIER_RIDICULOUSLY_CHEAP_YEARLY.priceId,
      upgradePlans: [],
    },
    {
      name: 'Supremely Serious',
      price: '$94.99',
      yearlyPrice: '$968.88',
      originalYearlyPrice: '$1139.88',
      discountPercentage: 15,
      description: 'Ideal for growing businesses and teams',
      buttonText: 'Start Free',
      buttonColor: 'bg-primary text-white dark:text-black',
      isPopular: true,
      /** @deprecated */
      hours: '6 hours',
      features: [
        '10,000 credits/month',
        '10 custom agents',
        'Private projects',
        'Unlimited Integrations',
        'Priority support',
      ],
      stripePriceId: config.SUBSCRIPTION_TIERS.TIER_SERIOUS_BUSINESS.priceId,
      yearlyStripePriceId: config.SUBSCRIPTION_TIERS.TIER_SERIOUS_BUSINESS_YEARLY.priceId,
      upgradePlans: [],
    },
  ],
};

export type SiteConfig = typeof siteConfig;
