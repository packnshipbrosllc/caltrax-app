import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

export default function SupabaseConnectionTest() {
  const [testResult, setTestResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const testConnection = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      console.log('🔍 Testing Supabase connection...');
      
      // Test environment variables (prefer REACT_APP_* but fall back to NEXT_PUBLIC_*)
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      console.log('Environment variables:');
      console.log('REACT_APP_SUPABASE_URL:', supabaseUrl ? 'Present' : 'Missing');
      console.log('REACT_APP_SUPABASE_ANON_KEY:', supabaseKey ? 'Present' : 'Missing');
      
      if (!supabaseUrl || !supabaseKey) {
        setTestResult({
          success: false,
          message: 'Missing Supabase environment variables',
          details: {
            url: supabaseUrl ? 'Present' : 'Missing',
            key: supabaseKey ? 'Present' : 'Missing'
          }
        });
        return;
      }
      
      // Test basic connection
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);
      
      if (error) {
        setTestResult({
          success: false,
          message: 'Supabase connection failed',
          details: error.message
        });
      } else {
        setTestResult({
          success: true,
          message: 'Supabase connection successful!',
          details: {
            url: 'Present',
            key: 'Present',
            data: data
          }
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: 'Connection test failed',
        details: err.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <div className="fixed top-4 right-4 bg-black text-white p-4 rounded-lg shadow-lg z-50 max-w-sm">
      <h3 className="font-bold mb-2">🔧 Supabase Test</h3>
      
      {isLoading && <p>Testing connection...</p>}
      
      {testResult && (
        <div className={`text-sm ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
          <p className="font-semibold">
            {testResult.success ? '✅ Success' : '❌ Failed'}
          </p>
          <p>{testResult.message}</p>
          {testResult.details && (
            <pre className="mt-2 text-xs bg-gray-800 p-2 rounded overflow-auto">
              {JSON.stringify(testResult.details, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

