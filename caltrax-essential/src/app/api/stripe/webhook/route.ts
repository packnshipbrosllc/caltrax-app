import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    // Dynamically import database functions only if Supabase is configured
    let databaseFunctions = null;
    const hasSupabase = (process.env.REACT_APP_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) && 
                        (process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    if (hasSupabase) {
      try {
        databaseFunctions = await import('@/lib/database');
      } catch (error) {
        console.error('Failed to import database functions:', error);
      }
    }

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription event:', event.type, subscription.id);
        
        if (databaseFunctions) {
          // Find user by customer ID
          const { data: user } = await databaseFunctions.supabase
            .from('profiles')
            .select('clerk_user_id')
            .eq('customer_id', subscription.customer)
            .single();

          if (user) {
            const isActive = ['active', 'trialing'].includes(subscription.status);
            const plan = subscription.items.data[0]?.price?.id || 'unknown';
            
            await databaseFunctions.updateUserPayment(user.clerk_user_id, {
              has_paid: isActive,
              plan: plan,
              payment_date: new Date().toISOString(),
              customer_id: subscription.customer as string,
              subscription_id: subscription.id,
              subscription_status: subscription.status
            });
            
            console.log('✅ Updated user payment status:', {
              clerkUserId: user.clerk_user_id,
              hasPaid: isActive,
              plan: plan,
              status: subscription.status
            });
          }
        }
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        console.log('Subscription deleted:', deletedSubscription.id);
        
        if (databaseFunctions) {
          // Find user by customer ID
          const { data: user } = await databaseFunctions.supabase
            .from('profiles')
            .select('clerk_user_id')
            .eq('customer_id', deletedSubscription.customer)
            .single();

          if (user) {
            await databaseFunctions.updateUserPayment(user.clerk_user_id, {
              has_paid: false,
              plan: null,
              payment_date: null,
              customer_id: null,
              subscription_id: null,
              subscription_status: 'canceled'
            });
            
            console.log('✅ Updated user payment status to canceled:', user.clerk_user_id);
          }
        }
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Payment succeeded for invoice:', invoice.id);
        
        if (databaseFunctions && invoice.subscription) {
          // Find user by subscription ID
          const { data: user } = await databaseFunctions.supabase
            .from('profiles')
            .select('clerk_user_id')
            .eq('subscription_id', invoice.subscription)
            .single();

          if (user) {
            await databaseFunctions.updateUserPayment(user.clerk_user_id, {
              has_paid: true,
              plan: 'active',
              payment_date: new Date().toISOString(),
              subscription_status: 'active'
            });
            
            console.log('✅ Updated user payment status to active:', user.clerk_user_id);
          }
        }
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice;
        console.log('Payment failed for invoice:', failedInvoice.id);
        
        if (databaseFunctions && failedInvoice.subscription) {
          // Find user by subscription ID
          const { data: user } = await databaseFunctions.supabase
            .from('profiles')
            .select('clerk_user_id')
            .eq('subscription_id', failedInvoice.subscription)
            .single();

          if (user) {
            await databaseFunctions.updateUserPayment(user.clerk_user_id, {
              has_paid: false,
              plan: 'past_due',
              subscription_status: 'past_due'
            });
            
            console.log('✅ Updated user payment status to past_due:', user.clerk_user_id);
          }
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
