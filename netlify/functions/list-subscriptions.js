const stripe = require('stripe')(process.env.STRIPESECRETKEY);

exports.handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: ''
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Get all active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      status: 'active',
      limit: 100
    });

    // Get all trialing subscriptions
    const trialingSubscriptions = await stripe.subscriptions.list({
      status: 'trialing',
      limit: 100
    });

    // Combine and format the data
    const allSubscriptions = [
      ...subscriptions.data,
      ...trialingSubscriptions.data
    ].map(sub => ({
      id: sub.id,
      status: sub.status,
      customerId: sub.customer,
      currentPeriodStart: sub.current_period_start,
      currentPeriodEnd: sub.current_period_end,
      trialEnd: sub.trial_end,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      plan: {
        amount: sub.items.data[0]?.price?.unit_amount || 0,
        currency: sub.items.data[0]?.price?.currency || 'usd',
        interval: sub.items.data[0]?.price?.recurring?.interval || 'month'
      }
    }));

    console.log(`Found ${allSubscriptions.length} active/trialing subscriptions`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        count: allSubscriptions.length,
        subscriptions: allSubscriptions
      })
    };

  } catch (error) {
    console.error('List subscriptions error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Failed to list subscriptions',
        details: error.message 
      })
    };
  }
};

