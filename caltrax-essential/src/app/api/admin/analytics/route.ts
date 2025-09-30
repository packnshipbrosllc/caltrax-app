import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Get all customers
    const { data: customers, error: customersError } = await supabase
      .from('profiles')
      .select('*');

    if (customersError) {
      console.error('Error fetching customers for analytics:', customersError);
      return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 });
    }

    const customersList = customers || [];

    // Calculate analytics
    const totalCustomers = customersList.length;
    const activeSubscriptions = customersList.filter(c => 
      c.has_paid && c.subscription_status && ['active', 'trialing'].includes(c.subscription_status)
    ).length;
    
    const trialUsers = customersList.filter(c => 
      c.subscription_status === 'trialing' || (!c.has_paid && c.trial_used)
    ).length;

    // Calculate monthly revenue (simplified - you'd want to get this from Stripe)
    const monthlyRevenue = customersList
      .filter(c => c.has_paid && c.subscription_status === 'active')
      .reduce((total, customer) => {
        // This is a simplified calculation - you'd want to get actual amounts from Stripe
        const planAmount = customer.plan === 'monthly' ? 500 : customer.plan === 'yearly' ? 3000 : 0;
        return total + planAmount;
      }, 0);

    // Calculate churn rate (customers who canceled in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const churnedCustomers = customersList.filter(c => 
      c.subscription_status === 'canceled' && 
      c.updated_at && 
      new Date(c.updated_at) > thirtyDaysAgo
    ).length;

    const churnRate = totalCustomers > 0 ? (churnedCustomers / totalCustomers) * 100 : 0;

    // Calculate customer lifetime value (simplified)
    const avgLifetimeValue = totalCustomers > 0 ? monthlyRevenue / totalCustomers : 0;

    // Get subscription status breakdown
    const statusBreakdown = customersList.reduce((acc, customer) => {
      const status = customer.subscription_status || 'none';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Get plan breakdown
    const planBreakdown = customersList.reduce((acc, customer) => {
      const plan = customer.plan || 'none';
      acc[plan] = (acc[plan] || 0) + 1;
      return acc;
    }, {});

    // Get recent signups (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentSignups = customersList.filter(c => 
      c.created_at && new Date(c.created_at) > sevenDaysAgo
    ).length;

    // Get payment success rate
    const customersWithPayments = customersList.filter(c => c.payment_date);
    const paymentSuccessRate = totalCustomers > 0 ? (customersWithPayments.length / totalCustomers) * 100 : 0;

    const analytics = {
      totalCustomers,
      activeSubscriptions,
      trialUsers,
      monthlyRevenue,
      churnRate: Math.round(churnRate * 100) / 100,
      avgLifetimeValue: Math.round(avgLifetimeValue),
      recentSignups,
      paymentSuccessRate: Math.round(paymentSuccessRate * 100) / 100,
      statusBreakdown,
      planBreakdown,
      churnedCustomers,
      customersWithPayments: customersWithPayments.length
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error in analytics API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
