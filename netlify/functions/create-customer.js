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
    const { email, name } = JSON.parse(event.body);

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email is required' })
      };
    }

    // Rate limiting: 5 customer creations per minute per IP
    const clientIP = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';
    if (!rateLimiter(`create-customer-${clientIP}`, 5, 60000)) {
      return {
        statusCode: 429,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Retry-After': '60'
        },
        body: JSON.stringify({ 
          error: 'Too many requests. Please try again in 1 minute.',
          retryAfter: 60
        })
      };
    }

    // Create customer in Stripe
    const customer = await stripe.customers.create({
      email: email,
      name: name || email.split('@')[0],
      metadata: {
        source: 'caltrax-ai'
      }
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        customerId: customer.id,
        email: customer.email
      })
    };
  } catch (error) {
    console.error('Error creating customer:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Failed to create customer',
        details: error.message 
      })
    };
  }
};
