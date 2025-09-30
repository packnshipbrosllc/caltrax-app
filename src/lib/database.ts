// Database functions for Supabase
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
// Prefer REACT_APP_* but fall back to NEXT_PUBLIC_*
const supabaseUrl =
  process.env.REACT_APP_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Log database status
if (!supabase) {
  console.warn('⚠️ Supabase not configured - database features disabled');
} else {
  console.log('✅ Supabase configured - database features enabled');
}

export interface User {
  id?: string;
  clerk_user_id: string;
  email: string;
  has_paid: boolean;
  plan: string | null;
  payment_date: string | null;
  trial_used: boolean;
  trial_start_date: string | null;
  customer_id: string | null;
  subscription_id: string | null;
  subscription_status: string | null;
  profile_data: any | null;
  created_at?: string;
  updated_at?: string;
}

// Create or update user in database
export async function createOrUpdateUser(userData: Partial<User>): Promise<User | null> {
  if (!supabase) {
    console.warn('Supabase not configured, cannot create/update user');
    return null;
  }

  try {
    const { clerk_user_id, email } = userData;
    
    if (!clerk_user_id || !email) {
      console.error('clerk_user_id and email are required');
      return null;
    }

    // Check if user already exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('clerk_user_id', clerk_user_id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching existing user:', fetchError);
      return null;
    }

    const now = new Date().toISOString();
    
    if (existingUser) {
      // Update existing user, preserving payment info unless explicitly updating
      const updateData = {
        email: userData.email || existingUser.email,
        profile_data: userData.profile_data || existingUser.profile_data,
        updated_at: now,
        // Only update payment fields if they're explicitly provided
        ...(userData.has_paid !== undefined && { has_paid: userData.has_paid }),
        ...(userData.plan !== undefined && { plan: userData.plan }),
        ...(userData.payment_date !== undefined && { payment_date: userData.payment_date }),
        ...(userData.trial_used !== undefined && { trial_used: userData.trial_used }),
        ...(userData.trial_start_date !== undefined && { trial_start_date: userData.trial_start_date }),
        ...(userData.customer_id !== undefined && { customer_id: userData.customer_id }),
        ...(userData.subscription_id !== undefined && { subscription_id: userData.subscription_id }),
        ...(userData.subscription_status !== undefined && { subscription_status: userData.subscription_status }),
      };

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('clerk_user_id', clerk_user_id)
        .select()
        .single();

      if (error) {
        console.error('Error updating user:', error);
        return null;
      }

      return data;
    } else {
      // Create new user
      const newUser = {
        clerk_user_id,
        email,
        has_paid: userData.has_paid || false,
        plan: userData.plan || null,
        payment_date: userData.payment_date || null,
        trial_used: userData.trial_used || false,
        trial_start_date: userData.trial_start_date || null,
        customer_id: userData.customer_id || null,
        subscription_id: userData.subscription_id || null,
        subscription_status: userData.subscription_status || null,
        profile_data: userData.profile_data || null,
        created_at: now,
        updated_at: now
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert(newUser)
        .select()
        .single();

      if (error) {
        console.error('Error creating user:', error);
        return null;
      }

      return data;
    }
  } catch (error) {
    console.error('Error in createOrUpdateUser:', error);
    return null;
  }
}

// Get user by Clerk user ID
export async function getUserByClerkId(clerkUserId: string): Promise<User | null> {
  if (!supabase) {
    console.warn('Supabase not configured, cannot get user');
    return null;
  }

  try {
    console.log('🔍 Looking up user in database:', clerkUserId);
    
    // Add timeout to prevent hanging
    const queryPromise = supabase
      .from('profiles')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .single();
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database query timeout')), 10000)
    );
    
    const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

    if (error) {
      if (error.code === 'PGRST116') { // No rows found
        console.log('👤 User not found in database');
        return null;
      }
      console.error('Error getting user:', error);
      return null;
    }

    console.log('✅ User found in database:', data?.email);
    return data;
  } catch (error) {
    console.error('Error in getUserByClerkId:', error);
    return null;
  }
}

// Check if user has used trial
export async function hasUsedTrial(clerkUserId: string): Promise<boolean> {
  if (!supabase) {
    console.warn('Supabase not configured, allowing trial');
    return false;
  }

  try {
    const user = await getUserByClerkId(clerkUserId);
    return user?.trial_used || false;
  } catch (error) {
    console.error('Error checking trial usage:', error);
    return false;
  }
}

// Update user payment status
export async function updateUserPayment(
  clerkUserId: string, 
  paymentData: {
    has_paid: boolean;
    plan: string;
    payment_date: string;
    customer_id?: string;
    subscription_id?: string;
    subscription_status?: string;
  }
): Promise<boolean> {
  if (!supabase) {
    console.warn('Supabase not configured, cannot update payment');
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        has_paid: paymentData.has_paid,
        plan: paymentData.plan,
        payment_date: paymentData.payment_date,
        customer_id: paymentData.customer_id || null,
        subscription_id: paymentData.subscription_id || null,
        subscription_status: paymentData.subscription_status || null,
        updated_at: new Date().toISOString()
      })
      .eq('clerk_user_id', clerkUserId);

    if (error) {
      console.error('Error updating payment status:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateUserPayment:', error);
    return false;
  }
}

// Mark trial as used
export async function markTrialUsed(clerkUserId: string): Promise<boolean> {
  if (!supabase) {
    console.warn('Supabase not configured, cannot mark trial used');
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        trial_used: true,
        trial_start_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('clerk_user_id', clerkUserId);

    if (error) {
      console.error('Error marking trial used:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in markTrialUsed:', error);
    return false;
  }
}

// Get subscription status from Stripe
export async function getSubscriptionStatus(customerId: string): Promise<{
  hasActiveSubscription: boolean;
  subscription: any;
} | null> {
  if (!customerId) {
    return { hasActiveSubscription: false, subscription: null };
  }

  try {
    const response = await fetch('/api/stripe/get-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId })
    });

    if (!response.ok) {
      console.error('Failed to get subscription status');
      return { hasActiveSubscription: false, subscription: null };
    }

    const data = await response.json();
    return {
      hasActiveSubscription: data.hasSubscription,
      subscription: data.subscription
    };
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return { hasActiveSubscription: false, subscription: null };
  }
}
