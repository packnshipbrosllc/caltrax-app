// Stripe webhook handler - Updates user subscription status
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Use service key for admin access
);

// Disable body parsing, need raw body for webhook signature verification
export const config = {
  api: {
    bodyParser: false
  }
};

// Helper to get raw body
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      resolve(Buffer.from(data));
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('Received Stripe webhook:', event.type);

  // Handle different event types
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata.userId || session.client_reference_id;
        const planType = session.metadata.planType;

        console.log('Checkout completed for user:', userId);

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(session.subscription);

        // Update user in database
        const { error } = await supabase
          .from('profiles')
          .update({
            has_paid: true,
            plan: planType,
            payment_date: new Date().toISOString(),
            customer_id: session.customer,
            subscription_id: session.subscription,
            subscription_status: subscription.status,
            updated_at: new Date().toISOString()
          })
          .eq('clerk_user_id', userId);

        if (error) {
          console.error('Error updating user payment status:', error);
        } else {
          console.log('Successfully updated payment status for user:', userId);
        }

        // ALSO update Clerk metadata
        try {
          const { Clerk } = await import('@clerk/clerk-sdk-node');
          const clerk = Clerk({ secretKey: process.env.CLERK_SECRET_KEY });
          
          await clerk.users.updateUserMetadata(userId, {
            unsafeMetadata: {
              hasPaid: true,
              subscriptionStatus: 'active',
              customerId: session.customer,
              subscriptionId: session.subscription
            }
          });
          
          console.log('Successfully updated Clerk metadata for user:', userId);
        } catch (clerkError) {
          console.error('Error updating Clerk metadata:', clerkError);
        }

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        console.log('Subscription updated for customer:', customerId);

        // Find user by customer ID
        const { data: user, error: fetchError } = await supabase
          .from('profiles')
          .select('clerk_user_id')
          .eq('customer_id', customerId)
          .single();

        if (fetchError || !user) {
          console.error('User not found for customer:', customerId);
          break;
        }

        // Update subscription status
        const { error } = await supabase
          .from('profiles')
          .update({
            subscription_status: subscription.status,
            has_paid: ['active', 'trialing'].includes(subscription.status),
            updated_at: new Date().toISOString()
          })
          .eq('clerk_user_id', user.clerk_user_id);

        if (error) {
          console.error('Error updating subscription status:', error);
        } else {
          console.log('Successfully updated subscription status');
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        console.log('Subscription canceled for customer:', customerId);

        // Find user by customer ID
        const { data: user, error: fetchError } = await supabase
          .from('profiles')
          .select('clerk_user_id')
          .eq('customer_id', customerId)
          .single();

        if (fetchError || !user) {
          console.error('User not found for customer:', customerId);
          break;
        }

        // Mark subscription as canceled
        const { error } = await supabase
          .from('profiles')
          .update({
            subscription_status: 'canceled',
            has_paid: false,
            updated_at: new Date().toISOString()
          })
          .eq('clerk_user_id', user.clerk_user_id);

        if (error) {
          console.error('Error marking subscription as canceled:', error);
        } else {
          console.log('Successfully marked subscription as canceled');
        }

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook handler error:', error);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
}
