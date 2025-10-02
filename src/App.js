import React, { useState, useEffect, useRef } from 'react';
import { ClerkProvider, useUser, useAuth } from '@clerk/clerk-react';
import FoodLensDemo from './components/FoodLensDemo';
import LandingPage from './components/LandingPage';
import SimpleSignupPage from './components/SimpleSignupPage';
import UserSignIn from './components/UserSignIn';
import MacroDashboard from './components/MacroDashboard';
import UserProfile from './components/UserProfile';
import PaymentPage from './components/PaymentPage';
import SuccessPage from './components/SuccessPage';
import MealPlan from './components/MealPlan';
import WorkoutPlan from './components/WorkoutPlan';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import SubscriptionManagement from './components/SubscriptionManagement';
import AuthCallback from './components/AuthCallback';
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

  // Track if we've already initialized to prevent re-initialization
  const hasInitialized = useRef(false);

  // Fallback to prevent infinite loading if Clerk fails to load
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isLoaded) {
        setError('Authentication timed out. Please refresh the page.');
        setCurrentView('error');
        setIsLoading(false);
      }
    }, 10000); // 10 seconds
    return () => clearTimeout(timeout);
  }, [isLoaded]);
  
  // Check if we're on the auth callback route
  useEffect(() => {
    if (window.location.pathname === '/auth/callback') {
      setCurrentView('auth-callback');
      setIsLoading(false);
    }
  }, []);

  // Check environment variables first
  useEffect(() => {
    console.log('🔍 === ENVIRONMENT CHECK ===');
    console.log('REACT_APP_SUPABASE_URL:', process.env.REACT_APP_SUPABASE_URL ? 'Present' : 'Missing');
    console.log('REACT_APP_SUPABASE_ANON_KEY:', process.env.REACT_APP_SUPABASE_ANON_KEY ? 'Present' : 'Missing');
    console.log('REACT_APP_CLERK_PUBLISHABLE_KEY:', process.env.REACT_APP_CLERK_PUBLISHABLE_KEY ? 'Present' : 'Missing');
    
    if (!process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_ANON_KEY) {
      setError('Missing Supabase environment variables. Please check your configuration.');
      setCurrentView('error');
      setIsLoading(false);
      return;
    }
  }, []);

  // Initialize app when Clerk loads
  useEffect(() => {
    if (!isLoaded) {
      console.log('Clerk still loading...');
      return;
    }

    console.log('=== CLERK LOADED ===');
    console.log('isSignedIn:', isSignedIn);
    console.log('user:', user);

    const initializeApp = async () => {
      try {
        if (isSignedIn && user) {
          // Check URL for success page
          const urlParams = new URLSearchParams(window.location.search);
          const sessionId = urlParams.get('session_id');
          
          if (sessionId) {
            // User just completed payment
            console.log('Payment completed, showing success page');
            setCurrentView('success');
            return;
          }

          // Check subscription status
          const hasPaid = user.unsafeMetadata?.hasPaid;
          const profile = user.unsafeMetadata?.caltraxProfile;
          const onboardingComplete = user.unsafeMetadata?.onboardingComplete;
          
          console.log('User status:', { hasPaid, onboardingComplete });
          
          if (!hasPaid) {
            // User signed up but hasn't paid
            console.log('User needs to pay first');
            setCurrentView('payment');
          } else if (!onboardingComplete || !profile) {
            // User paid but hasn't completed profile
            console.log('User needs profile');
            setCurrentView('profile');
          } else {
            // User is fully set up
            console.log('User ready, going to app');
            setCurrentView('app');
            setProfileCompleted(true);
          }
        } else {
          console.log('No user signed in, showing landing');
          setCurrentView('landing');
        }
      } catch (error) {
        console.error('Init error:', error);
        setCurrentView('landing');
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [isLoaded, isSignedIn, user]);

  // FIXED: Move view correction logic to useEffect to prevent infinite re-renders
  useEffect(() => {
    // Prevent redirect if profile was just completed
    if (profileCompleted && currentView === 'landing') {
      console.log('Preventing redirect - profile completed but view is landing, forcing to app');
      setCurrentView('app');
    }

    // Additional safety check - if user has profile but view is not app, fix it
    if (user?.unsafeMetadata?.caltraxProfile && currentView !== 'app' && currentView !== 'profile' && currentView !== 'dashboard' && currentView !== 'mealplan' && currentView !== 'workout') {
      console.log('User has profile but wrong view, correcting to app view');
      setCurrentView('app');
      setProfileCompleted(true);
    }
  }, [profileCompleted, currentView, user]);

  const handleGetStarted = () => {
    setCurrentView('signup');
  };

  const handleShowSignIn = () => {
    setCurrentView('signin');
  };

  const handleSignIn = async (userData) => {
    console.log('🔍 === HANDLE SIGN IN DEBUG ===');
    console.log('handleSignIn - userData:', userData);
    
    // Double-check that the user data is complete
    if (!userData || !userData.email) {
      console.error('Invalid user data received in handleSignIn');
      return;
    }
    
    // Check if user has completed profile
    if (userData.profile) {
      console.log('User has profile, going to app');
      setCurrentView('app');
      setProfileCompleted(true);
    } else {
      console.log('User needs to complete profile, going to profile page');
      setCurrentView('profile');
      setProfileCompleted(false);
    }
  };

  const handleSignup = (userData) => {
    console.log('handleSignup called with:', userData);
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
    
    try {
      if (!user) {
        console.error('❌ No Clerk user available');
        return;
      }

      const profileData = updatedUser.profile;
      
      if (!profileData || !profileData.calories || !profileData.macros) {
        console.error('❌ Invalid profile data:', profileData);
        return;
      }

      console.log('💾 Saving profile to Clerk metadata:', profileData);

      // Save to Clerk's unsafeMetadata
      await user.update({
        unsafeMetadata: {
          caltraxProfile: {
            height: profileData.height,
            weight: profileData.weight,
            age: profileData.age,
            gender: profileData.gender,
            activityLevel: profileData.activityLevel,
            goals: profileData.goals,
            dietaryRestrictions: profileData.dietaryRestrictions,
            calories: profileData.calories,
            macros: {
              protein: profileData.macros.protein,
              fat: profileData.macros.fat,
              carbs: profileData.macros.carbs
            },
            completedAt: profileData.completedAt
          },
          onboardingComplete: true
        }
      });

      console.log('✅ Profile saved to Clerk metadata successfully');
      console.log('Profile calories:', profileData.calories);
      console.log('Profile macros:', profileData.macros);

      // Also save to Supabase
      try {
        await paymentService.createOrUpdateUserProfile(
          user.id, 
          user.emailAddresses?.[0]?.emailAddress || user.primaryEmailAddress?.emailAddress, 
          profileData
        );
        console.log('✅ Profile saved to Supabase');
      } catch (dbError) {
        console.error('⚠️ Supabase save failed (non-critical):', dbError);
      }
      
      // Update UI state
      setProfileCompleted(true);
      setCurrentView('app');
      
      console.log('✅ Profile complete - redirecting to app');
    } catch (error) {
      console.error('❌ Error saving profile:', error);
      // Still proceed to app even if save fails
      setProfileCompleted(true);
      setCurrentView('app');
    }
    
    console.log('🔍 === HANDLE PROFILE COMPLETE DEBUG END ===');
  };

  const handleLogout = async () => {
    console.log('🔍 === LOGOUT DEBUG START ===');
    
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
    setProfileCompleted(false);
    setCurrentView('landing');
    setHasPaid(false);
    setPlan(null);
    setTrialUsed(false);
    hasInitialized.current = false;
    
    console.log('✅ User logged out - redirected to landing page');
  };

  const handleEmailVerified = (userData) => {
    console.log('✅ Email verified, setting user and redirecting to app');
    setCurrentView('app');
    setProfileCompleted(true);
  };

  const handleEmailVerificationError = (error) => {
    console.error('❌ Email verification error:', error);
    setCurrentView('landing');
  };

  const handleShowAdmin = () => {
    if (hasAdminAccess()) {
      setCurrentView('admin');
    } else {
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
    setCurrentView('dashboard');
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
            <p>Please check your environment variables:</p>
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

  return (
    <div className="App">
      {currentView === 'landing' && <LandingPage onGetStarted={handleGetStarted} onShowSignIn={handleShowSignIn} />}
      {currentView === 'signup' && <SimpleSignupPage onSignup={handleSignup} onShowSignIn={handleShowSignIn} />}
      {currentView === 'signin' && <UserSignIn onSignIn={handleSignIn} onBackToSignup={() => setCurrentView('signup')} />}
      {currentView === 'payment' && (
        <PaymentPage 
          user={user}
        />
      )}
      {currentView === 'success' && (
        <SuccessPage 
          user={user}
          onContinue={() => setCurrentView('profile')}
        />
      )}
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
      
      {showAdminLogin && (
        <AdminLogin
          onSuccess={handleAdminLoginSuccess}
          onCancel={handleAdminLoginCancel}
        />
      )}
      
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