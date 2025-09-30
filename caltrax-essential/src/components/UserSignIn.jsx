import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { validatePassword, sanitizeInput, secureStorage, hashPassword } from '../utils/security';
import { simpleStorage } from '../utils/simpleStorage';
import { authService } from '../services/authService';

const UserSignIn = ({ onSignIn, onBackToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate inputs
      if (!email || !password) {
        setError('Please fill in all fields');
        return;
      }

      // Sanitize inputs
      const sanitizedEmail = sanitizeInput(email);
      const sanitizedPassword = sanitizeInput(password);

      console.log('🔍 Starting sign-in process...', { email: sanitizedEmail });

      // Try server first for cross-device functionality
      try {
        console.log('🔍 Attempting server signin...');
        const serverResponse = await fetch('/.netlify/functions/get-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: sanitizedEmail,
            password: sanitizedPassword
          })
        });
        
        if (serverResponse.ok) {
          const serverData = await serverResponse.json();
          console.log('✅ Server signin successful:', serverData);
          console.log('🔍 Server user data:', serverData.user);
          
          // Store locally for consistency
          simpleStorage.setItem('caltrax-user', serverData.user);
          simpleStorage.setItem('caltrax-signed-up', true);
          
          console.log('🔍 Calling onSignIn with server data...');
          // Sign in successful
          onSignIn(serverData.user);
          console.log('🔍 onSignIn called successfully');
          return;
        } else {
          const errorData = await serverResponse.json();
          console.log('❌ Server signin failed:', errorData);
          console.log('🔍 Server response status:', serverResponse.status);
          throw new Error(errorData.error || 'Server signin failed');
        }
      } catch (serverError) {
        console.log('❌ Server signin failed, trying local storage fallback...', serverError.message);
        
        // Fallback to local storage method
        const storedUser = simpleStorage.getItem('caltrax-user');
        console.log('🔍 Checking local storage for user:', storedUser);
        
        if (storedUser && storedUser.email === sanitizedEmail) {
          // Verify password using the old method
          const hashedInputPassword = hashPassword(sanitizedPassword);
          
          console.log('🔍 Comparing passwords...');
          console.log('Input password hash:', hashedInputPassword);
          console.log('Stored password hash:', storedUser.password);
          
          if (hashedInputPassword === storedUser.password) {
            console.log('✅ Local storage signin successful');
            
            // Store locally for consistency
            simpleStorage.setItem('caltrax-user', storedUser);
            simpleStorage.setItem('caltrax-signed-up', true);
            
            // Sign in successful
            onSignIn(storedUser);
          } else {
            throw new Error('Invalid password');
          }
        } else {
          throw new Error('No account found with this email address');
        }
      }
      
    } catch (err) {
      console.error('❌ Signin failed:', err);
      setError(err.message || 'Sign in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Welcome back to CalTrax AI
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSignIn}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={onBackToSignup}
                className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
              >
                Don't have an account? Sign up
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default UserSignIn;
