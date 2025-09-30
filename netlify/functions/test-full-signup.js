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
    console.log('=== TESTING FULL SIGNUP PROCESS ===');
    
    const { email, password, planId } = JSON.parse(event.body);
    console.log('Input:', { email, planId });

    // Step 1: Create customer
    console.log('\n=== STEP 1: CREATING CUSTOMER ===');
    const customer = await stripe.customers.create({
      email: email,
      name: email.split('@')[0],
      metadata: {
        source: 'caltrax-app',
        plan: planId
      }
    });
    console.log('✅ Customer created:', customer.id, customer.email);

    // Step 2: Create payment method (using test card)
    console.log('\n=== STEP 2: CREATING PAYMENT METHOD ===');
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: '4242424242424242',
        exp_month: 12,
        exp_year: 2025,
        cvc: '123',
      },
    });
    console.log('✅ Payment method created:', paymentMethod.id);

    // Step 3: Attach payment method to customer
    console.log('\n=== STEP 3: ATTACHING PAYMENT METHOD ===');
    await stripe.paymentMethods.attach(paymentMethod.id, {
      customer: customer.id,
    });
    console.log('✅ Payment method attached');

    // Step 4: Set as default payment method
    console.log('\n=== STEP 4: SETTING DEFAULT PAYMENT METHOD ===');
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethod.id,
      },
    });
    console.log('✅ Payment method set as default');

    // Step 5: Create subscription
    console.log('\n=== STEP 5: CREATING SUBSCRIPTION ===');
    const priceIdMap = {
      'trial': 'price_1S84cT2LmuiKVnPd3NXruhvk',
      'monthly': 'price_1S84cT2LmuiKVnPd3NXruhvk',
      'yearly': 'price_1S84dS2LmuiKVnPdj6UCRzsN'
    };
    const actualPriceId = priceIdMap[planId] || planId;
    
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: actualPriceId }],
      trial_period_days: 3,
      payment_behavior: 'allow_incomplete',
      payment_settings: { 
        save_default_payment_method: 'on_subscription'
      },
      expand: ['latest_invoice.payment_intent'],
    });
    console.log('✅ Subscription created:', subscription.id, subscription.status);

    // Step 6: Check subscription in Stripe
    console.log('\n=== STEP 6: VERIFYING SUBSCRIPTION ===');
    const verifySubscription = await stripe.subscriptions.retrieve(subscription.id);
    console.log('✅ Subscription verified:', {
      id: verifySubscription.id,
      status: verifySubscription.status,
      customer: verifySubscription.customer,
      trial_end: verifySubscription.trial_end,
      current_period_end: verifySubscription.current_period_end
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Full signup process completed successfully',
        data: {
          customer: {
            id: customer.id,
            email: customer.email
          },
          subscription: {
            id: subscription.id,
            status: subscription.status,
            trial_end: subscription.trial_end,
            current_period_end: subscription.current_period_end
          }
        }
      })
    };

  } catch (error) {
    console.error('❌ FULL SIGNUP TEST ERROR:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Full signup test failed',
        details: error.message,
        stack: error.stack
      })
    };
  }
};

