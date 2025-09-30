const stripe = require('stripe')(process.env.STRIPESECRETKEY);
const { rateLimiter } = require('./rate-limiter');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { customerId, paymentMethodId, planId, email } = JSON.parse(event.body);

    if (!customerId || !paymentMethodId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Customer ID and Payment Method ID are required' })
      };
    }

    // Rate limiting: 3 subscription creations per minute per IP
    const clientIP = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';
    if (!rateLimiter(`create-subscription-${clientIP}`, 3, 60000)) {
      return {
        statusCode: 429,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Retry-After': '60'
        },
        body: JSON.stringify({ 
          error: 'Too many subscription attempts. Please try again in 1 minute.',
          retryAfter: 60
        })
      };
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Map plan IDs to actual Stripe price IDs
    const priceIdMap = {
      'trial': 'price_1S84cT2LmuiKVnPd3NXruhvk', // Monthly price for trial
      'monthly': 'price_1S84cT2LmuiKVnPd3NXruhvk',
      'yearly': 'price_1S84dS2LmuiKVnPdj6UCRzsN'
    };
    
    const actualPriceId = priceIdMap[planId] || planId;
    
    // All plans get 3-day trial
    const trialDays = 3;
    
    console.log('Creating subscription with:', { customerId, actualPriceId, trialDays });
    
    // Create subscription with trial period
    const subscriptionData = {
      customer: customerId,
      items: [{ price: actualPriceId }],
      trial_period_days: trialDays,
      payment_behavior: 'allow_incomplete',
      payment_settings: { 
        save_default_payment_method: 'on_subscription'
      },
      expand: ['latest_invoice.payment_intent'],
    };
    
    console.log('Subscription data being sent to Stripe:', subscriptionData);
    
    const subscription = await stripe.subscriptions.create(subscriptionData);
    console.log('✅ Subscription created successfully:', {
      id: subscription.id,
      status: subscription.status,
      customer: subscription.customer,
      trial_end: subscription.trial_end,
      current_period_end: subscription.current_period_end
    });

    // Handle different subscription states
    let clientSecret = null;
    if (subscription.latest_invoice && subscription.latest_invoice.payment_intent) {
      clientSecret = subscription.latest_invoice.payment_intent.client_secret;
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        subscriptionId: subscription.id,
        clientSecret: clientSecret,
        status: subscription.status,
        trialEnd: subscription.trial_end,
        currentPeriodEnd: subscription.current_period_end,
        debug: {
          hasLatestInvoice: !!subscription.latest_invoice,
          hasPaymentIntent: !!(subscription.latest_invoice && subscription.latest_invoice.payment_intent),
          subscriptionStatus: subscription.status
        }
      })
    };
  } catch (error) {
    console.error('Error creating subscription:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Failed to create subscription',
        details: error.message 
      })
    };
  }
};
