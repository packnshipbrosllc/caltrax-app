import React, { useState } from 'react';
import { authService } from '../services/authService';

export default function SignInTest() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const testSignIn = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      console.log('🧪 Testing sign-in with:', { email, password });
      
      const userData = await authService.signIn(email, password);
      
      console.log('✅ Sign-in test successful:', userData);
      setResult({
        success: true,
        message: 'Sign-in successful!',
        data: userData
      });
    } catch (error) {
      console.error('❌ Sign-in test failed:', error);
      setResult({
        success: false,
        message: error.message || 'Sign-in failed',
        error: error
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed top-4 left-4 bg-black text-white p-4 rounded-lg shadow-lg z-50 max-w-sm">
      <h3 className="font-bold mb-2">🧪 Sign-In Test</h3>
      
      <div className="space-y-2 mb-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-2 py-1 bg-gray-800 text-white rounded text-sm"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-2 py-1 bg-gray-800 text-white rounded text-sm"
        />
        <button
          onClick={testSignIn}
          disabled={isLoading || !email || !password}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-3 py-1 rounded text-sm"
        >
          {isLoading ? 'Testing...' : 'Test Sign-In'}
        </button>
      </div>
      
      {result && (
        <div className={`text-sm ${result.success ? 'text-green-400' : 'text-red-400'}`}>
          <p className="font-semibold">
            {result.success ? '✅ Success' : '❌ Failed'}
          </p>
          <p>{result.message}</p>
          {result.data && (
            <pre className="mt-2 text-xs bg-gray-800 p-2 rounded overflow-auto">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

