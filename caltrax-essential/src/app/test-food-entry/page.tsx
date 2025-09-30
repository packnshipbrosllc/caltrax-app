'use client';

import { useUser } from '@clerk/nextjs';
import { useState } from 'react';

export default function TestFoodEntryPage() {
  const { user } = useUser();
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testFoodEntry = async () => {
    if (!user) {
      setTestResult({ error: 'No user found' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/test-food-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          clerkUserId: user.id,
          foodData: {
            name: 'Test Food',
            calories: 100,
            protein: 10,
            fat: 5,
            carbs: 15,
            quantity: 1,
            unit: 'serving'
          }
        })
      });
      
      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({ error: error.message });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Food Entry Test</h1>
        
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">User Info</h2>
          <p><strong>User ID:</strong> {user?.id || 'Not found'}</p>
          <p><strong>Email:</strong> {user?.emailAddresses?.[0]?.emailAddress || 'Not found'}</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Food Entry</h2>
          <button
            onClick={testFoodEntry}
            disabled={loading || !user}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold"
          >
            {loading ? 'Testing...' : 'Test Food Entry Creation'}
          </button>
        </div>

        {testResult && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Test Result</h2>
            <pre className="bg-gray-900 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
