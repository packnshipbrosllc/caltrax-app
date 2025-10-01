// Payment service for tracking subscriptions and payment status
import { createOrUpdateUser, getUserByClerkId, updateUserPayment, markTrialUsed, hasUsedTrial } from '../lib/database.js';

class PaymentService {
  // Check if user has active subscription
  async checkPaymentStatus(clerkUserId) {
    try {
      if (!clerkUserId) {
        return { hasPaid: false, plan: null, trialUsed: false };
      }

      // Get user from database
      const user = await getUserByClerkId(clerkUserId);
      
      if (!user) {
        // User doesn't exist in database yet
        return { hasPaid: false, plan: null, trialUsed: false };
      }

      // Check if user has active subscription
      const hasActiveSubscription = user.has_paid && 
        user.subscription_status && 
        ['active', 'trialing'].includes(user.subscription_status);

      return {
        hasPaid: hasActiveSubscription,
        plan: user.plan,
        trialUsed: user.trial_used || false,
        subscriptionStatus: user.subscription_status,
        customerId: user.customer_id,
        subscriptionId: user.subscription_id,
        paymentDate: user.payment_date
      };
    } catch (error) {
      console.error('Error checking payment status:', error);
      return { hasPaid: false, plan: null, trialUsed: false };
    }
  }

  // Handle successful payment
  async handlePaymentSuccess(clerkUserId, paymentData) {
    try {
      if (!clerkUserId) {
        throw new Error('Clerk user ID is required');
      }

      const {
        plan,
        customerId,
        subscriptionId,
        subscriptionStatus = 'active',
        trialEnds = null
      } = paymentData;

      // Update user payment status in database
      const success = await updateUserPayment(clerkUserId, {
        has_paid: true,
        plan: plan,
        payment_date: new Date().toISOString(),
        customer_id: customerId,
        subscription_id: subscriptionId,
        subscription_status: subscriptionStatus
      });

      if (!success) {
        throw new Error('Failed to update payment status in database');
      }

      console.log('✅ Payment status updated in database:', {
        clerkUserId,
        plan,
        customerId,
        subscriptionId
      });

      return true;
    } catch (error) {
      console.error('Error handling payment success:', error);
      throw error;
    }
  }

  // Handle trial usage
  async handleTrialUsage(clerkUserId) {
    try {
      if (!clerkUserId) {
        throw new Error('Clerk user ID is required');
      }

      // Check if user has already used trial
      const alreadyUsedTrial = await hasUsedTrial(clerkUserId);
      
      if (alreadyUsedTrial) {
        return { canUseTrial: false, reason: 'Trial already used' };
      }

      // Mark trial as used
      const success = await markTrialUsed(clerkUserId);
      
      if (!success) {
        throw new Error('Failed to mark trial as used');
      }

      console.log('✅ Trial marked as used for user:', clerkUserId);

      return { canUseTrial: true };
    } catch (error) {
      console.error('Error handling trial usage:', error);
      throw error;
    }
  }

  // Create or update user profile
  async createOrUpdateUserProfile(clerkUserId, email, profileData = null) {
    try {
      if (!clerkUserId || !email) {
        throw new Error('Clerk user ID and email are required');
      }

      const userData = {
        clerk_user_id: clerkUserId,
        email: email,
        profile_data: profileData,
        has_paid: false, // Will be updated by payment
        trial_used: false
      };

      const user = await createOrUpdateUser(userData);
      
      if (!user) {
        throw new Error('Failed to create/update user profile');
      }

      console.log('✅ User profile created/updated:', user.id);
      return user;
    } catch (error) {
      console.error('Error creating/updating user profile:', error);
      throw error;
    }
  }

  // Get subscription details from Stripe
  async getSubscriptionDetails(userId) {
    try {
      if (!userId) {
        return null;
      }

      const response = await fetch('/api/stripe/get-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        throw new Error('Failed to get subscription details');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting subscription details:', error);
      return null;
    }
  }

  // Create Stripe checkout session
  async createCheckoutSession(userId, email, priceId, planType) {
    try {
      if (!userId || !email || !priceId) {
        throw new Error('Missing required parameters for checkout');
      }

      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          email, 
          priceId, 
          planType 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  // Sync payment status with Stripe
  async syncPaymentStatus(clerkUserId) {
    try {
      // Get current subscription status from Stripe
      const subscriptionData = await this.getSubscriptionDetails(clerkUserId);
      
      if (!subscriptionData) {
        return { hasPaid: false, plan: null };
      }

      const hasActiveSubscription = subscriptionData.hasPaid && 
        ['active', 'trialing'].includes(subscriptionData.subscription?.status);

      // Update database with current status
      const user = await getUserByClerkId(clerkUserId);
      if (user && hasActiveSubscription !== user.has_paid) {
        await updateUserPayment(clerkUserId, {
          has_paid: hasActiveSubscription,
          plan: subscriptionData.plan || user.plan,
          subscription_status: subscriptionData.subscription?.status || user.subscription_status
        });
      }

      return {
        hasPaid: hasActiveSubscription,
        plan: subscriptionData.plan,
        subscriptionStatus: subscriptionData.subscription?.status
      };
    } catch (error) {
      console.error('Error syncing payment status:', error);
      return { hasPaid: false, plan: null };
    }
  }
}

export const paymentService = new PaymentService();
