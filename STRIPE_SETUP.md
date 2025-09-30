# Stripe Integration Setup Guide for CalTrax AI

## 🚀 Quick Setup (5 minutes)

### 1. Get Your Stripe Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)

### 2. Add Environment Variables
Create a `.env` file in your project root:

```bash
# Stripe Configuration
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
REACT_APP_STRIPE_SECRET_KEY=sk_test_your_secret_key_here
```

### 3. Create Products in Stripe Dashboard
1. Go to [Products](https://dashboard.stripe.com/products)
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

### 4. Update Price IDs
In `src/config/stripe.js`, replace the placeholder price IDs:

```javascript
plans: {
  monthly: {
    priceId: 'price_your_monthly_price_id_here',
    amount: 500, // $5.00 in cents
    currency: 'usd',
    interval: 'month',
  },
  yearly: {
    priceId: 'price_your_yearly_price_id_here', 
    amount: 3000, // $30.00 in cents
    currency: 'usd',
    interval: 'year',
  },
},
```

## 🔧 Backend Setup (Required for Production)

You'll need a backend to handle Stripe webhooks and subscription management. Here's what you need:

### Required Endpoints:
1. **Create Subscription** - `/api/create-subscription`
2. **Cancel Subscription** - `/api/cancel-subscription` 
3. **Get Subscription** - `/api/get-subscription`
4. **Webhook Handler** - `/api/webhooks/stripe`

### Webhook Events to Handle:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

## 🧪 Testing

### Test Cards:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

### Test the Flow:
1. Use test cards above
2. Check Stripe Dashboard for payments
3. Verify webhook events are received

## 🚀 Deploy to Production

### 1. Switch to Live Keys
Update your `.env`:
```bash
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key_here
REACT_APP_STRIPE_SECRET_KEY=sk_live_your_live_secret_key_here
```

### 2. Create Live Products
- Create the same products in live mode
- Update price IDs in your config

### 3. Set Up Webhooks
- Add webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
- Select the events listed above

## 📱 Current Implementation

The app currently includes:
- ✅ Stripe Elements for secure card input
- ✅ Payment method creation
- ✅ Trial period handling
- ✅ Plan selection UI
- ✅ Error handling

## 🔄 Next Steps

1. **Set up your Stripe account** (5 minutes)
2. **Add your keys** to `.env` file
3. **Create products** in Stripe Dashboard
4. **Update price IDs** in the config
5. **Test with test cards**
6. **Deploy to production**

## 💡 Pro Tips

- Start with test mode to avoid real charges
- Use Stripe CLI for local webhook testing
- Monitor your Stripe Dashboard for payments
- Set up email notifications for failed payments
- Consider using Stripe Customer Portal for subscription management

## 🆘 Need Help?

- [Stripe Documentation](https://stripe.com/docs)
- [React Stripe.js](https://stripe.com/docs/stripe-js/react)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
