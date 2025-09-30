// Security utilities for CalTrax AI
import CryptoJS from 'crypto-js';

// Generate a secure key for encryption (in production, this should come from environment)
const ENCRYPTION_KEY = process.env.REACT_APP_ENCRYPTION_KEY || 'caltrax-secure-key-2024';

// Encrypt sensitive data
export const encryptData = (data) => {
  try {
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    return null;
  }
};

// Decrypt sensitive data
export const decryptData = (encryptedData) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
};

// Hash password (for additional security)
export const hashPassword = (password) => {
  return CryptoJS.SHA256(password + ENCRYPTION_KEY).toString();
};

// Sanitize user input
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

// Validate email format
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
export const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  // Debug logging
  console.log('Password validation for:', password);
  console.log('Length:', password.length, '>=', minLength, '=', password.length >= minLength);
  console.log('Has uppercase:', hasUpperCase);
  console.log('Has lowercase:', hasLowerCase);
  console.log('Has numbers:', hasNumbers);
  console.log('Has special char:', hasSpecialChar);
  console.log('Special char test result:', /[!@#$%^&*(),.?":{}|<>]/.test(password));
  
  return {
    isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
    requirements: {
      minLength: password.length >= minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar
    }
  };
};

// Generate secure session token
export const generateSessionToken = () => {
  return CryptoJS.lib.WordArray.random(32).toString();
};

// Mask sensitive data for logging
export const maskSensitiveData = (data) => {
  const masked = { ...data };
  
  if (masked.email) {
    const [local, domain] = masked.email.split('@');
    masked.email = `${local.substring(0, 2)}***@${domain}`;
  }
  
  if (masked.customerId) {
    masked.customerId = `cus_***${masked.customerId.slice(-4)}`;
  }
  
  if (masked.subscriptionId) {
    masked.subscriptionId = `sub_***${masked.subscriptionId.slice(-4)}`;
  }
  
  return masked;
};

// Secure storage with encryption and Safari iOS compatibility
export const secureStorage = {
  setItem: (key, value) => {
    try {
      console.log(`🔐 SecureStorage setItem called for key: ${key}`, value);
      const encrypted = encryptData(value);
      if (!encrypted) {
        console.error('❌ Encryption failed for key:', key);
        return false;
      }
      
      // Check if localStorage is available (Safari private mode)
      if (typeof Storage === 'undefined' || !localStorage) {
        console.warn('localStorage not available, using sessionStorage');
        sessionStorage.setItem(key, encrypted);
        console.log('✅ Data saved to sessionStorage');
        return true;
      }
      
      // Try localStorage first
      localStorage.setItem(key, encrypted);
      console.log('✅ Data saved to localStorage');
      
      // Verify the write worked (Safari iOS sometimes fails silently)
      const verification = localStorage.getItem(key);
      if (!verification) {
        console.warn('localStorage write failed, falling back to sessionStorage');
        sessionStorage.setItem(key, encrypted);
        console.log('✅ Data saved to sessionStorage (fallback)');
      }
      
      return true;
    } catch (error) {
      console.error('Secure storage error:', error);
      // Fallback to sessionStorage for Safari private mode
      try {
        const encrypted = encryptData(value);
        if (encrypted) {
          sessionStorage.setItem(key, encrypted);
          console.log('✅ Data saved to sessionStorage (error fallback)');
          return true;
        }
        return false;
      } catch (fallbackError) {
        console.error('Fallback storage also failed:', fallbackError);
        return false;
      }
    }
  },
  
  getItem: (key) => {
    try {
      console.log(`🔍 SecureStorage getItem called for key: ${key}`);
      // Try localStorage first
      let encrypted = localStorage.getItem(key);
      if (!encrypted) {
        // Fallback to sessionStorage
        encrypted = sessionStorage.getItem(key);
        console.log(`📱 Data retrieved from sessionStorage for key: ${key}`);
      } else {
        console.log(`💾 Data retrieved from localStorage for key: ${key}`);
      }
      
      if (encrypted) {
        const decrypted = decryptData(encrypted);
        console.log(`✅ Data decrypted successfully for key: ${key}`, decrypted);
        return decrypted;
      }
      console.log(`❌ No encrypted data found for key: ${key}`);
      return null;
    } catch (error) {
      console.error('Secure storage error:', error);
      return null;
    }
  },
  
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Secure storage error:', error);
      return false;
    }
  }
};

// Rate limiting for API calls
const rateLimitMap = new Map();

export const rateLimit = (key, maxRequests = 5, windowMs = 60000) => {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, []);
  }
  
  const requests = rateLimitMap.get(key);
  const validRequests = requests.filter(time => time > windowStart);
  
  if (validRequests.length >= maxRequests) {
    return false; // Rate limit exceeded
  }
  
  validRequests.push(now);
  rateLimitMap.set(key, validRequests);
  return true;
};

// CSRF protection
export const generateCSRFToken = () => {
  return CryptoJS.lib.WordArray.random(32).toString();
};

// Input validation
export const validateUserInput = (input) => {
  const errors = [];
  
  if (input.email && !validateEmail(input.email)) {
    errors.push('Invalid email format');
  }
  
  if (input.password) {
    const passwordValidation = validatePassword(input.password);
    if (!passwordValidation.isValid) {
      errors.push('Password does not meet security requirements');
    }
  }
  
  // Check for SQL injection patterns
  const sqlPatterns = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi;
  const inputString = JSON.stringify(input);
  if (sqlPatterns.test(inputString)) {
    errors.push('Invalid input detected');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Admin authentication and authorization
const ADMIN_EMAILS = [
  'support@caltrax.ai',
  // Add more admin emails here
];

// Admin password hash (in production, this should be stored securely on backend)
const ADMIN_PASSWORD_HASH = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92'; // "Milkdud123!" hashed

export const isAdmin = (user) => {
  if (!user || !user.email) return false;
  return ADMIN_EMAILS.includes(user.email.toLowerCase());
};

// Verify admin credentials
export const verifyAdminCredentials = (email, password) => {
  const isAdminEmail = ADMIN_EMAILS.includes(email.toLowerCase());
  const isCorrectPassword = hashPassword(password) === ADMIN_PASSWORD_HASH;
  return isAdminEmail && isCorrectPassword;
};

export const hasAdminAccess = () => {
  try {
    // Check for active admin session first
    const adminSession = secureStorage.getItem('admin-session');
    if (adminSession && adminSession.isAdmin) {
      // Check if session is still valid (24 hours)
      const sessionTime = new Date(adminSession.loginTime);
      const now = new Date();
      const hoursDiff = (now - sessionTime) / (1000 * 60 * 60);
      
      if (hoursDiff < 24) {
        return true;
      } else {
        // Session expired, clear it
        secureStorage.removeItem('admin-session');
        return false;
      }
    }
    
    // Fallback to checking user admin status
    const user = secureStorage.getItem('caltrax-user');
    return isAdmin(user);
  } catch (error) {
    console.error('Error checking admin access:', error);
    return false;
  }
};

// Generate admin session token
export const generateAdminToken = () => {
  return CryptoJS.lib.WordArray.random(64).toString();
};

// Validate admin session
export const validateAdminSession = (token) => {
  // In production, this would validate against a secure backend
  // For now, we'll check if the user is an admin
  return hasAdminAccess();
};
