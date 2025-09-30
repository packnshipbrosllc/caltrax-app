import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Check, Zap, Crown, Star } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';

const PaymentModal = ({ isOpen, onClose, onPaymentSuccess, userToken }) => {
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

  useEffect(() => {
    if (isOpen && userToken) {
      fetchSubscriptionStatus();
    }
  }, [isOpen, userToken]);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/payments/subscription', {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubscriptionStatus(data);
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    }
  };

  const handlePayment = async () => {
    if (!userToken) {
      setError('Please login to continue');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Get available plans first
      const plansResponse = await fetch('http://localhost:5001/api/payments/plans');
      if (!plansResponse.ok) {
        throw new Error('Failed to get available plans');
      }

      const plansData = await plansResponse.json();
      const selectedPlanData = plansData.plans.find(plan => plan.id === selectedPlan);
      
      if (!selectedPlanData) {
        throw new Error('Selected plan not found');
      }

      // Create subscription with trial
      const subscriptionResponse = await fetch('http://localhost:5001/api/payments/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({ 
          priceId: selectedPlanData.priceId 
        })
      });

      if (!subscriptionResponse.ok) {
        throw new Error('Failed to create subscription');
      }

      const subscriptionData = await subscriptionResponse.json();

      // In production, you would integrate with Stripe Elements here
      // For now, we'll simulate the payment process
      console.log('Subscription created:', subscriptionData);
      
      // Simulate successful payment setup
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update subscription status
      setSubscriptionStatus({
        hasActiveSubscription: true,
        planType: selectedPlan,
        status: 'trialing',
        currentPeriodEnd: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        trialEnd: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      });

      onPaymentSuccess({
        subscriptionId: subscriptionData.subscriptionId,
        planType: selectedPlan,
        trialDays: 3
      });
      onClose();

    } catch (error) {
      console.error('Payment error:', error);
      setError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly Plan',
      price: '$5',
      period: 'month',
      trialDays: 3,
      description: '3-day free trial, then $5/month',
      features: ['3-day free trial', 'Unlimited nutrition scans', 'AI-powered analysis', 'Voice feedback', 'Macro tracking'],
      popular: false,
      requiresCard: true
    },
    {
      id: 'yearly',
      name: 'Yearly Plan',
      price: '$30',
      period: 'year',
      trialDays: 3,
      description: '3-day free trial, then $30/year',
      features: ['3-day free trial', 'Everything in Monthly', 'Priority support', 'Advanced analytics', 'Export data'],
      popular: true,
      savings: 'Save 50%',
      requiresCard: true
    }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-900 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Upgrade to Premium</h2>
                <p className="text-gray-400">Unlock unlimited nutrition analysis</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Current Status */}
          {subscriptionStatus && (
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <div className="flex items-center gap-2 text-blue-300">
                <Check className="w-4 h-4" />
                <span className="font-medium">
                  {subscriptionStatus.hasActiveSubscription 
                    ? `Active ${subscriptionStatus.planType} subscription`
                    : 'Currently on free trial'
                  }
                </span>
              </div>
            </div>
          )}

          {/* Pricing Plans */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {plans.map((plan) => (
              <motion.div
                key={plan.id}
                whileHover={{ scale: 1.02 }}
                className={`relative cursor-pointer transition-all ${
                  selectedPlan === plan.id 
                    ? 'ring-2 ring-purple-500' 
                    : 'hover:ring-1 hover:ring-gray-600'
                }`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                <Card className="h-full">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl text-white">{plan.name}</CardTitle>
                        <p className="text-gray-400 text-sm">{plan.description}</p>
                      </div>
                      {plan.popular && (
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full">
                          <Star className="w-3 h-3 inline mr-1" />
                          Most Popular
                        </div>
                      )}
                    </div>
                    <div className="mt-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white">{plan.price}</span>
                        <span className="text-gray-400">/{plan.period}</span>
                        {plan.savings && (
                          <span className="text-green-400 text-sm font-medium">{plan.savings}</span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-gray-300">
                          <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-blue-300 text-sm">
                        💳 Credit card required for 3-day trial
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Payment Button */}
          <div className="flex gap-3">
            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-3 px-6 rounded-xl transition-all"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Start 3-Day Free Trial - {selectedPlan === 'monthly' ? 'Monthly' : 'Yearly'} Plan
                </div>
              )}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="px-6 py-3"
            >
              Cancel
            </Button>
          </div>

          {/* Security Notice */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              🔒 Secure payment processing • Cancel anytime • 30-day money-back guarantee
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PaymentModal;
