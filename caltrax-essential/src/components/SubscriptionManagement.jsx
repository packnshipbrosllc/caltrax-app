import React, { useState, useEffect } from 'react';
import { X, CreditCard, Calendar, AlertTriangle } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';

const SubscriptionManagement = ({ onClose, user }) => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/.netlify/functions/get-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customerId: user.customerId }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscription status');
      }

      const data = await response.json();
      setSubscription(data.subscription);
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError('Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    try {
      setCancelling(true);
      const response = await fetch('/.netlify/functions/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          subscriptionId: subscription.id,
          customerId: user.customerId 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel subscription');
      }

      const data = await response.json();
      setSubscription(data.subscription);
      alert('Subscription cancelled successfully. You will retain access until the end of your current billing period.');
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      setError(err.message || 'Failed to cancel subscription');
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'trialing': return 'text-blue-400';
      case 'canceled': return 'text-red-400';
      case 'past_due': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Active';
      case 'trialing': return 'Free Trial';
      case 'canceled': return 'Cancelled';
      case 'past_due': return 'Past Due';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <Card className="bg-zinc-900 border-zinc-800 w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-zinc-300">Loading subscription details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="bg-zinc-900 border-zinc-800 w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <CreditCard className="w-5 h-5" /> Subscription Management
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-500/50 rounded-md">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {subscription ? (
            <div className="space-y-4">
              <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-zinc-300">Status</span>
                  <span className={`font-semibold ${getStatusColor(subscription.status)}`}>
                    {getStatusText(subscription.status)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between mb-2">
                  <span className="text-zinc-300">Plan</span>
                  <span className="text-white">
                    {subscription.items?.data?.[0]?.price?.unit_amount 
                      ? `$${(subscription.items.data[0].price.unit_amount / 100).toFixed(2)}`
                      : '$5.00'
                    } / {subscription.items?.data?.[0]?.price?.recurring?.interval || 'month'}
                  </span>
                </div>

                {subscription.trial_end && (
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-zinc-300">Trial Ends</span>
                    <span className="text-white">{formatDate(subscription.trial_end)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-zinc-300">Next Billing</span>
                  <span className="text-white">
                    {subscription.current_period_end ? formatDate(subscription.current_period_end) : 'N/A'}
                  </span>
                </div>
              </div>

              {subscription.status === 'active' && (
                <div className="space-y-3">
                  <div className="p-3 bg-yellow-900/20 border border-yellow-500/50 rounded-md">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-yellow-300">
                        <p className="font-semibold mb-1">No Refunds Policy</p>
                        <p>All subscriptions are non-refundable. You will retain access until the end of your current billing period.</p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleCancelSubscription}
                    disabled={cancelling}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
                  </Button>
                </div>
              )}

              {subscription.status === 'canceled' && (
                <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-md">
                  <p className="text-red-400 text-sm">
                    Your subscription has been cancelled. You will retain access until {subscription.current_period_end ? formatDate(subscription.current_period_end) : 'the end of your billing period'}.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400">No active subscription found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionManagement;

