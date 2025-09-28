import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function GET(request: NextRequest) {
  try {
    // Get all customers from Stripe
    const customers = await stripe.customers.list({ limit: 100 });
    
    // Get all subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({ limit: 100 });
    
    // Get all charges (payments) from Stripe
    const charges = await stripe.charges.list({ limit: 100 });
    
    // Calculate real revenue data
    const totalRevenue = charges.data
      .filter(charge => charge.status === 'succeeded')
      .reduce((total, charge) => total + charge.amount, 0);
    
    const monthlyRevenue = charges.data
      .filter(charge => {
        const chargeDate = new Date(charge.created * 1000);
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return charge.status === 'succeeded' && chargeDate > thirtyDaysAgo;
      })
      .reduce((total, charge) => total + charge.amount, 0);

    // Get subscription status breakdown
    const subscriptionStatuses = subscriptions.data.reduce((acc, sub) => {
      acc[sub.status] = (acc[sub.status] || 0) + 1;
      return acc;
    }, {});

    // Get plan breakdown from subscriptions
    const planBreakdown = subscriptions.data.reduce((acc, sub) => {
      const planId = sub.items.data[0]?.price?.id || 'unknown';
      acc[planId] = (acc[planId] || 0) + 1;
      return acc;
    }, {});

    // Calculate churn rate
    const canceledSubscriptions = subscriptions.data.filter(sub => sub.status === 'canceled');
    const churnRate = subscriptions.data.length > 0 ? 
      (canceledSubscriptions.length / subscriptions.data.length) * 100 : 0;

    // Get customer lifetime value
    const customerRevenue = {};
    charges.data.forEach(charge => {
      if (charge.status === 'succeeded' && charge.customer) {
        customerRevenue[charge.customer] = (customerRevenue[charge.customer] || 0) + charge.amount;
      }
    });

    const avgLifetimeValue = Object.keys(customerRevenue).length > 0 ?
      Object.values(customerRevenue).reduce((a, b) => a + b, 0) / Object.keys(customerRevenue).length : 0;

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoTimestamp = Math.floor(sevenDaysAgo.getTime() / 1000);

    const recentCharges = charges.data.filter(charge => charge.created > sevenDaysAgoTimestamp);
    const recentSubscriptions = subscriptions.data.filter(sub => sub.created > sevenDaysAgoTimestamp);

    const stripeData = {
      totalCustomers: customers.data.length,
      totalSubscriptions: subscriptions.data.length,
      totalRevenue,
      monthlyRevenue,
      avgLifetimeValue: Math.round(avgLifetimeValue),
      churnRate: Math.round(churnRate * 100) / 100,
      subscriptionStatuses,
      planBreakdown,
      recentCharges: recentCharges.length,
      recentSubscriptions: recentSubscriptions.length,
      activeSubscriptions: subscriptions.data.filter(sub => 
        ['active', 'trialing'].includes(sub.status)
      ).length,
      trialSubscriptions: subscriptions.data.filter(sub => 
        sub.status === 'trialing'
      ).length,
      pastDueSubscriptions: subscriptions.data.filter(sub => 
        sub.status === 'past_due'
      ).length,
      canceledSubscriptions: canceledSubscriptions.length
    };

    return NextResponse.json(stripeData);
  } catch (error) {
    console.error('Error fetching Stripe data:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch Stripe data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
