const stripe = require('stripe')(process.env.STRIPESECRETKEY);

exports.handler = async (event, context) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { customerId } = event.queryStringParameters;

    if (!customerId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Customer ID is required' })
      };
    }

    // Get customer's subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 1
    });

    if (subscriptions.data.length === 0) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          hasSubscription: false,
          subscription: null
        })
      };
    }

    const subscription = subscriptions.data[0];

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        hasSubscription: true,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          currentPeriodEnd: subscription.current_period_end,
          trialEnd: subscription.trial_end,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          plan: subscription.items.data[0]?.price?.id
        }
      })
    };
  } catch (error) {
    console.error('Error getting subscription:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Failed to get subscription',
        details: error.message 
      })
    };
  }
};
