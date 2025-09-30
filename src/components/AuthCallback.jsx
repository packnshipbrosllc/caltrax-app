import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { authService } from '../services/authService';
import { simpleStorage } from '../utils/simpleStorage';

export default function AuthCallback({ onVerified, onError }) {
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('Verifying your email...');
  const [error, setError] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔍 Handling auth callback...');
        
        // Get the current user from Supabase
        const user = await authService.getCurrentUser();
        
        if (user && user.email_confirmed_at) {
          console.log('✅ Email verified successfully');
          setStatus('success');
          setMessage('Email verified successfully! You can now access your account.');
          
          // Store user data locally
          simpleStorage.setItem('caltrax-user', user);
          simpleStorage.setItem('caltrax-signed-up', true);
          
          // Call the onVerified callback after a short delay
          setTimeout(() => {
            onVerified(user);
          }, 2000);
        } else {
          throw new Error('Email verification failed or user not found');
        }
      } catch (err) {
        console.error('❌ Auth callback error:', err);
        setStatus('error');
        setError(err.message || 'Email verification failed');
        setMessage('There was a problem verifying your email.');
      }
    };

    handleAuthCallback();
  }, [onVerified]);

  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoToSignIn = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4">
              {status === 'verifying' && (
                <Loader className="w-8 h-8 text-blue-400 animate-spin" />
              )}
              {status === 'success' && (
                <CheckCircle className="w-8 h-8 text-green-400" />
              )}
              {status === 'error' && (
                <AlertCircle className="w-8 h-8 text-red-400" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              {status === 'verifying' && 'Verifying Email...'}
              {status === 'success' && 'Email Verified!'}
              {status === 'error' && 'Verification Failed'}
            </CardTitle>
            <p className="text-zinc-400 mt-2">
              {message}
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              </div>
            )}

            {status === 'success' && (
              <div className="bg-green-900/30 border border-green-700 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <p className="text-green-200 text-sm">
                    Your account is now active! Redirecting you to the app...
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {status === 'error' && (
                <>
                  <Button
                    onClick={handleRetry}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Try Again
                  </Button>
                  <Button
                    onClick={handleGoToSignIn}
                    variant="outline"
                    className="w-full border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                  >
                    Go to Sign In
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

