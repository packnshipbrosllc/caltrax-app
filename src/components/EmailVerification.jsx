import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { authService } from '../services/authService';

export default function EmailVerification({ email, onVerified, onBack }) {
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendError, setResendError] = useState('');

  const handleResendVerification = async () => {
    setIsResending(true);
    setResendMessage('');
    setResendError('');

    try {
      const result = await authService.resendVerification(email);
      setResendMessage(result.message);
    } catch (error) {
      setResendError(error.message || 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerification = async () => {
    try {
      // Try to get the current user to check if email is verified
      const user = await authService.getCurrentUser();
      if (user && user.email_confirmed_at) {
        onVerified(user);
      } else {
        setResendError('Email not yet verified. Please check your inbox and click the verification link.');
      }
    } catch (error) {
      setResendError('Please check your inbox and click the verification link.');
    }
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
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              Verify Your Email
            </CardTitle>
            <p className="text-zinc-400 mt-2">
              We've sent a verification link to
            </p>
            <p className="text-blue-400 font-medium">{email}</p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-zinc-300 mb-4">
                Please check your email and click the verification link to complete your account setup.
              </p>
              
              <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-200">
                    <p className="font-medium mb-1">Important:</p>
                    <p>You must verify your email before you can access the app. Check your spam folder if you don't see the email.</p>
                  </div>
                </div>
              </div>
            </div>

            {resendMessage && (
              <div className="bg-green-900/30 border border-green-700 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <p className="text-green-200 text-sm">{resendMessage}</p>
                </div>
              </div>
            )}

            {resendError && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <p className="text-red-200 text-sm">{resendError}</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={handleResendVerification}
                disabled={isResending}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Resend Verification Email
                  </>
                )}
              </Button>

              <Button
                onClick={handleCheckVerification}
                variant="outline"
                className="w-full border-zinc-600 text-zinc-300 hover:bg-zinc-800"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                I've Verified My Email
              </Button>

              <Button
                onClick={onBack}
                variant="ghost"
                className="w-full text-zinc-400 hover:text-white"
              >
                Back to Sign Up
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

