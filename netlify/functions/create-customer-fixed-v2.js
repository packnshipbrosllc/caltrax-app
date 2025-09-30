// Alternative approach using different environment variable access
exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Try different ways to access the Stripe key
    const stripeKey = process.env.STRIPESECRETKEY || 
                     context.clientContext?.env?.STRIPESECRETKEY ||
                     process.env.NETLIFY_STRIPESECRETKEY;

    if (!stripeKey) {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({
          success: false,
          error: 'Stripe key not found in environment variables',
          availableEnvKeys: Object.keys(process.env).filter(key => 
            key.includes('STRIPE') || key.includes('REACT') || key.includes('NETLIFY')
          )
        })
      };
    }

    const stripe = require('stripe')(stripeKey);
    const { email, name } = JSON.parse(event.body);

    console.log('Creating customer with email:', email);

    // Create customer in Stripe
    const customer = await stripe.customers.create({
      email: email,
      name: name,
      metadata: {
        source: 'caltrax-ai-signup'
      }
    });

    console.log('Customer created:', customer.id);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify({
        success: true,
        customerId: customer.id,
        message: 'Customer created successfully'
      })
    };

  } catch (error) {
    console.error('Error creating customer:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};


