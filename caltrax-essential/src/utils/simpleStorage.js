// Simple storage without encryption for debugging
export const simpleStorage = {
  setItem: (key, value) => {
    try {
      console.log(`💾 SimpleStorage setItem called for key: ${key}`, value);
      
      // Handle different value types
      let jsonValue;
      if (typeof value === 'string') {
        jsonValue = value;
      } else {
        jsonValue = JSON.stringify(value);
      }
      
      // Save to localStorage
      localStorage.setItem(key, jsonValue);
      
      // Also save to sessionStorage as backup
      sessionStorage.setItem(key, jsonValue);
      
      // Verify the write worked
      const verification = localStorage.getItem(key);
      if (verification === jsonValue) {
        console.log('✅ Data saved to localStorage (simple) - verified');
        return true;
      } else {
        console.error('❌ Data verification failed after write');
        console.error('Expected:', jsonValue);
        console.error('Got:', verification);
        return false;
      }
    } catch (error) {
      console.error('Simple storage setItem error:', error);
      return false;
    }
  },
  
  getItem: (key) => {
    try {
      console.log(`🔍 SimpleStorage getItem called for key: ${key}`);
      
      // Try localStorage first
      let data = localStorage.getItem(key);
      let source = 'localStorage';
      
      // If not found in localStorage, try sessionStorage
      if (!data) {
        data = sessionStorage.getItem(key);
        source = 'sessionStorage';
      }
      
      if (data) {
        // Try to parse as JSON first
        try {
          const parsed = JSON.parse(data);
          console.log(`✅ Data retrieved successfully from ${source} for key: ${key}`, parsed);
          return parsed;
        } catch (parseError) {
          // If parsing fails, return the raw string
          console.log(`✅ Raw data retrieved from ${source} for key: ${key}`, data);
          return data;
        }
      }
      
      console.log(`❌ No data found for key: ${key} in both localStorage and sessionStorage`);
      return null;
    } catch (error) {
      console.error('Simple storage getItem error:', error);
      return null;
    }
  },
  
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
      console.log(`🗑️ Data removed for key: ${key} from both localStorage and sessionStorage`);
      return true;
    } catch (error) {
      console.error('Simple storage removeItem error:', error);
      return false;
    }
  },
  
  // Debug function to check all storage
  debug: () => {
    console.log('🔍 === SIMPLE STORAGE DEBUG ===');
    console.log('localStorage caltrax keys:');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('caltrax')) {
        console.log(`  ${key}:`, localStorage.getItem(key));
      }
    }
    console.log('sessionStorage caltrax keys:');
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.includes('caltrax')) {
        console.log(`  ${key}:`, sessionStorage.getItem(key));
      }
    }
    console.log('🔍 === END SIMPLE STORAGE DEBUG ===');
  }
};
