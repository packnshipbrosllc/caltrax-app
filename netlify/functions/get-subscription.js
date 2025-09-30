const stripe = require('stripe')(process.env.STRIPESECRETKEY);

exports.handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: ''
    };
  }

  // Allow both GET and POST requests
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    let customerId;
    
    if (event.httpMethod === 'GET') {
      customerId = event.queryStringParameters?.customerId;
    } else {
      const body = JSON.parse(event.body);
      customerId = body.customerId;
    }

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
        subscription: {
          id: subscription.id,
          status: subscription.status,
          current_period_end: subscription.current_period_end,
          trial_end: subscription.trial_end,
          cancel_at_period_end: subscription.cancel_at_period_end,
          plan: {
            id: subscription.items.data[0]?.price?.id,
            nickname: subscription.items.data[0]?.price?.nickname,
            amount: subscription.items.data[0]?.price?.unit_amount,
            currency: subscription.items.data[0]?.price?.currency,
            interval: subscription.items.data[0]?.price?.recurring?.interval
          }
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
