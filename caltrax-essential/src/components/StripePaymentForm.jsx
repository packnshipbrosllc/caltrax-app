import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_51234567890abcdef...');

const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#ffffff',
      '::placeholder': {
        color: '#9ca3af',
      },
      backgroundColor: '#18181b',
    },
    invalid: {
      color: '#ef4444',
    },
  },
  hidePostalCode: true,
};

function PaymentForm({ selectedPlan, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // For trial plans, we still need to collect payment method but won't charge immediately
      if (selectedPlan === 'trial') {
        // Create payment method for trial (required by Stripe)
        const cardElement = elements.getElement(CardElement);
        const { error, paymentMethod } = await stripe.createPaymentMethod({
          type: 'card',
          card: cardElement,
        });

        if (error) {
          setError(error.message);
          setIsProcessing(false);
          return;
        }

        // Simulate successful trial signup with payment method collected
        setTimeout(() => {
          setSuccess(true);
          setIsProcessing(false);
          onSuccess({
            plan: selectedPlan,
            trialEnds: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            subscribed: false,
            paymentMethodId: paymentMethod.id,
            trialStarted: new Date().toISOString(),
          });
        }, 1000);
        return;
      }

      // For paid plans, create payment method
      const cardElement = elements.getElement(CardElement);
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        setError(error.message);
        setIsProcessing(false);
        return;
      }

      // Here you would typically send the payment method to your backend
      // For now, we'll simulate a successful payment
      console.log('Payment method created:', paymentMethod);
      
      // Simulate API call to create subscription
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSuccess(true);
      setIsProcessing(false);
      onSuccess({
        plan: selectedPlan,
        paymentMethodId: paymentMethod.id,
        subscribed: true,
      });

    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setIsProcessing(false);
      onError(err);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Payment Successful!</h3>
        <p className="text-zinc-400">Your subscription has been activated.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Card Details
        </label>
        <div className="p-4 bg-zinc-900 border border-zinc-600 rounded-lg">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      <div className="text-xs text-zinc-400">
        {selectedPlan === 'trial' ? (
          <p>🔒 You won't be charged during your 3-day free trial. After the trial ends, you'll be automatically charged $5/month unless you cancel.</p>
        ) : (
          <p>🔒 Your payment information is secure and encrypted. We use industry-standard security measures.</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-lg py-3"
      >
        {isProcessing ? (
          <div className="flex items-center justify-center">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            {selectedPlan === 'trial' ? 'Setting up trial...' : 'Processing payment...'}
          </div>
        ) : (
          selectedPlan === 'trial' ? 'Start 3-Day Free Trial' : 'Subscribe Now'
        )}
      </Button>
    </form>
  );
}

export default function StripePaymentForm({ selectedPlan, onSuccess, onError }) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm 
        selectedPlan={selectedPlan} 
        onSuccess={onSuccess} 
        onError={onError} 
      />
    </Elements>
  );
}
