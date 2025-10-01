import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Brain, Zap, Shield, BarChart3, Smartphone, ArrowRight, Utensils, Dumbbell, X } from 'lucide-react';
import { Button } from './ui/Button';
import { SignIn, SignUp, useAuth } from '@clerk/clerk-react';

export default function LandingPage({ onGetStarted, onShowSignIn }) {
  const { isSignedIn } = useAuth();
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  // Close modals when user signs in
  useEffect(() => {
    if (isSignedIn) {
      // User just signed in via Clerk, close modals
      setShowSignIn(false);
      setShowSignUp(false);
    }
  }, [isSignedIn]);

  const features = [
    {
      icon: Camera,
      title: "Real-time Food Analysis",
      description: "Point your camera at any food and get instant nutrition analysis powered by advanced AI vision."
    },
    {
      icon: Brain,
      title: "AI-Powered Insights",
      description: "Get detailed nutrition breakdowns, health scores, and personalized recommendations."
    },
    {
      icon: BarChart3,
      title: "Health Tracking",
      description: "Track your daily nutrition intake with beautiful charts and progress monitoring."
    },
    {
      icon: Utensils,
      title: "Personalized Meal Plans",
      description: "Get custom meal plans tailored to your goals, dietary preferences, and nutritional needs."
    },
    {
      icon: Dumbbell,
      title: "Personalized Workout Plans",
      description: "Receive workout recommendations that complement your nutrition goals and fitness level."
    },
    {
      icon: Zap,
      title: "Instant Results",
      description: "Get nutrition facts, calories, and health scores in seconds, not minutes."
    },
    {
      icon: Shield,
      title: "Privacy First",
      description: "Your data stays secure. All analysis happens locally when possible."
    },
    {
      icon: Smartphone,
      title: "Mobile Optimized",
      description: "Works perfectly on any device with responsive design and touch-friendly interface."
    }
  ];

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
            <div className="flex gap-4">
              <Button 
                onClick={() => setShowSignUp(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button 
                onClick={() => setShowSignIn(true)}
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-gray-900"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        className="relative overflow-hidden min-h-screen flex items-center bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/phone-mockup.jpg?v=4)',
          backgroundSize: 'cover',
          backgroundPosition: 'center center'
        }}
      >
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950/70 via-zinc-900/50 to-black/70"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-6xl font-bold tracking-tight mb-6"
            >
              Smart Food Analysis with{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                AI Vision
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-zinc-300 mb-8 max-w-3xl mx-auto"
            >
              Point your camera at any food and get instant nutrition analysis, health scores, 
              and personalized insights powered by advanced computer vision and AI.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Button 
                onClick={() => setShowSignUp(true)}
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-lg px-8 py-4 shadow-2xl"
              >
                Start Analyzing Food
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mt-12 text-sm text-zinc-400"
            >
              <p>✓ Works on any device • ✓ Privacy-first</p>
            </motion.div>
          </div>
        </div>

        {/* Additional Background Effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Powerful Features for Smart Nutrition
            </h2>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              Everything you need to understand your food and make healthier choices
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-6 hover:bg-zinc-800/70 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-zinc-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-3xl p-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Transform Your Nutrition?
            </h2>
            <p className="text-xl text-zinc-300 mb-8">
              Join thousands of users who are already making smarter food choices with CalTrax AI
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => setShowSignUp(true)}
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-lg px-8 py-4"
              >
                Start Your Journey
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                onClick={() => setShowSignIn(true)}
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-gray-900 text-lg px-8 py-4"
              >
                Sign In
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">CalTrax AI</span>
            </div>
            <div className="text-zinc-400 text-sm text-center">
              <p>© 2024 CalTrax AI. All rights reserved.</p>
              <p className="text-red-400 font-medium mt-2">
                ⚠️ All purchases are final - No refunds allowed
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Clerk Authentication Modals */}
      {showSignIn && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-700 max-w-md w-full relative">
            <button
              onClick={() => setShowSignIn(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="p-6">
              <SignIn 
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "bg-transparent shadow-none border-none",
                    headerTitle: "text-white text-2xl font-bold",
                    headerSubtitle: "text-zinc-400",
                    socialButtonsBlockButton: "bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700",
                    formButtonPrimary: "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700",
                    formFieldInput: "bg-zinc-800 border-zinc-700 text-white",
                    footerActionLink: "text-blue-400 hover:text-blue-300",
                    identityPreviewText: "text-zinc-300",
                    formFieldLabel: "text-zinc-300"
                  }
                }}
                routing="hash"
                afterSignInUrl="#"
              />
            </div>
          </div>
        </div>
      )}

      {showSignUp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-700 max-w-md w-full relative">
            <button
              onClick={() => setShowSignUp(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="p-6">
              <SignUp 
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "bg-transparent shadow-none border-none",
                    headerTitle: "text-white text-2xl font-bold",
                    headerSubtitle: "text-zinc-400",
                    socialButtonsBlockButton: "bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700",
                    formButtonPrimary: "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700",
                    formFieldInput: "bg-zinc-800 border-zinc-700 text-white",
                    footerActionLink: "text-blue-400 hover:text-blue-300",
                    identityPreviewText: "text-zinc-300",
                    formFieldLabel: "text-zinc-300"
                  }
                }}
                routing="hash"
                afterSignUpUrl="#"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
