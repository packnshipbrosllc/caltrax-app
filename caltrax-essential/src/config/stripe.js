import { loadStripe } from '@stripe/stripe-js';

// Replace with your actual Stripe publishable key
// You can find this in your Stripe dashboard under "Developers" > "API keys"
const stripePublishableKey = process.env.REACTAPPSTRIPEPUBLISHABLEKEY || 'pk_live_51S843W2LmuiKVnPdDqRZB6VjLk2mflxRjmcGJEGFgeYBiD1qS8pihppJdJNwGVnU7r1BNEl1gmqJ0qtOMq67dNsq00hfphXU8o';

let stripePromise;

const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublishableKey);
  }
  return stripePromise;
};

export default getStripe;

// Stripe configuration
export const STRIPE_CONFIG = {
  // Your Stripe publishable key
  publishableKey: stripePublishableKey,
  
  // API endpoints (Netlify Functions)
  apiEndpoints: {
    createCustomer: '/.netlify/functions/create-customer',
    createSubscription: '/.netlify/functions/create-subscription',
    getSubscription: '/.netlify/functions/get-subscription',
    webhook: '/.netlify/functions/stripe-webhook',
  },
  
  // Plan configurations
  plans: {
    trial: {
      priceId: 'price_1S84cT2LmuiKVnPd3NXruhvk', // Monthly price for trial (will be charged after trial)
      amount: 500, // $5.00 in cents (will be charged after trial)
      currency: 'usd',
      interval: 'month',
    },
    monthly: {
      priceId: 'price_1S84cT2LmuiKVnPd3NXruhvk', // Monthly subscription
      amount: 500, // $5.00 in cents
      currency: 'usd',
      interval: 'month',
    },
    yearly: {
      priceId: 'price_1S84dS2LmuiKVnPdj6UCRzsN', // Yearly subscription
      amount: 3000, // $30.00 in cents
      currency: 'usd',
      interval: 'year',
    },
  },
  
  // Debug mode - set to true to see detailed logs
  debug: true,
  
  // Trial configuration
  trial: {
    days: 3,
    enabled: true,
  },
};

// Helper function to get plan configuration
export const getPlanConfig = (planId) => {
  return STRIPE_CONFIG.plans[planId] || STRIPE_CONFIG.plans.monthly;
};

// Helper function to format amount for display
export const formatAmount = (amount, currency = 'usd') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
};
