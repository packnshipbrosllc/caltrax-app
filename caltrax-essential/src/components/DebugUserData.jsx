import React, { useState, useEffect } from 'react';
import { secureStorage } from '../utils/security';
import { simpleStorage } from '../utils/simpleStorage';

const DebugUserData = ({ user }) => {
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    const checkUserData = () => {
      const storedUser = simpleStorage.getItem('caltrax-user');
      const hasSignedUp = simpleStorage.getItem('caltrax-signed-up');
      
      // Check raw localStorage values
      const rawUser = localStorage.getItem('caltrax-user');
      const rawSignedUp = localStorage.getItem('caltrax-signed-up');
      const rawSessionUser = sessionStorage.getItem('caltrax-user');
      const rawSessionSignedUp = sessionStorage.getItem('caltrax-signed-up');
      
      setDebugInfo({
        currentUser: user,
        storedUser: storedUser,
        hasSignedUp: hasSignedUp,
        userProfile: user?.profile,
        storedProfile: storedUser?.profile,
        calories: user?.profile?.calories,
        storedCalories: storedUser?.profile?.calories,
        rawUser: rawUser ? 'Exists' : 'None',
        rawSignedUp: rawSignedUp ? 'Exists' : 'None',
        rawSessionUser: rawSessionUser ? 'Exists' : 'None',
        rawSessionSignedUp: rawSessionSignedUp ? 'Exists' : 'None'
      });
    };

    checkUserData();
  }, [user]);

  if (!debugInfo) return null;

  return (
    <div className="fixed top-4 left-4 bg-black bg-opacity-90 text-white p-4 rounded-lg text-xs max-w-md z-50">
      <h3 className="font-bold mb-2">Debug User Data</h3>
      <div className="space-y-1">
        <div><strong>Current User:</strong> {user ? 'Yes' : 'No'}</div>
        <div><strong>Stored User:</strong> {debugInfo.storedUser ? 'Yes' : 'No'}</div>
        <div><strong>Has Signed Up:</strong> {debugInfo.hasSignedUp ? 'Yes' : 'No'}</div>
        <div><strong>User Profile:</strong> {debugInfo.userProfile ? 'Yes' : 'No'}</div>
        <div><strong>Stored Profile:</strong> {debugInfo.storedProfile ? 'Yes' : 'No'}</div>
        <div><strong>Current Calories:</strong> {debugInfo.calories || 'None'}</div>
        <div><strong>Stored Calories:</strong> {debugInfo.storedCalories || 'None'}</div>
        <div><strong>Raw localStorage:</strong> {debugInfo.rawUser} / {debugInfo.rawSignedUp}</div>
        <div><strong>Raw sessionStorage:</strong> {debugInfo.rawSessionUser} / {debugInfo.rawSessionSignedUp}</div>
        <div><strong>Profile Data:</strong></div>
        <pre className="text-xs bg-gray-800 p-2 rounded overflow-auto max-h-32">
          {JSON.stringify(debugInfo.userProfile, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default DebugUserData;
