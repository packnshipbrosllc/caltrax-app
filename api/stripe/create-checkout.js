// Stripe checkout session creation
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { priceId, userId, email, planType } = req.body;

  // Validate inputs
  if (!priceId || !userId || !email) {
    return res.status(400).json({ 
      error: 'Missing required fields: priceId, userId, email' 
    });
  }

  try {
    console.log('Creating checkout session for user:', userId);

    // Get the domain - prioritize NEXT_PUBLIC_URL, fall back to origin
    const domain = process.env.NEXT_PUBLIC_URL || req.headers.origin;
    console.log('Using domain:', domain);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: `${domain}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${domain}/payment`,
      customer_email: email,
      client_reference_id: userId,
      metadata: {
        userId: userId,
        planType: planType || 'unknown'
      },
      subscription_data: {
        metadata: {
          userId: userId,
          planType: planType || 'unknown'
        }
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required'
    });

    console.log('Checkout session created:', session.id);

    return res.status(200).json({ 
      sessionId: session.id,
      url: session.url 
    });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    return res.status(500).json({ 
      error: 'Failed to create checkout session',
      message: error.message 
    });
  }
}
