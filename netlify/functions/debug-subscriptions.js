const stripe = require('stripe')(process.env.STRIPESECRETKEY);

exports.handler = async (event, context) => {
  try {
    // Get ALL subscriptions (all statuses)
    const allSubscriptions = await stripe.subscriptions.list({
      limit: 100
    });

    // Get recent customers
    const recentCustomers = await stripe.customers.list({
      limit: 10
    });

    // Get recent charges
    const recentCharges = await stripe.charges.list({
      limit: 10
    });

    console.log(`Found ${allSubscriptions.data.length} total subscriptions`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        debug: {
          totalSubscriptions: allSubscriptions.data.length,
          subscriptions: allSubscriptions.data.map(sub => ({
            id: sub.id,
            status: sub.status,
            customerId: sub.customer,
            created: sub.created,
            currentPeriodStart: sub.current_period_start,
            currentPeriodEnd: sub.current_period_end,
            trialEnd: sub.trial_end,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            plan: sub.items.data[0]?.price ? {
              amount: sub.items.data[0].price.unit_amount,
              currency: sub.items.data[0].price.currency,
              interval: sub.items.data[0].price.recurring?.interval
            } : null
          })),
          recentCustomers: recentCustomers.data.map(customer => ({
            id: customer.id,
            email: customer.email,
            created: customer.created,
            subscriptions: customer.subscriptions?.total_count || 0
          })),
          recentCharges: recentCharges.data.map(charge => ({
            id: charge.id,
            amount: charge.amount,
            currency: charge.currency,
            status: charge.status,
            customer: charge.customer,
            created: charge.created
          }))
        }
      })
    };

  } catch (error) {
    console.error('Debug subscriptions error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Failed to debug subscriptions',
        details: error.message 
      })
    };
  }
};

