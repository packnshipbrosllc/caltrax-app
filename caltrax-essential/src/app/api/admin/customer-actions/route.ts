import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/database';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function POST(request: NextRequest) {
  try {
    const { action, clerkUserId, customerId, subscriptionId } = await request.json();

    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    switch (action) {
      case 'cancel_subscription':
        if (!subscriptionId) {
          return NextResponse.json({ error: 'Subscription ID required' }, { status: 400 });
        }

        // Cancel subscription in Stripe
        const canceledSubscription = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true
        });

        // Update database
        await supabase
          .from('profiles')
          .update({
            subscription_status: 'cancel_at_period_end',
            updated_at: new Date().toISOString()
          })
          .eq('clerk_user_id', clerkUserId);

        return NextResponse.json({ 
          success: true, 
          message: 'Subscription will be canceled at period end',
          subscription: canceledSubscription
        });

      case 'reactivate_subscription':
        if (!subscriptionId) {
          return NextResponse.json({ error: 'Subscription ID required' }, { status: 400 });
        }

        // Reactivate subscription in Stripe
        const reactivatedSubscription = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: false
        });

        // Update database
        await supabase
          .from('profiles')
          .update({
            subscription_status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('clerk_user_id', clerkUserId);

        return NextResponse.json({ 
          success: true, 
          message: 'Subscription reactivated',
          subscription: reactivatedSubscription
        });

      case 'get_customer_details':
        if (!customerId) {
          return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
        }

        // Get customer details from Stripe
        const customer = await stripe.customers.retrieve(customerId);
        const customerSubscriptions = await stripe.subscriptions.list({
          customer: customerId,
          limit: 10
        });
        const customerCharges = await stripe.charges.list({
          customer: customerId,
          limit: 10
        });

        return NextResponse.json({
          customer,
          subscriptions: customerSubscriptions.data,
          charges: customerCharges.data
        });

      case 'send_payment_reminder':
        if (!customerId) {
          return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
        }

        // This would integrate with your email service
        // For now, just return success
        return NextResponse.json({ 
          success: true, 
          message: 'Payment reminder sent (email integration needed)'
        });

      case 'refund_payment':
        const { chargeId, amount, reason } = await request.json();
        
        if (!chargeId) {
          return NextResponse.json({ error: 'Charge ID required' }, { status: 400 });
        }

        const refund = await stripe.refunds.create({
          charge: chargeId,
          amount: amount, // Amount in cents, optional
          reason: reason || 'requested_by_customer'
        });

        return NextResponse.json({ 
          success: true, 
          message: 'Refund processed',
          refund
        });

      case 'update_customer_metadata':
        const { metadata } = await request.json();
        
        if (!customerId) {
          return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
        }

        const updatedCustomer = await stripe.customers.update(customerId, {
          metadata: metadata
        });

        return NextResponse.json({ 
          success: true, 
          message: 'Customer metadata updated',
          customer: updatedCustomer
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in customer actions:', error);
    return NextResponse.json({ 
      error: 'Action failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
