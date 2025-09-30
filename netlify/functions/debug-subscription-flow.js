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
    console.log('=== DEBUGGING SUBSCRIPTION FLOW ===');
    console.log('Environment check:');
    console.log('- STRIPESECRETKEY exists:', !!process.env.STRIPESECRETKEY);
    console.log('- STRIPESECRETKEY starts with sk_:', process.env.STRIPESECRETKEY?.startsWith('sk_'));
    
    const { customerId, paymentMethodId, planId } = JSON.parse(event.body);
    console.log('Input data:', { customerId, paymentMethodId, planId });

    // Step 1: Check customer
    console.log('\n=== STEP 1: CHECKING CUSTOMER ===');
    const customer = await stripe.customers.retrieve(customerId);
    console.log('Customer found:', {
      id: customer.id,
      email: customer.email,
      created: new Date(customer.created * 1000).toISOString()
    });

    // Step 2: Check payment method
    console.log('\n=== STEP 2: CHECKING PAYMENT METHOD ===');
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    console.log('Payment method found:', {
      id: paymentMethod.id,
      type: paymentMethod.type,
      card: paymentMethod.card ? {
        brand: paymentMethod.card.brand,
        last4: paymentMethod.card.last4
      } : null
    });

    // Step 3: Check price
    console.log('\n=== STEP 3: CHECKING PRICE ===');
    const priceIdMap = {
      'trial': 'price_1S84cT2LmuiKVnPd3NXruhvk',
      'monthly': 'price_1S84cT2LmuiKVnPd3NXruhvk',
      'yearly': 'price_1S84dS2LmuiKVnPdj6UCRzsN'
    };
    const actualPriceId = priceIdMap[planId] || planId;
    console.log('Using price ID:', actualPriceId);
    
    const price = await stripe.prices.retrieve(actualPriceId);
    console.log('Price found:', {
      id: price.id,
      unit_amount: price.unit_amount,
      currency: price.currency,
      interval: price.recurring?.interval,
      active: price.active
    });

    // Step 4: Attach payment method
    console.log('\n=== STEP 4: ATTACHING PAYMENT METHOD ===');
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
    console.log('✅ Payment method attached successfully');

    // Step 5: Set as default
    console.log('\n=== STEP 5: SETTING AS DEFAULT PAYMENT METHOD ===');
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
    console.log('✅ Payment method set as default');

    // Step 6: Create subscription
    console.log('\n=== STEP 6: CREATING SUBSCRIPTION ===');
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
    
    console.log('Subscription data:', subscriptionData);
    
    const subscription = await stripe.subscriptions.create(subscriptionData);
    console.log('✅ Subscription created successfully:', {
      id: subscription.id,
      status: subscription.status,
      trial_end: subscription.trial_end,
      current_period_end: subscription.current_period_end,
      customer: subscription.customer
    });

    // Step 7: Check latest invoice
    console.log('\n=== STEP 7: CHECKING LATEST INVOICE ===');
    if (subscription.latest_invoice) {
      console.log('Latest invoice:', {
        id: subscription.latest_invoice.id,
        status: subscription.latest_invoice.status,
        amount_paid: subscription.latest_invoice.amount_paid,
        amount_due: subscription.latest_invoice.amount_due,
        payment_intent: subscription.latest_invoice.payment_intent ? {
          id: subscription.latest_invoice.payment_intent.id,
          status: subscription.latest_invoice.payment_intent.status,
          client_secret: subscription.latest_invoice.payment_intent.client_secret
        } : null
      });
    } else {
      console.log('❌ No latest invoice found');
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Subscription flow debug completed successfully',
        subscription: {
          id: subscription.id,
          status: subscription.status,
          trialEnd: subscription.trial_end,
          currentPeriodEnd: subscription.current_period_end,
          customerId: subscription.customer
        },
        debug: {
          customerEmail: customer.email,
          priceAmount: price.unit_amount,
          priceCurrency: price.currency,
          hasLatestInvoice: !!subscription.latest_invoice,
          hasPaymentIntent: !!(subscription.latest_invoice && subscription.latest_invoice.payment_intent)
        }
      })
    };

  } catch (error) {
    console.error('❌ SUBSCRIPTION FLOW DEBUG ERROR:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Subscription flow debug failed',
        details: error.message,
        stack: error.stack
      })
    };
  }
};

