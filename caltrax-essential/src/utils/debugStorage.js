// Debug storage utilities
export const debugStorage = {
  // Check what's actually stored
  checkAllStorage: () => {
    console.log('🔍 === STORAGE DEBUG CHECK ===');
    
    // Check localStorage
    console.log('📦 localStorage contents:');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.includes('caltrax')) {
        console.log(`  ${key}:`, localStorage.getItem(key));
      }
    }
    
    // Check sessionStorage
    console.log('📦 sessionStorage contents:');
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key.includes('caltrax')) {
        console.log(`  ${key}:`, sessionStorage.getItem(key));
      }
    }
    
    // Check specific keys
    console.log('🎯 Specific checks:');
    console.log('  caltrax-user (localStorage):', localStorage.getItem('caltrax-user'));
    console.log('  caltrax-signed-up (localStorage):', localStorage.getItem('caltrax-signed-up'));
    console.log('  caltrax-user (sessionStorage):', sessionStorage.getItem('caltrax-user'));
    console.log('  caltrax-signed-up (sessionStorage):', sessionStorage.getItem('caltrax-signed-up'));
    
    // Test parsing
    try {
      const userData = JSON.parse(localStorage.getItem('caltrax-user') || '{}');
      console.log('  Parsed user data:', userData);
      console.log('  User has profile:', !!userData.profile);
      console.log('  User profile calories:', userData.profile?.calories);
    } catch (e) {
      console.log('  ❌ Failed to parse user data:', e.message);
    }
    
    console.log('🔍 === END STORAGE DEBUG ===');
  },
  
  // Clear all caltrax data
  clearAllCaltraxData: () => {
    console.log('🗑️ Clearing all caltrax data...');
    const keysToRemove = [];
    
    // Find all caltrax keys in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('caltrax')) {
        keysToRemove.push(key);
      }
    }
    
    // Find all caltrax keys in sessionStorage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.includes('caltrax')) {
        keysToRemove.push(key);
      }
    }
    
    // Remove all found keys
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
      console.log(`  Removed: ${key}`);
    });
    
    console.log('✅ All caltrax data cleared');
  },
  
  // Test account creation
  testAccountCreation: () => {
    console.log('🧪 Testing account creation...');
    
    const testAccount = {
      email: 'test@example.com',
      password: 'hashedpassword123',
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
    
    try {
      localStorage.setItem('caltrax-user', JSON.stringify(testAccount));
      localStorage.setItem('caltrax-signed-up', 'true');
      
      console.log('✅ Test account created');
      
      // Verify
      const retrieved = JSON.parse(localStorage.getItem('caltrax-user') || '{}');
      console.log('📥 Retrieved account:', retrieved);
      console.log('📊 Account intact:', JSON.stringify(retrieved) === JSON.stringify(testAccount));
      
      return true;
    } catch (error) {
      console.error('❌ Failed to create test account:', error);
      return false;
    }
  }
};

// Make it available globally for console debugging
if (typeof window !== 'undefined') {
  window.debugStorage = debugStorage;
}

