import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Check, Zap, Shield, BarChart3, Sparkles } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

export default function PaymentPage({ onPaymentComplete, user }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly Plan',
      price: '$5',
      priceId: 'price_1S84cT2LmuiKVnPd3NXruhvk', // Monthly $5 plan
      period: '/month',
      trialDays: '3-day free trial',
      features: [
        '3-day free trial included',
        'Unlimited food scans',
        'AI-powered nutrition analysis',
        'Daily macro tracking',
        'Personalized meal plans',
        'Health insights & trends',
        'Email support'
      ],
      popular: false
    },
    {
      id: 'yearly',
      name: 'Annual Plan',
      price: '$30',
      priceId: 'price_1SDdj12LmuiKVnPdD6HERWFX', // Yearly $30 plan
      period: '/year',
      trialDays: '3-day free trial',
      originalPrice: '$60',
      discount: '50% OFF',
      features: [
        '3-day free trial included',
        'Everything in Monthly',
        'Priority support',
        'Advanced analytics',
        'Custom meal plans',
        'Workout integration',
        'Save $30 per year'
      ],
      popular: true
    }
  ];

  const handleSubscribe = async (plan) => {
    if (!user) {
      setError('Please sign in to continue');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Validate Price ID
      if (!plan.priceId) {
        throw new Error('Price ID not configured for this plan');
      }

      // Call your Vercel API to create checkout session
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plan.priceId,
          userId: user.id,
          email: user.emailAddresses?.[0]?.emailAddress || user.primaryEmailAddress?.emailAddress,
          planType: plan.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { sessionId } = await response.json();

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: sessionId,
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-4"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold">Choose Your Plan</h1>
          </motion.div>
          <p className="text-xl text-zinc-400">Start tracking your nutrition with AI-powered insights</p>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-center"
          >
            {error}
          </motion.div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className={`relative ${
                plan.popular 
                  ? 'bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/50' 
                  : 'bg-zinc-800/50 border-zinc-700'
              }`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </div>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <div className="text-5xl font-bold mb-2">
                    {plan.price}
                    <span className="text-lg text-zinc-400 font-normal">{plan.period}</span>
                  </div>
                  {plan.originalPrice && (
                    <p className="text-zinc-500 line-through">{plan.originalPrice}</p>
                  )}
                  {plan.discount && (
                    <p className="text-green-400 font-medium">{plan.discount}</p>
                  )}
                  <p className="text-green-400 font-medium text-sm mt-2">{plan.trialDays}</p>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-zinc-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleSubscribe(plan)}
                    disabled={isLoading}
                    className="w-full text-lg py-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Start Free Trial
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="mt-12 text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-zinc-400">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-400" />
              <span>Secure Payment</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-400" />
              <span>Instant Access</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              <span>Cancel Anytime</span>
            </div>
          </div>
          <p className="text-red-400 font-medium mt-4">
            All purchases are final - No refunds allowed
          </p>
        </div>
      </div>
    </div>
  );
}
