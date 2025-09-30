const stripe = require('stripe')(process.env.STRIPESECRETKEY);

exports.handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    const { customerId, paymentMethodId, planId } = JSON.parse(event.body);

    console.log('Test subscription creation with:', { customerId, paymentMethodId, planId });

    // First, let's check if the customer exists
    const customer = await stripe.customers.retrieve(customerId);
    console.log('Customer found:', customer.id, customer.email);

    // Check if payment method exists
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    console.log('Payment method found:', paymentMethod.id, paymentMethod.type);

    // Map plan IDs to actual Stripe price IDs
    const priceIdMap = {
      'trial': 'price_1S84cT2LmuiKVnPd3NXruhvk',
      'monthly': 'price_1S84cT2LmuiKVnPd3NXruhvk',
      'yearly': 'price_1S84dS2LmuiKVnPdj6UCRzsN'
    };
    
    const actualPriceId = priceIdMap[planId] || planId;
    console.log('Using price ID:', actualPriceId);

    // Check if price exists
    const price = await stripe.prices.retrieve(actualPriceId);
    console.log('Price found:', price.id, price.unit_amount, price.currency);

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
    console.log('Payment method attached');

    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
    console.log('Payment method set as default');

    // Create subscription with detailed logging
    const subscriptionData = {
      customer: customerId,
      items: [{ price: actualPriceId }],
      trial_period_days: 3,
      payment_behavior: 'allow_incomplete',
      payment_settings: { 
        save_default_payment_method: 'on_subscription'
      },
      expand: ['latest_invoice.payment_intent'],
    };

    console.log('Creating subscription with data:', subscriptionData);

    const subscription = await stripe.subscriptions.create(subscriptionData);
    console.log('Subscription created:', subscription.id, subscription.status);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          trialEnd: subscription.trial_end,
          currentPeriodEnd: subscription.current_period_end,
          customerId: subscription.customer,
          latestInvoice: subscription.latest_invoice ? {
            id: subscription.latest_invoice.id,
            status: subscription.latest_invoice.status,
            paymentIntent: subscription.latest_invoice.payment_intent ? {
              id: subscription.latest_invoice.payment_intent.id,
              status: subscription.latest_invoice.payment_intent.status,
              clientSecret: subscription.latest_invoice.payment_intent.client_secret
            } : null
          } : null
        },
        debug: {
          customerEmail: customer.email,
          priceAmount: price.unit_amount,
          priceCurrency: price.currency
        }
      })
    };

  } catch (error) {
    console.error('Test subscription creation error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Test subscription creation failed',
        details: error.message,
        stack: error.stack
      })
    };
  }
};

