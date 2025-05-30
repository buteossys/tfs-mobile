// Development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// API Gateway endpoints
export const API_ENDPOINTS = {
  GENERATE_IMAGE: 'http://18.222.214.219:5000/images/generate',
  CREATE_MOCKUP: 'http://18.222.214.219:5000/products/create',
  PAYMENT: 'http://18.222.214.219:5000/payments/create-intent',
  ORDER: 'http://18.222.214.219:5000/orders/create',
  WEBHOOK: 'http://18.222.214.219:5000/webhooks/stripe',
  BLUEPRINTS: 'http://18.222.214.219:5000/blueprints',
  BLUEPRINTS_ALL: 'http://18.222.214.219:5000/blueprints/all',
  CREATE_PRODUCT: 'http://18.222.214.219:5000/products/create',
  REMOVE_BACKGROUND: 'http://18.222.214.219:5000/images/remove-bg',
  COMPOSE_IMAGE: 'http://18.222.214.219:5000/images/compose',
  PRINTIFY_API_KEY: process.env.EXPO_PUBLIC_PRINTIFY_API_KEY,
  PRINTIFY_SHOP_ID: process.env.EXPO_PUBLIC_PRINTIFY_SHOP_ID,
  UPLOAD_IMAGE: 'http://18.222.214.219:5000/images/upload',
  JOB_STATUS: 'http://18.222.214.219:5000/api/job-status',
};

// Stripe configuration
export const STRIPE_CONFIG = {
  PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  // For development, you can use test mode
  TEST_MODE: isDevelopment,
};



// Default export for the config
export default function Config() {
  return null; // This component doesn't render anything
} 