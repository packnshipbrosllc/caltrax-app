import React, { useState, useEffect, useRef } from 'react';
import { ClerkProvider, useUser, useAuth } from '@clerk/clerk-react';
import FoodLensDemo from './components/FoodLensDemo';
import LandingPage from './components/LandingPage';
import SimpleSignupPage from './components/SimpleSignupPage';
import UserSignIn from './components/UserSignIn';
import MacroDashboard from './components/MacroDashboard';
import UserProfile from './components/UserProfile';
import MealPlan from './components/MealPlan';
import WorkoutPlan from './components/WorkoutPlan';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import SubscriptionManagement from './components/SubscriptionManagement';
import AuthCallback from './components/AuthCallback';
import DebugPanel from './components/DebugPanel';
import { secureStorage, hasAdminAccess } from './utils/security';
import { simpleStorage } from './utils/simpleStorage';
import { authService } from './services/authService';
import { paymentService } from './services/paymentService';

// Main App Component with Clerk Integration
function AppContent() {
  const { user, isLoaded } = useUser();
  const { isSignedIn } = useAuth();
  const [currentView, setCurrentView] = useState('landing');
  const [isLoading, setIsLoading] = useState(true);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [showSubscriptionManagement, setShowSubscriptionManagement] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [plan, setPlan] = useState(null);
  const [trialUsed, setTrialUsed] = useState(false);
  const [error, setError] = useState(null);

  // Check if we're on the auth callback route
  useEffect(() => {
    if (window.location.pathname === '/auth/callback') {
      setCurrentView('auth-callback');
      setIsLoading(false);
    }
  }, []);

  // Track if we've already initialized to prevent re-initialization
  const hasInitialized = useRef(false);

  // Check environment variables first
  useEffect(() => {
    console.log('🔍 === ENVIRONMENT CHECK ===');
    console.log('REACT_APP_SUPABASE_URL:', process.env.REACT_APP_SUPABASE_URL ? 'Present' : 'Missing');
    console.log('REACT_APP_SUPABASE_ANON_KEY:', process.env.REACT_APP_SUPABASE_ANON_KEY ? 'Present' : 'Missing');
    console.log('REACT_APP_CLERK_PUBLISHABLE_KEY:', process.env.REACT_APP_CLERK_PUBLISHABLE_KEY ? 'Present' : 'Missing');
    
    if (!process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_ANON_KEY) {
      setError('Missing Supabase environment variables. Please check your Vercel configuration.');
      setCurrentView('error');
      setIsLoading(false);
      return;
    }
  }, []);

  // Initialize app when Clerk loads
  useEffect(() => {
    if (!isLoaded) {
      console.log('⏳ Clerk still loading...');
      return;
    }

    console.log('🔍 === CLERK LOADED ===');
    console.log('isSignedIn:', isSignedIn);
    console.log('user:', user);

    const initializeApp = async () => {
      try {
        if (isSignedIn && user) {
          console.log('✅ User signed in with Clerk:', user.id);
          
          // Check payment status from database with timeout
          try {
            console.log('🔍 Checking payment status...');
            const paymentStatusPromise = paymentService.checkPaymentStatus(user.id);
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Payment check timeout')), 5000)
            );
            
            const paymentStatus = await Promise.race([paymentStatusPromise, timeoutPromise]);
            console.log('💳 Payment status:', paymentStatus);
            
            setHasPaid(paymentStatus.hasPaid);
            setPlan(paymentStatus.plan);
            setTrialUsed(paymentStatus.trialUsed);
            
            // Check if user has completed profile
            const profileData = user.unsafeMetadata?.caltraxProfile;
            if (profileData) {
              console.log('✅ User has profile, going to app');
              setCurrentView('app');
              setProfileCompleted(true);
            } else {
              console.log('📝 User needs profile setup');
              setCurrentView('profile');
            }
          } catch (error) {
            console.error('❌ Error checking payment status:', error);
            console.error('❌ This is a critical error - app requires Supabase to function');
            
            // Show error message instead of falling back to local storage
            setError('Database connection failed. Please check your Supabase configuration.');
            setCurrentView('error');
            return;
          }
        } else {
          console.log('🚪 User not signed in, showing landing page');
          setCurrentView('landing');
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        setCurrentView('landing');
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [isLoaded, isSignedIn, user]);

  const handleGetStarted = () => {
    setCurrentView('signup');
  };

  const handleShowSignIn = () => {
    setCurrentView('signin');
  };

  const handleSignIn = async (userData) => {
    console.log('🔍 === HANDLE SIGN IN DEBUG ===');
    console.log('handleSignIn - userData:', userData);
    console.log('handleSignIn - userData.profile:', userData?.profile);
    console.log('handleSignIn - userData.profile type:', typeof userData?.profile);
    console.log('handleSignIn - userData.profile.calories:', userData?.profile?.calories);
    console.log('handleSignIn - userData.profile.macros:', userData?.profile?.macros);
    
    // Double-check that the user data is complete
    if (!userData || !userData.email) {
      console.error('Invalid user data received in handleSignIn');
      return;
    }
    
    // If user doesn't have profile data, try to reload it from Supabase
    if (!userData.profile && userData.id) {
      console.log('🔍 No profile data found, attempting to reload from Supabase...');
      try {
        const freshUser = await authService.getCurrentUser();
        if (freshUser && freshUser.profile) {
          console.log('✅ Reloaded profile from Supabase:', freshUser.profile);
          userData.profile = freshUser.profile;
          // Update local storage with fresh data
          simpleStorage.setItem('caltrax-user', userData);
        }
      } catch (error) {
        console.error('❌ Failed to reload profile from Supabase:', error);
      }
    }
    
    // Verify the data is properly stored
    const verifyStored = simpleStorage.getItem('caltrax-user');
    console.log('handleSignIn - Verifying stored data:', verifyStored);
    console.log('handleSignIn - Stored data matches:', JSON.stringify(verifyStored) === JSON.stringify(userData));
    
    // User data is handled by Clerk, no need to set it manually
    
    // Check if user has completed profile
    if (userData.profile) {
      console.log('User has profile, going to app');
      console.log('🔍 Setting currentView to app and profileCompleted to true');
      setCurrentView('app');
      setProfileCompleted(true);
    } else {
      console.log('User needs to complete profile, going to profile page');
      console.log('🔍 Setting currentView to profile and profileCompleted to false');
      setCurrentView('profile');
      setProfileCompleted(false);
    }
    console.log('🔍 === END HANDLE SIGN IN DEBUG ===');
  };

  const handleSignup = (userData) => {
    console.log('handleSignup called with:', userData);
    // User data is handled by Clerk, no need to set it manually
    // Check if user has completed profile
    if (userData.profile) {
      console.log('User has profile, going to app');
      setCurrentView('app');
    } else {
      console.log('User needs to complete profile, going to profile page');
      setCurrentView('profile');
    }
  };

  const handleProfileComplete = async (updatedUser) => {
    console.log('🔍 === HANDLE PROFILE COMPLETE DEBUG START ===');
    console.log('handleProfileComplete called with:', updatedUser);
    console.log('Current view before profile complete:', currentView);
    console.log('Current user before profile complete:', user);
    console.log('Profile completed flag before:', profileCompleted);
    
    try {
      // Save profile to Clerk metadata if user is signed in
      if (user && user.id) {
        console.log('💾 Saving profile to Clerk metadata...');
        await paymentService.createOrUpdateUserProfile(user.id, user.emailAddresses?.[0]?.emailAddress || user.primaryEmailAddress?.emailAddress || '', updatedUser.profile);
        console.log('✅ Profile saved to Clerk metadata');
      }
      
      // Update user and view immediately
      // User data is handled by Clerk, no need to set it manually
      setCurrentView('app');
      setProfileCompleted(true);
      
      console.log('Profile complete - set to app view and profileCompleted flag');
      console.log('Updated user:', updatedUser);
    } catch (error) {
      console.error('❌ Error saving profile to Clerk:', error);
      // Still update UI even if Clerk save fails
      // User data is handled by Clerk, no need to set it manually
      setCurrentView('app');
      setProfileCompleted(true);
    }
    
    console.log('🔍 === HANDLE PROFILE COMPLETE DEBUG END ===');
  };

  const handleLogout = async () => {
    console.log('🔍 === LOGOUT DEBUG START ===');
    console.log('🔍 Logout called - this should not happen after profile completion!');
    
    try {
      // Sign out from Supabase
      await authService.signOut();
      console.log('✅ Signed out from Supabase');
    } catch (error) {
      console.error('❌ Error signing out from Supabase:', error);
    }
    
    // Clear all user data and session
    simpleStorage.removeItem('caltrax-user');
    simpleStorage.removeItem('caltrax-signed-up');
    
    // Reset app state
    // User data is handled by Clerk, no need to set it manually
    setProfileCompleted(false);
    setCurrentView('landing');
    setHasPaid(false);
    setPlan(null);
    setTrialUsed(false);
    
    console.log('✅ User logged out - redirected to landing page');
    console.log('🔍 === LOGOUT DEBUG END ===');
  };

  const handleEmailVerified = (userData) => {
    console.log('✅ Email verified, setting user and redirecting to app');
    // User data is handled by Clerk, no need to set it manually
    setCurrentView('app');
    setProfileCompleted(true);
  };

  const handleEmailVerificationError = (error) => {
    console.error('❌ Email verification error:', error);
    setCurrentView('landing');
  };

  const handleShowAdmin = () => {
    // Check admin access before allowing navigation
    if (hasAdminAccess()) {
      setCurrentView('admin');
    } else {
      // Show admin login modal
      setShowAdminLogin(true);
    }
  };

  const handleAdminLoginSuccess = (adminSession) => {
    setShowAdminLogin(false);
    setCurrentView('admin');
  };

  const handleAdminLoginCancel = () => {
    setShowAdminLogin(false);
  };

  const handleShowDashboard = () => {
    console.log('🔍 === HANDLE SHOW DASHBOARD DEBUG ===');
    console.log('Current user before dashboard:', user);
    
    // Reload user data from storage to ensure it's fresh
    const storedUser = simpleStorage.getItem('caltrax-user');
    console.log('Stored user data:', storedUser);
    
    if (storedUser && storedUser !== user) {
      console.log('Updating user data from storage');
      // User data is handled by Clerk, no need to set it manually
    }
    
    setCurrentView('dashboard');
    console.log('🔍 === END HANDLE SHOW DASHBOARD DEBUG ===');
  };

  const handleBackToApp = () => {
    setCurrentView('app');
  };

  const handleAddFood = () => {
    setCurrentView('app');
  };

  const handleShowMealPlan = () => {
    console.log('handleShowMealPlan called');
    setCurrentView('mealplan');
  };

  const handleShowWorkout = () => {
    console.log('handleShowWorkout called');
    setCurrentView('workout');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center">
        <div className="text-white text-xl text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <div>Loading...</div>
          <div className="text-sm text-gray-400 mt-2">
            {!isLoaded ? 'Initializing authentication...' : 'Loading app...'}
          </div>
        </div>
      </div>
    );
  }

  // Debug render state
  console.log('🔍 === RENDER DEBUG ===');
  console.log('currentView:', currentView);
  console.log('user:', user);
  console.log('profileCompleted:', profileCompleted);
  console.log('user?.profile:', user?.profile);
  console.log('error:', error);

  // Show error screen
  if (currentView === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-950 via-red-900 to-black flex items-center justify-center">
        <div className="text-white text-center max-w-md mx-auto p-6">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-4">Configuration Error</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <div className="text-sm text-gray-400">
            <p>Please check your Vercel environment variables:</p>
            <ul className="mt-2 text-left">
              <li>• REACT_APP_SUPABASE_URL</li>
              <li>• REACT_APP_SUPABASE_ANON_KEY</li>
              <li>• REACT_APP_CLERK_PUBLISHABLE_KEY</li>
            </ul>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Prevent redirect if profile was just completed
  if (profileCompleted && currentView === 'landing') {
    console.log('Preventing redirect - profile completed but view is landing, forcing to app');
    setCurrentView('app');
  }

  // Additional safety check - if user has profile but view is not app, fix it
  if (user?.profile && currentView !== 'app' && currentView !== 'profile') {
    console.log('User has profile but wrong view, correcting to app view');
    setCurrentView('app');
    setProfileCompleted(true);
  }

  return (
    <div className="App">
      <DebugPanel currentView={currentView} user={user} profileCompleted={profileCompleted} />
      {currentView === 'landing' && <LandingPage onGetStarted={handleGetStarted} onShowSignIn={handleShowSignIn} />}
      {currentView === 'signup' && <SimpleSignupPage onSignup={handleSignup} onShowSignIn={handleShowSignIn} />}
      {currentView === 'signin' && <UserSignIn onSignIn={handleSignIn} onBackToSignup={() => setCurrentView('signup')} />}
      {currentView === 'profile' && (
        <UserProfile 
          onComplete={handleProfileComplete}
          user={user}
        />
      )}
      {currentView === 'app' && (
        <FoodLensDemo 
          onLogout={handleLogout} 
          onShowDashboard={handleShowDashboard}
          onShowMealPlan={handleShowMealPlan}
          onShowSubscriptionManagement={() => setShowSubscriptionManagement(true)}
          user={user}
        />
      )}
      {currentView === 'dashboard' && (
        <MacroDashboard 
          onBack={handleBackToApp}
          onAddFood={handleAddFood}
          onShowMealPlan={handleShowMealPlan}
          onShowWorkout={handleShowWorkout}
          user={user}
        />
      )}
      {currentView === 'mealplan' && (
        <MealPlan 
          onBack={handleBackToDashboard}
          user={user}
        />
      )}
      {currentView === 'workout' && (
        <WorkoutPlan 
          onBack={handleBackToDashboard}
          user={user}
        />
      )}
      {/* Auth Callback - Email Verification */}
      {currentView === 'auth-callback' && (
        <AuthCallback
          onVerified={handleEmailVerified}
          onError={handleEmailVerificationError}
        />
      )}

      {currentView === 'admin' && hasAdminAccess() && (
        <AdminDashboard 
          onBack={() => setCurrentView('app')}
        />
      )}
      
      {/* Admin Login Modal */}
      {showAdminLogin && (
        <AdminLogin
          onSuccess={handleAdminLoginSuccess}
          onCancel={handleAdminLoginCancel}
        />
      )}
      
      {/* Subscription Management Modal */}
      {showSubscriptionManagement && (
        <SubscriptionManagement
          onClose={() => setShowSubscriptionManagement(false)}
          user={user}
        />
      )}
      
      
    </div>
  );
}

// Main App with Clerk Provider
function App() {
  const clerkPublishableKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;
  
  if (!clerkPublishableKey) {
    console.error('❌ Missing REACT_APP_CLERK_PUBLISHABLE_KEY environment variable');
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center">
        <div className="text-white text-xl text-center">
          <div>Missing Clerk configuration</div>
          <div className="text-sm text-gray-400 mt-2">Please add REACT_APP_CLERK_PUBLISHABLE_KEY to environment variables</div>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <AppContent />
    </ClerkProvider>
  );
}

export default App;
// Deployment trigger - Mon Sep 29 18:42:54 PDT 2025
