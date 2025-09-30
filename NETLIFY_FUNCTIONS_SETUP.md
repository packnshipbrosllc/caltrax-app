# 🚀 CalTrax AI - Netlify Functions + Stripe Setup Guide

## ✅ What's Been Created

### **Netlify Functions:**
- `create-customer.js` - Creates Stripe customers
- `create-subscription.js` - Handles subscription creation with 3-day trials
- `get-subscription.js` - Checks subscription status
- `stripe-webhook.js` - Handles Stripe webhook events

### **Frontend Updates:**
- `BackendStripePaymentForm.jsx` - Uses Netlify Functions for secure payments
- Updated `SimpleSignupPage.jsx` - Integrated with backend
- Updated `stripe.js` config - Points to Netlify Functions

## 🔧 Setup Steps

### **1. Deploy to Netlify**
1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Drag & drop `caltrax-ai-netlify-functions.zip`
3. Wait for deployment to complete

### **2. Set Environment Variables**
In your Netlify dashboard:
1. Go to **Site Settings** > **Environment Variables**
2. Add these variables:

```
STRIPE_SECRET_KEY=sk_live_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_51S843W2LmuiKVnPdDqRZB6VjLk2mflxRjmcGJEGFgeYBiD1qS8pihppJdJNwGVnU7r1BNEl1gmqJ0qtOMq67dNsq00hfphXU8o
```

### **3. Create Stripe Products & Prices**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/products)
2. Create these products:

**Monthly Plan:**
- Name: "CalTrax AI Monthly"
- Price: $5.00 USD
- Billing: Monthly
- Copy the Price ID (starts with `price_`)

**Yearly Plan:**
- Name: "CalTrax AI Yearly" 
- Price: $30.00 USD
- Billing: Yearly
- Copy the Price ID (starts with `price_`)

### **4. Update Price IDs**
Edit `src/config/stripe.js` and replace:
- `price_1234567890` with your monthly price ID
- `price_0987654321` with your yearly price ID

### **5. Set Up Webhooks**
1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://your-site.netlify.app/.netlify/functions/stripe-webhook`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.trial_will_end`
4. Copy the webhook secret and add to Netlify environment variables

### **6. Redeploy**
After updating price IDs:
1. Run `npm run build`
2. Create new zip file
3. Deploy to Netlify

## 🧪 Testing

### **Test Cards:**
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

### **Test Flow:**
1. Visit your deployed site
2. Choose "Free Trial" plan
3. Enter test card details
4. Verify 3-day trial is created
5. Check Stripe dashboard for subscription

## 🔒 Security Features

- ✅ Private keys stored securely in Netlify environment variables
- ✅ All payment processing happens on backend
- ✅ Webhook signature verification
- ✅ CORS headers configured
- ✅ Error handling and logging

## 📊 Monitoring

### **Stripe Dashboard:**
- Monitor subscriptions, payments, and customers
- View trial periods and billing cycles
- Handle failed payments and cancellations

### **Netlify Functions Logs:**
- Go to **Functions** tab in Netlify dashboard
- View real-time logs for debugging
- Monitor webhook events

## 🚨 Important Notes

1. **Live Mode**: This will process real payments
2. **Price IDs**: Must be created in Stripe and updated in code
3. **Webhooks**: Essential for handling subscription events
4. **Environment Variables**: Must be set in Netlify dashboard
5. **Trial Period**: 3 days for all plans, then auto-billing

## 🆘 Troubleshooting

### **Common Issues:**
- **"Function not found"**: Check Netlify Functions deployment
- **"Invalid price ID"**: Update price IDs in config
- **"Webhook failed"**: Check webhook secret and endpoint URL
- **"Payment failed"**: Check Stripe logs and test cards

### **Debug Steps:**
1. Check Netlify Functions logs
2. Verify environment variables
3. Test with Stripe test cards
4. Check webhook endpoint in Stripe dashboard

## 🎯 Next Steps

1. **Deploy** the zip file to Netlify
2. **Set environment variables** in Netlify dashboard
3. **Create products** in Stripe dashboard
4. **Update price IDs** in the code
5. **Set up webhooks** for subscription management
6. **Test** with test cards
7. **Go live** with real payments!

Your CalTrax AI platform now has enterprise-grade Stripe integration! 🚀💳
