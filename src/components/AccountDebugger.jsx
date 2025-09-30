import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { simpleStorage } from '../utils/simpleStorage';
import { hashPassword } from '../utils/security';

const AccountDebugger = ({ onClose }) => {
  const [debugInfo, setDebugInfo] = useState({});
  const [testResults, setTestResults] = useState({});

  const runDebugCheck = () => {
    console.log('🔍 Running comprehensive account debug check...');
    
    const debug = {
      timestamp: new Date().toISOString(),
      localStorage: {
        available: typeof Storage !== 'undefined',
        caltraxUser: localStorage.getItem('caltrax-user'),
        caltraxSignedUp: localStorage.getItem('caltrax-signed-up'),
        allKeys: Object.keys(localStorage).filter(key => key.includes('caltrax')),
      },
      simpleStorage: {
        caltraxUser: simpleStorage.getItem('caltrax-user'),
        caltraxSignedUp: simpleStorage.getItem('caltrax-signed-up'),
      },
      rawData: {
        userDataString: localStorage.getItem('caltrax-user'),
        signedUpString: localStorage.getItem('caltrax-signed-up'),
      }
    };

    // Test account creation
    const testAccount = {
      email: 'test@example.com',
      password: hashPassword('testpassword123!'),
      customerId: 'cus_test123',
      subscriptionId: 'sub_test123',
      profile: {
        height: 70,
        weight: 150,
        age: 25,
        gender: 'male',
        activityLevel: 'moderate',
        goal: 'maintain',
        calories: 2500,
        protein: 150,
        carbs: 300,
        fat: 83
      }
    };

    console.log('🧪 Testing account creation...');
    
    // Test saving
    const saveResult = simpleStorage.setItem('caltrax-user', testAccount);
    const signupResult = simpleStorage.setItem('caltrax-signed-up', true);
    
    console.log('💾 Save results:', { saveResult, signupResult });
    
    // Test retrieval
    const retrievedUser = simpleStorage.getItem('caltrax-user');
    const retrievedSignup = simpleStorage.getItem('caltrax-signed-up');
    
    console.log('📥 Retrieval results:', { retrievedUser, retrievedSignup });
    
    // Test password verification
    const testPassword = 'testpassword123!';
    const hashedTestPassword = hashPassword(testPassword);
    const passwordMatch = retrievedUser?.password === hashedTestPassword;
    
    console.log('🔐 Password test:', {
      originalPassword: testPassword,
      hashedPassword: hashedTestPassword,
      storedPassword: retrievedUser?.password,
      passwordsMatch: passwordMatch
    });

    const testResults = {
      accountCreation: {
        saveUser: saveResult,
        saveSignup: signupResult,
        retrievedUser: !!retrievedUser,
        retrievedSignup: !!retrievedSignup,
        userDataIntact: JSON.stringify(retrievedUser) === JSON.stringify(testAccount),
        profileIntact: JSON.stringify(retrievedUser?.profile) === JSON.stringify(testAccount.profile)
      },
      passwordVerification: {
        passwordMatch,
        hashedCorrectly: hashedTestPassword.length > 0,
        storedPasswordExists: !!retrievedUser?.password
      },
      localStorage: {
        userDataExists: !!localStorage.getItem('caltrax-user'),
        signupDataExists: !!localStorage.getItem('caltrax-signed-up'),
        dataIsString: typeof localStorage.getItem('caltrax-user') === 'string',
        canParseUserData: (() => {
          try {
            JSON.parse(localStorage.getItem('caltrax-user') || '{}');
            return true;
          } catch {
            return false;
          }
        })()
      }
    };

    setDebugInfo(debug);
    setTestResults(testResults);
    
    console.log('📊 Debug results:', debug);
    console.log('✅ Test results:', testResults);
  };

  const clearTestData = () => {
    localStorage.removeItem('caltrax-user');
    localStorage.removeItem('caltrax-signed-up');
    setDebugInfo({});
    setTestResults({});
    console.log('🗑️ Test data cleared');
  };

  useEffect(() => {
    runDebugCheck();
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="bg-zinc-900 border-zinc-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-white flex justify-between items-center">
            Account Debugger
            <Button variant="ghost" size="sm" onClick={onClose} className="text-zinc-400 hover:text-white">
              ✕
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 mb-4">
            <Button onClick={runDebugCheck} className="bg-blue-600 hover:bg-blue-700">
              🔍 Run Debug Check
            </Button>
            <Button onClick={clearTestData} className="bg-red-600 hover:bg-red-700">
              🗑️ Clear Test Data
            </Button>
          </div>

          {Object.keys(testResults).length > 0 && (
            <div className="space-y-4">
              <h3 className="text-white text-lg font-semibold">Test Results</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-zinc-800 border-zinc-700">
                  <CardHeader>
                    <CardTitle className="text-sm text-zinc-300">Account Creation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Save User:</span>
                      <span className={testResults.accountCreation?.saveUser ? 'text-green-400' : 'text-red-400'}>
                        {testResults.accountCreation?.saveUser ? '✅' : '❌'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Save Signup:</span>
                      <span className={testResults.accountCreation?.saveSignup ? 'text-green-400' : 'text-red-400'}>
                        {testResults.accountCreation?.saveSignup ? '✅' : '❌'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Retrieve User:</span>
                      <span className={testResults.accountCreation?.retrievedUser ? 'text-green-400' : 'text-red-400'}>
                        {testResults.accountCreation?.retrievedUser ? '✅' : '❌'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Retrieve Signup:</span>
                      <span className={testResults.accountCreation?.retrievedSignup ? 'text-green-400' : 'text-red-400'}>
                        {testResults.accountCreation?.retrievedSignup ? '✅' : '❌'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>User Data Intact:</span>
                      <span className={testResults.accountCreation?.userDataIntact ? 'text-green-400' : 'text-red-400'}>
                        {testResults.accountCreation?.userDataIntact ? '✅' : '❌'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Profile Intact:</span>
                      <span className={testResults.accountCreation?.profileIntact ? 'text-green-400' : 'text-red-400'}>
                        {testResults.accountCreation?.profileIntact ? '✅' : '❌'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-800 border-zinc-700">
                  <CardHeader>
                    <CardTitle className="text-sm text-zinc-300">Password Verification</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Password Match:</span>
                      <span className={testResults.passwordVerification?.passwordMatch ? 'text-green-400' : 'text-red-400'}>
                        {testResults.passwordVerification?.passwordMatch ? '✅' : '❌'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hashed Correctly:</span>
                      <span className={testResults.passwordVerification?.hashedCorrectly ? 'text-green-400' : 'text-red-400'}>
                        {testResults.passwordVerification?.hashedCorrectly ? '✅' : '❌'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stored Password Exists:</span>
                      <span className={testResults.passwordVerification?.storedPasswordExists ? 'text-green-400' : 'text-red-400'}>
                        {testResults.passwordVerification?.storedPasswordExists ? '✅' : '❌'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-800 border-zinc-700">
                  <CardHeader>
                    <CardTitle className="text-sm text-zinc-300">LocalStorage</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>User Data Exists:</span>
                      <span className={testResults.localStorage?.userDataExists ? 'text-green-400' : 'text-red-400'}>
                        {testResults.localStorage?.userDataExists ? '✅' : '❌'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Signup Data Exists:</span>
                      <span className={testResults.localStorage?.signupDataExists ? 'text-green-400' : 'text-red-400'}>
                        {testResults.localStorage?.signupDataExists ? '✅' : '❌'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Data Is String:</span>
                      <span className={testResults.localStorage?.dataIsString ? 'text-green-400' : 'text-red-400'}>
                        {testResults.localStorage?.dataIsString ? '✅' : '❌'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Can Parse Data:</span>
                      <span className={testResults.localStorage?.canParseUserData ? 'text-green-400' : 'text-red-400'}>
                        {testResults.localStorage?.canParseUserData ? '✅' : '❌'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {Object.keys(debugInfo).length > 0 && (
            <div className="space-y-4">
              <h3 className="text-white text-lg font-semibold">Raw Debug Data</h3>
              <pre className="bg-zinc-800 p-4 rounded text-xs text-zinc-300 overflow-x-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountDebugger;

