import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { verifyAdminCredentials, secureStorage } from '../utils/security';

export default function AdminLogin({ onSuccess, onCancel }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Verify admin credentials
      const isValid = verifyAdminCredentials(email, password);
      
      if (isValid) {
        // Create admin session
        const adminSession = {
          email: email.toLowerCase(),
          isAdmin: true,
          loginTime: new Date().toISOString(),
          sessionId: Math.random().toString(36).substring(7)
        };
        
        // Store admin session securely
        secureStorage.setItem('admin-session', adminSession);
        
        onSuccess(adminSession);
      } else {
        setError('Invalid admin credentials');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
      console.error('Admin login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-zinc-800 rounded-lg p-6 max-w-md w-full border border-zinc-700"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Admin Access</h2>
          <p className="text-zinc-400">Enter your admin credentials to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
              <AlertCircle className="w-4 h-4 mr-2" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Admin Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="support@caltrax.ai"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Admin Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-12"
                placeholder="Enter admin password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              onClick={onCancel}
              variant="outline"
              className="flex-1 border-zinc-600 text-zinc-300 hover:bg-zinc-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!email || !password || isLoading}
              className="flex-1 bg-gradient-to-r from-purple-500 to-red-600 hover:from-purple-600 hover:to-red-700"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Verifying...
                </div>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Login
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="mt-6 p-3 bg-zinc-900/50 rounded-lg">
          <div className="flex items-center text-xs text-zinc-400">
            <Shield className="w-4 h-4 mr-2 text-green-400" />
            <span>Secure admin authentication required</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
