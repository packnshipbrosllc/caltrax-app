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
    const sig = event.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPEWEBHOOKSECRET;

    if (!webhookSecret) {
      console.error('Missing webhook secret');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Webhook secret not configured' })
      };
    }

    let stripeEvent;

    try {
      stripeEvent = stripe.webhooks.constructEvent(event.body, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid signature' })
      };
    }

    // Handle the event
    switch (stripeEvent.type) {
      case 'customer.subscription.created':
        console.log('Subscription created:', stripeEvent.data.object.id);
        break;
      
      case 'customer.subscription.updated':
        console.log('Subscription updated:', stripeEvent.data.object.id);
        break;
      
      case 'customer.subscription.deleted':
        console.log('Subscription cancelled:', stripeEvent.data.object.id);
        break;
      
      case 'invoice.payment_succeeded':
        console.log('Payment succeeded:', stripeEvent.data.object.id);
        break;
      
      case 'invoice.payment_failed':
        console.log('Payment failed:', stripeEvent.data.object.id);
        break;
      
      case 'customer.subscription.trial_will_end':
        console.log('Trial will end:', stripeEvent.data.object.id);
        // Send email notification to customer
        break;
      
      case 'charge.dispute.created':
        console.log('Dispute created - NO REFUNDS POLICY:', stripeEvent.data.object.id);
        // Log dispute but do not process refunds
        break;
      
      case 'payment_intent.payment_failed':
        console.log('Payment failed:', stripeEvent.data.object.id);
        break;
      
      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true })
    };
  } catch (error) {
    console.error('Webhook error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Webhook processing failed' })
    };
  }
};
