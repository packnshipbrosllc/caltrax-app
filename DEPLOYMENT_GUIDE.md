# 🚀 CalTrax AI - Quick Deployment Guide

## 📦 Ready-to-Deploy Package
**File:** `caltrax-ai-ready-to-deploy.zip` (622 KB)
**Location:** `/Users/johnjohn/Downloads/food-lens-app/caltrax-ai-ready-to-deploy.zip`

## ⚡ Quick Deploy Steps

### 1. Deploy to Netlify
1. Go to [app.netlify.com](https://app.netlify.com)
2. Click **"Add new site"** → **"Deploy manually"**
3. Drag and drop `caltrax-ai-ready-to-deploy.zip`
4. Wait for deployment (2-3 minutes)
5. **Copy your site URL** (e.g., `https://amazing-name-123456.netlify.app`)

### 2. Set Environment Variables
1. Go to **Site Settings** → **Environment Variables**
2. Add these variables:

```
STRIPE_SECRET_KEY=sk_live_your_actual_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_placeholder_for_now
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_51S843W2LmuiKVnPdDqRZB6VjLk2mflxRjmcGJEGFgeYBiD1qS8pihppJdJNwGVnU7r1BNEl1gmqJ0qtOMq67dNsq00hfphXU8o
```

### 3. Create Stripe Products
1. Go to [dashboard.stripe.com/products](https://dashboard.stripe.com/products)
2. Create **Monthly Plan**: $5.00/month
3. Create **Yearly Plan**: $30.00/year
4. **Copy the Price IDs** (start with `price_`)

### 4. Update Price IDs
1. Edit `src/config/stripe.js` in your project
2. Replace `price_1234567890` with monthly price ID
3. Replace `price_0987654321` with yearly price ID
4. Rebuild and redeploy

### 5. Set Up Webhooks
1. Go to [dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://your-site-name.netlify.app/.netlify/functions/stripe-webhook`
3. Select events: `customer.subscription.*`, `invoice.payment_*`
4. Copy webhook secret and update in Netlify

## ✅ What's Included
- ✅ Complete React app with Stripe integration
- ✅ Netlify Functions for secure backend
- ✅ 3-day free trial with auto-billing
- ✅ Monthly ($5) and Yearly ($30) plans
- ✅ Live Stripe publishable key
- ✅ Webhook handling
- ✅ Secure payment processing

## 🧪 Test Cards
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

## 🚨 Important
- Replace `sk_live_your_actual_secret_key_here` with your real Stripe secret key
- Create products in Stripe and update price IDs
- Set up webhooks for subscription management
- Test thoroughly before going live

Ready to deploy! 🎯
