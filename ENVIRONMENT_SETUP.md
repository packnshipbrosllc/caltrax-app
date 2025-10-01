# Environment Variables Setup Guide

## Required Environment Variables for Vercel

Add these environment variables to your Vercel project settings:

### Frontend Variables (REACT_APP_*)
```
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_... (or pk_live_...)
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_... (or pk_live_...)
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Backend Variables (for API routes)
```
STRIPE_SECRET_KEY=sk_test_... (or sk_live_...)
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
CLERK_SECRET_KEY=sk_test_... (for webhook)
OPENAI_API_KEY=sk-...
```

## How to Add Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable with the appropriate value
5. Make sure to set the environment (Production, Preview, Development)

## Stripe Setup

1. Create products and prices in Stripe Dashboard
2. Copy the Price ID (starts with `price_`)
3. Update `PaymentPage.jsx` line 19 with your actual Price ID:
   ```javascript
   priceId: 'price_1234567890', // Replace with YOUR actual Price ID
   ```

## Webhook Setup

1. In Stripe Dashboard, go to Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/stripe/webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copy the webhook secret and add to `STRIPE_WEBHOOK_SECRET`

## Testing

Use Stripe test card: `4242 4242 4242 4242`
- Any future expiry date
- Any 3-digit CVC
- Any billing address

## Complete Flow

1. User signs up with Clerk
2. Redirected to PaymentPage
3. Completes Stripe checkout
4. Redirected to SuccessPage
5. Clicks "Complete Profile"
6. Fills out UserProfile
7. Redirected to main app

All payment status is saved to both Supabase and Clerk metadata for redundancy.
