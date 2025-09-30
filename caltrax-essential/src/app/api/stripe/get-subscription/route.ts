import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function POST(request: NextRequest) {
  try {
    const { customerId } = await request.json();

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    // Get customer's subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 1
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json({
        hasSubscription: false,
        subscription: null
      });
    }

    const subscription = subscriptions.data[0];

    return NextResponse.json({
      hasSubscription: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end,
        trialEnd: subscription.trial_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        plan: subscription.items.data[0]?.price?.id
      }
    });
  } catch (error) {
    console.error('Error getting subscription:', error);
    return NextResponse.json({ 
      error: 'Failed to get subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
