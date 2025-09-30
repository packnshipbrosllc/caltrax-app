// Plan storage and rate limiting utilities
import { simpleStorage } from './simpleStorage';

const PLAN_STORAGE_KEYS = {
  WORKOUT_PLANS: 'caltrax-workout-plans',
  MEAL_PLANS: 'caltrax-meal-plans',
  RATE_LIMITS: 'caltrax-rate-limits'
};

// Rate limiting: once per week per user
const RATE_LIMIT_WEEKS = 1;

export const planStorage = {
  // Check if user can generate a new plan
  canGeneratePlan: (userId, planType) => {
    try {
      const rateLimits = simpleStorage.getItem(PLAN_STORAGE_KEYS.RATE_LIMITS) || {};
      const userLimits = rateLimits[userId] || {};
      const lastGenerated = userLimits[planType];
      
      if (!lastGenerated) {
        return { canGenerate: true, daysUntilNext: 0 };
      }
      
      const lastDate = new Date(lastGenerated);
      const now = new Date();
      const daysDiff = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
      const weeksDiff = Math.floor(daysDiff / 7);
      
      if (weeksDiff >= RATE_LIMIT_WEEKS) {
        return { canGenerate: true, daysUntilNext: 0 };
      }
      
      const daysUntilNext = 7 - (daysDiff % 7);
      return { canGenerate: false, daysUntilNext };
    } catch (error) {
      console.error('Error checking rate limit:', error);
      return { canGenerate: true, daysUntilNext: 0 };
    }
  },

  // Record plan generation
  recordPlanGeneration: (userId, planType) => {
    try {
      const rateLimits = simpleStorage.getItem(PLAN_STORAGE_KEYS.RATE_LIMITS) || {};
      if (!rateLimits[userId]) {
        rateLimits[userId] = {};
      }
      rateLimits[userId][planType] = new Date().toISOString();
      simpleStorage.setItem(PLAN_STORAGE_KEYS.RATE_LIMITS, rateLimits);
      console.log(`Recorded ${planType} generation for user ${userId}`);
    } catch (error) {
      console.error('Error recording plan generation:', error);
    }
  },

  // Save workout plan
  saveWorkoutPlan: (userId, plan) => {
    try {
      const plans = simpleStorage.getItem(PLAN_STORAGE_KEYS.WORKOUT_PLANS) || {};
      if (!plans[userId]) {
        plans[userId] = [];
      }
      
      const planWithMetadata = {
        ...plan,
        id: `workout-${Date.now()}`,
        createdAt: new Date().toISOString(),
        userId
      };
      
      plans[userId].unshift(planWithMetadata); // Add to beginning
      
      // Keep only last 10 plans per user
      if (plans[userId].length > 10) {
        plans[userId] = plans[userId].slice(0, 10);
      }
      
      simpleStorage.setItem(PLAN_STORAGE_KEYS.WORKOUT_PLANS, plans);
      console.log('Workout plan saved:', planWithMetadata);
      return planWithMetadata;
    } catch (error) {
      console.error('Error saving workout plan:', error);
      return null;
    }
  },

  // Save meal plan
  saveMealPlan: (userId, plan) => {
    try {
      const plans = simpleStorage.getItem(PLAN_STORAGE_KEYS.MEAL_PLANS) || {};
      if (!plans[userId]) {
        plans[userId] = [];
      }
      
      const planWithMetadata = {
        ...plan,
        id: `meal-${Date.now()}`,
        createdAt: new Date().toISOString(),
        userId
      };
      
      plans[userId].unshift(planWithMetadata); // Add to beginning
      
      // Keep only last 10 plans per user
      if (plans[userId].length > 10) {
        plans[userId] = plans[userId].slice(0, 10);
      }
      
      simpleStorage.setItem(PLAN_STORAGE_KEYS.MEAL_PLANS, plans);
      console.log('Meal plan saved:', planWithMetadata);
      return planWithMetadata;
    } catch (error) {
      console.error('Error saving meal plan:', error);
      return null;
    }
  },

  // Get user's workout plans
  getWorkoutPlans: (userId) => {
    try {
      const plans = simpleStorage.getItem(PLAN_STORAGE_KEYS.WORKOUT_PLANS) || {};
      return plans[userId] || [];
    } catch (error) {
      console.error('Error getting workout plans:', error);
      return [];
    }
  },

  // Get user's meal plans
  getMealPlans: (userId) => {
    try {
      const plans = simpleStorage.getItem(PLAN_STORAGE_KEYS.MEAL_PLANS) || {};
      return plans[userId] || [];
    } catch (error) {
      console.error('Error getting meal plans:', error);
      return [];
    }
  },

  // Get latest workout plan
  getLatestWorkoutPlan: (userId) => {
    const plans = planStorage.getWorkoutPlans(userId);
    return plans.length > 0 ? plans[0] : null;
  },

  // Get latest meal plan
  getLatestMealPlan: (userId) => {
    const plans = planStorage.getMealPlans(userId);
    return plans.length > 0 ? plans[0] : null;
  },

  // Clear all plans for a user (for testing)
  clearUserPlans: (userId) => {
    try {
      const workoutPlans = simpleStorage.getItem(PLAN_STORAGE_KEYS.WORKOUT_PLANS) || {};
      const mealPlans = simpleStorage.getItem(PLAN_STORAGE_KEYS.MEAL_PLANS) || {};
      const rateLimits = simpleStorage.getItem(PLAN_STORAGE_KEYS.RATE_LIMITS) || {};
      
      delete workoutPlans[userId];
      delete mealPlans[userId];
      delete rateLimits[userId];
      
      simpleStorage.setItem(PLAN_STORAGE_KEYS.WORKOUT_PLANS, workoutPlans);
      simpleStorage.setItem(PLAN_STORAGE_KEYS.MEAL_PLANS, mealPlans);
      simpleStorage.setItem(PLAN_STORAGE_KEYS.RATE_LIMITS, rateLimits);
      
      console.log(`Cleared all plans for user ${userId}`);
    } catch (error) {
      console.error('Error clearing user plans:', error);
    }
  },

  // Debug function
  debug: () => {
    console.log('🔍 === PLAN STORAGE DEBUG ===');
    console.log('Workout plans:', simpleStorage.getItem(PLAN_STORAGE_KEYS.WORKOUT_PLANS));
    console.log('Meal plans:', simpleStorage.getItem(PLAN_STORAGE_KEYS.MEAL_PLANS));
    console.log('Rate limits:', simpleStorage.getItem(PLAN_STORAGE_KEYS.RATE_LIMITS));
    console.log('🔍 === END PLAN STORAGE DEBUG ===');
  }
};

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  window.planStorage = planStorage;
}

