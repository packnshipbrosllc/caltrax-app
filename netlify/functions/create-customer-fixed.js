// Use environment variable
const stripe = require('stripe')(process.env.STRIPESECRETKEY);

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
