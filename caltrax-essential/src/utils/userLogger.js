// User logging and management utilities
import { secureStorage, maskSensitiveData, validateUserInput } from './security';

// Get all logged users
export const getAllUsers = () => {
  try {
    const users = secureStorage.getItem('caltrax-all-users') || [];
    return users;
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
};

// Get user by email
export const getUserByEmail = (email) => {
  const users = getAllUsers();
  return users.find(user => user.email === email);
};

// Get users by plan
export const getUsersByPlan = (plan) => {
  const users = getAllUsers();
  return users.filter(user => user.plan === plan);
};

// Get users by subscription status
export const getUsersByStatus = (subscribed) => {
  const users = getAllUsers();
  return users.filter(user => user.subscribed === subscribed);
};

// Get trial users
export const getTrialUsers = () => {
  const users = getAllUsers();
  return users.filter(user => user.plan === 'trial' || user.trialEnds);
};

// Get paid users
export const getPaidUsers = () => {
  const users = getAllUsers();
  return users.filter(user => user.plan === 'monthly' || user.plan === 'yearly');
};

// Get user statistics
export const getUserStats = () => {
  const users = getAllUsers();
  
  const stats = {
    total: users.length,
    trial: users.filter(u => u.plan === 'trial').length,
    monthly: users.filter(u => u.plan === 'monthly').length,
    yearly: users.filter(u => u.plan === 'yearly').length,
    subscribed: users.filter(u => u.subscribed).length,
    trialUsers: users.filter(u => u.trialEnds).length,
  };
  
  return stats;
};

// Export user data (for admin purposes)
export const exportUserData = () => {
  const users = getAllUsers();
  const dataStr = JSON.stringify(users, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `caltrax-users-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Clear all user data (admin function)
export const clearAllUserData = () => {
  secureStorage.removeItem('caltrax-all-users');
  secureStorage.removeItem('caltrax-activity-log');
  console.log('All user data cleared');
};

// Log user activity
export const logUserActivity = (email, activity, data = {}) => {
  try {
    const activityLog = secureStorage.getItem('caltrax-activity-log') || [];
    activityLog.push({
      email,
      activity,
      data: maskSensitiveData(data),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    });
    secureStorage.setItem('caltrax-activity-log', activityLog);
  } catch (error) {
    console.error('Error logging user activity:', error);
  }
};

// Get activity log
export const getActivityLog = () => {
  try {
    return secureStorage.getItem('caltrax-activity-log') || [];
  } catch (error) {
    console.error('Error getting activity log:', error);
    return [];
  }
};
