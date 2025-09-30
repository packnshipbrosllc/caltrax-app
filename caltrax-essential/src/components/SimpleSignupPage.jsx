import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Check, ArrowRight, Clock, DollarSign, Calendar, Zap, Shield, Lock } from 'lucide-react';
import { useSignUp } from '@clerk/clerk-react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import BackendStripePaymentForm from './BackendStripePaymentForm';
import { secureStorage, validateUserInput, sanitizeInput, hashPassword } from '../utils/security';
import { simpleStorage } from '../utils/simpleStorage';
import { authService } from '../services/authService';

export default function SimpleSignupPage({ onSignup, onShowSignIn }) {
  const [selectedPlan, setSelectedPlan] = useState('trial');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [signupAttempts, setSignupAttempts] = useState(0);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [error, setError] = useState('');

  const plans = [
    {
      id: 'trial',
      name: 'Free Trial',
      price: '$0',
      period: '3 days',
      description: 'Full access to all features',
      features: ['Unlimited food analysis', 'Real-time nutrition tracking', 'Health scoring', 'Voice feedback', 'Macro tracking', 'Personalized meal plans', 'Personalized workout plans'],
      popular: false,
      trial: true
    },
    {
      id: 'monthly',
      name: 'Monthly',
      price: '$5',
      period: 'per month',
      description: 'Perfect for trying out',
      features: ['Everything in trial', 'Priority support', 'Advanced analytics', 'Export data', 'Personalized meal plans', 'Personalized workout plans'],
      popular: true,
      trial: false
    },
    {
      id: 'yearly',
      name: 'Yearly',
      price: '$30',
      period: 'per year',
      description: 'Best value - Save 50%',
      originalPrice: '$60',
      features: ['Everything in monthly', 'Premium insights', 'Custom goals', 'API access', 'Personalized meal plans', 'Personalized workout plans'],
      popular: false,
      trial: false
    }
  ];

  const handleInitialSignup = async (e) => {
    e.preventDefault();
    console.log('Form submitted!', { email, password, confirmPassword });
    
    // Check rate limiting (5 attempts per 5 minutes)
    const now = Date.now();
    const attempts = JSON.parse(localStorage.getItem('signupAttempts') || '[]');
    const recentAttempts = attempts.filter(timestamp => now - timestamp < 300000); // 5 minutes
    
    if (recentAttempts.length >= 5) {
      setIsRateLimited(true);
      setPasswordError('Too many signup attempts. Please wait 5 minutes before trying again.');
      return;
    }
    
    // Record this attempt
    recentAttempts.push(now);
    localStorage.setItem('signupAttempts', JSON.stringify(recentAttempts));
    setSignupAttempts(recentAttempts.length);
    
    if (!email || !password || !confirmPassword) {
      console.log('Missing required fields');
      return;
    }
    
    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedPassword = sanitizeInput(password);
    const sanitizedConfirmPassword = sanitizeInput(confirmPassword);
    
    // Validate user input
    const validation = validateUserInput({
      email: sanitizedEmail,
      password: sanitizedPassword
    });
    
    if (!validation.isValid) {
      console.log('Validation failed:', validation.errors);
      setPasswordError(validation.errors.join(', '));
      return;
    }
    
    // Validate password match
    if (sanitizedPassword !== sanitizedConfirmPassword) {
      console.log('Passwords do not match');
      setPasswordError('Passwords do not match');
      return;
    }
    
    setPasswordError('');
    console.log('All validation passed, showing payment form...');
    
    // Always show payment form for all plans (including trial)
    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = async (paymentData) => {
    try {
      console.log('Payment success - creating account...', paymentData);
      
      // Create user data structure
      const userData = {
        email: sanitizeInput(email),
        password: hashPassword(password), // Hash for local storage compatibility
        plan: selectedPlan,
        trialEnds: paymentData.trialEnds || null,
        subscribed: paymentData.subscribed || false,
        paymentMethodId: paymentData.paymentMethodId || null,
        trialStarted: paymentData.trialStarted || null,
        subscriptionId: paymentData.subscriptionId || null,
        customerId: paymentData.customerId || null,
        subscription_status: 'trialing',
        profile: null, // Will be set when user completes profile
        createdAt: new Date().toISOString()
      };
      
      console.log('✅ User account created:', userData);
      
      // Store locally
      simpleStorage.setItem('caltrax-user', userData);
      simpleStorage.setItem('caltrax-signed-up', true);
      
      // Also save to server for cross-device functionality
      try {
        const serverResponse = await fetch('/.netlify/functions/save-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: sanitizeInput(email),
            password: password, // Don't hash here - server will hash it
            profile: null, // Will be updated when profile is completed
            plan: selectedPlan,
            subscriptionData: {
              trialEnds: paymentData.trialEnds || null,
              subscribed: paymentData.subscribed || false,
              paymentMethodId: paymentData.paymentMethodId || null,
              trialStarted: paymentData.trialStarted || null,
              subscriptionId: paymentData.subscriptionId || null,
              customerId: paymentData.customerId || null,
              subscription_status: 'trialing'
            }
          })
        });
        
        if (serverResponse.ok) {
          console.log('✅ User saved to server for cross-device access');
        } else {
          console.log('⚠️ Failed to save user to server, but local account created');
        }
      } catch (serverError) {
        console.log('⚠️ Server save failed, but local account created:', serverError.message);
      }
      
      console.log('Calling onSignup with user data');
      onSignup(userData);
      
    } catch (error) {
      console.error('❌ Account creation failed:', error);
      setError(`Account creation failed: ${error.message}`);
    }
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    setShowPaymentForm(false);
  };


  // Function to log user signup data
  const logUserSignup = async (userData) => {
    try {
      // Logging disabled to prevent secureStorage conflicts
      console.log('User signup data:', userData);
      
      // In production, you would send this to your backend with proper encryption
      // await fetch('/api/log-signup', {
      //   method: 'POST',
      //   headers: { 
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${sessionToken}`,
      //     'X-CSRF-Token': csrfToken
      //   },
      //   body: JSON.stringify(encryptData(userData))
      // });
      
    } catch (error) {
      console.error('Error logging user signup:', error);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
      {/* Navigation */}
      <nav className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">CalTrax AI</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-5xl font-bold mb-6"
          >
            Choose Your{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              CalTrax AI
            </span>{' '}
            Plan
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-zinc-300 max-w-2xl mx-auto"
          >
            Start your journey to better nutrition with our AI-powered food analysis
          </motion.p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`relative ${plan.popular ? 'scale-105' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              <Card 
                className={`cursor-pointer transition-all duration-300 bg-zinc-800/50 border-zinc-700 ${
                  selectedPlan === plan.id 
                    ? 'ring-2 ring-blue-500 bg-zinc-800/70' 
                    : 'hover:bg-zinc-800/70'
                } ${plan.popular ? 'border-blue-500/50' : ''}`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl font-bold text-white">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-zinc-400 ml-2">{plan.period}</span>
                    {plan.originalPrice && (
                      <div className="text-sm text-zinc-500 line-through mt-1">
                        {plan.originalPrice}/year
                      </div>
                    )}
                  </div>
                  <p className="text-zinc-400 mt-2">{plan.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center">
                        <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                        <span className="text-zinc-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {plan.trial && (
                    <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <div className="flex items-center text-blue-400 text-sm">
                        <Clock className="w-4 h-4 mr-2" />
                        Free for 3 days, then auto-billing
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Signup Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-md mx-auto"
        >
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-center text-2xl">Create Your Account</CardTitle>
            </CardHeader>
            <CardContent>
              {!showPaymentForm ? (
                <form onSubmit={handleInitialSignup} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-zinc-900 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-zinc-900 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Create a password (min 6 characters)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-zinc-900 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Confirm your password"
                    />
                    {passwordError && (
                      <p className="text-red-400 text-sm mt-1">{passwordError}</p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    disabled={!email || !password || !confirmPassword || passwordError || isRateLimited}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-lg py-3"
                  >
                    {isRateLimited ? 'Rate Limited' : 'Continue to Payment'}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  
                  {signupAttempts > 0 && (
                    <p className="text-sm text-zinc-400 text-center">
                      Signup attempts: {signupAttempts}/5
                    </p>
                  )}
                  <div className="flex items-center justify-center space-x-2 text-xs text-zinc-400 mt-2">
                    <Shield className="w-4 h-4 text-green-400" />
                    <span>256-bit encryption</span>
                    <Lock className="w-4 h-4 text-green-400" />
                    <span>Secure storage</span>
                  </div>
                  <p className="text-xs text-zinc-400 text-center mt-2">
                    Credit card required for all plans, including free trial
                  </p>
                  <p className="text-xs text-zinc-400 text-center">
                    By signing up, you agree to our Terms of Service and Privacy Policy
                  </p>
                  
                  <div className="text-center mt-4">
                    <button
                      type="button"
                      onClick={onShowSignIn}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                    >
                      Already have an account? Sign in
                    </button>
                  </div>
                  <p className="text-xs text-red-400 text-center font-medium">
                    ⚠️ All purchases are final - No refunds allowed
                  </p>
                </form>
              ) : (
                <div>
                  {console.log('Rendering payment form for plan:', selectedPlan)}
                  <div className="mb-6 p-4 bg-zinc-900/50 rounded-lg border border-zinc-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-white">{plans.find(p => p.id === selectedPlan)?.name}</h3>
                        <p className="text-sm text-zinc-400">{plans.find(p => p.id === selectedPlan)?.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-white">
                          {plans.find(p => p.id === selectedPlan)?.price}
                        </div>
                        <div className="text-sm text-zinc-400">
                          {plans.find(p => p.id === selectedPlan)?.period}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <BackendStripePaymentForm
                    selectedPlan={selectedPlan}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                  
                  <Button
                    onClick={() => setShowPaymentForm(false)}
                    variant="outline"
                    className="w-full mt-4 border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                  >
                    Back to Account Details
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Features Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <h3 className="text-2xl font-bold mb-8">What You'll Get</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Instant Analysis</h4>
              <p className="text-zinc-400 text-center">Get nutrition facts in seconds with AI-powered vision</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Daily Tracking</h4>
              <p className="text-zinc-400 text-center">Monitor your macros and progress over time</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Affordable</h4>
              <p className="text-zinc-400 text-center">Start free, then just $5/month for unlimited access</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
