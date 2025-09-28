import React, { useState, useEffect, useRef } from 'react';
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

function App() {
  const [currentView, setCurrentView] = useState('landing'); // 'landing', 'signup', 'signin', 'profile', 'app', 'dashboard', 'mealplan', 'workout', 'admin'
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [showSubscriptionManagement, setShowSubscriptionManagement] = useState(false);

  // Check if we're on the auth callback route
  useEffect(() => {
    if (window.location.pathname === '/auth/callback') {
      setCurrentView('auth-callback');
      setIsLoading(false);
    }
  }, []);

  // Track if we've already initialized to prevent re-initialization
  const hasInitialized = useRef(false);

  // Initialize app on mount only
  useEffect(() => {
    console.log('🔍 === USEEFFECT DEBUG START ===');
    console.log('hasInitialized.current:', hasInitialized.current);
    console.log('profileCompleted:', profileCompleted);
    console.log('currentView:', currentView);
    console.log('user:', user);
    
    // Don't initialize if we've already done it or if profile was just completed
    if (hasInitialized.current || profileCompleted) {
      console.log('Already initialized or profile completed, skipping');
      console.log('🔍 === USEEFFECT DEBUG END (SKIPPED) ===');
      return;
    }
    
    const initializeApp = async () => {
      try {
        console.log('🔍 Initializing app...');
        hasInitialized.current = true;
        
        // Clear old local storage data to start fresh
        console.log('🧹 Clearing old local storage data...');
        simpleStorage.removeItem('caltrax-user');
        simpleStorage.removeItem('caltrax-signed-up');
        simpleStorage.removeItem('caltrax-macros');
        
        // Disable database calls for now to prevent errors
        console.log('⚠️ Database temporarily disabled - using local storage only');
        console.log('⚠️ Clerk integration temporarily disabled - using simple auth');
        
        console.log('✅ Cleared local storage, showing landing page');
        setCurrentView('landing');
        setUser(null);
        setProfileCompleted(false);
      } catch (error) {
        console.error('Error initializing app:', error);
        setCurrentView('landing');
      } finally {
        setIsLoading(false);
      }
    };

    // Initialize immediately
    initializeApp();
    console.log('🔍 === USEEFFECT DEBUG END ===');
  }, [profileCompleted]); // Add profileCompleted as dependency

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
    
    setUser(userData);
    
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
    setUser(userData);
    // Check if user has completed profile
    if (userData.profile) {
      console.log('User has profile, going to app');
      setCurrentView('app');
    } else {
      console.log('User needs to complete profile, going to profile page');
      setCurrentView('profile');
    }
  };

  const handleProfileComplete = (updatedUser) => {
    console.log('🔍 === HANDLE PROFILE COMPLETE DEBUG START ===');
    console.log('handleProfileComplete called with:', updatedUser);
    console.log('Current view before profile complete:', currentView);
    console.log('Current user before profile complete:', user);
    console.log('Profile completed flag before:', profileCompleted);
    
    // Update user and view immediately
    setUser(updatedUser);
    setCurrentView('app');
    setProfileCompleted(true); // Set flag to prevent re-initialization
    
    console.log('Profile complete - set to app view and profileCompleted flag');
    console.log('Updated user:', updatedUser);
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
    setUser(null);
    setProfileCompleted(false);
    setCurrentView('landing');
    
    console.log('✅ User logged out - redirected to landing page');
    console.log('🔍 === LOGOUT DEBUG END ===');
  };

  const handleEmailVerified = (userData) => {
    console.log('✅ Email verified, setting user and redirecting to app');
    setUser(userData);
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
      setUser(storedUser);
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
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Debug render state
  console.log('🔍 === RENDER DEBUG ===');
  console.log('currentView:', currentView);
  console.log('user:', user);
  console.log('profileCompleted:', profileCompleted);
  console.log('user?.profile:', user?.profile);

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

export default App;
