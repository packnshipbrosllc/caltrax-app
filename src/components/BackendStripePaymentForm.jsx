import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from './ui/Button';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { STRIPE_CONFIG } from '../config/stripe';

const stripePromise = loadStripe(STRIPE_CONFIG.publishableKey);

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
      console.log('Starting payment process...');
      
      // Step 1: Create customer
      console.log('Creating customer...');
      const customerResponse = await fetch(STRIPE_CONFIG.apiEndpoints.createCustomer, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'user@example.com', // This should come from your signup form
          name: 'User Name'
        }),
      });

      console.log('Customer response status:', customerResponse.status);
      
      if (!customerResponse.ok) {
        const errorText = await customerResponse.text();
        console.error('Customer creation failed:', errorText);
        throw new Error(`Failed to create customer: ${errorText}`);
      }

      const customerData = await customerResponse.json();
      console.log('Customer created:', customerData);
      const { customerId } = customerData;

      // Step 2: Create payment method
      const cardElement = elements.getElement(CardElement);
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (pmError) {
        console.error('Payment method creation failed:', pmError);
        setError(`Payment method error: ${pmError.message}`);
        setIsProcessing(false);
        return;
      }
      
      console.log('Payment method created successfully:', paymentMethod.id);

      // Step 3: Create subscription
      console.log('Creating subscription...');
      console.log('Plan:', selectedPlan, 'Price ID:', STRIPE_CONFIG.plans[selectedPlan].priceId);
      
      const subscriptionResponse = await fetch(STRIPE_CONFIG.apiEndpoints.createSubscription, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: customerId,
          paymentMethodId: paymentMethod.id,
          planId: selectedPlan // Pass the plan name, not the priceId
        }),
      });

      console.log('Subscription response status:', subscriptionResponse.status);

      if (!subscriptionResponse.ok) {
        const errorText = await subscriptionResponse.text();
        console.error('Subscription creation failed:', errorText);
        console.error('Response status:', subscriptionResponse.status);
        console.error('Response headers:', subscriptionResponse.headers);
        throw new Error(`Failed to create subscription (${subscriptionResponse.status}): ${errorText}`);
      }

      const subscriptionData = await subscriptionResponse.json();
      console.log('Subscription created:', subscriptionData);

      // Step 4: Handle payment confirmation (all plans have 3-day trial)
      if (subscriptionData.clientSecret) {
        console.log('Confirming payment...');
        const { error: confirmError } = await stripe.confirmCardPayment(subscriptionData.clientSecret);
        
        if (confirmError) {
          console.error('Payment confirmation failed:', confirmError);
          setError(confirmError.message);
          setIsProcessing(false);
          return;
        }
        console.log('Payment confirmed successfully');
      } else {
        console.log('Trial subscription created - no immediate payment required');
      }

      setSuccess(true);
      setIsProcessing(false);
      
      onSuccess({
        plan: selectedPlan,
        subscriptionId: subscriptionData.subscriptionId,
        trialEnds: subscriptionData.trialEnd ? new Date(subscriptionData.trialEnd * 1000).toISOString() : null,
        subscribed: subscriptionData.status === 'active' || subscriptionData.status === 'trialing',
        customerId: customerId,
        trialStarted: selectedPlan === 'trial' ? new Date().toISOString() : null,
        paymentMethodId: paymentMethod.id,
      });

    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message);
      setIsProcessing(false);
      onError(err);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">
          Trial Started!
        </h3>
        <p className="text-zinc-400">
          Your 3-day free trial has started. You will be charged after the trial period.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          <AlertCircle className="w-4 h-4 mr-2" />
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

      <div className="text-xs text-zinc-400 space-y-2">
        {selectedPlan === 'trial' ? (
          <p>🔒 You won't be charged during your 3-day free trial. After the trial ends, you'll be automatically charged $5/month unless you cancel.</p>
        ) : (
          <p>🔒 Your payment information is secure and encrypted. We use industry-standard security measures.</p>
        )}
        <p className="text-red-400 font-medium">
          ⚠️ All purchases are final - No refunds allowed
        </p>
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

export default function BackendStripePaymentForm({ selectedPlan, onSuccess, onError }) {
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
