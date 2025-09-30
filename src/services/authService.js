import { supabase } from '../config/supabase';

export const authService = {
  // Sign up with email and password
  async signUp(email, password, profileData = {}) {
    try {
      console.log('🔍 Supabase signup starting...', { email, profileData })
      
      // Create user account in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (authError) {
        console.error('Auth signup error:', authError)
        // If user already exists, try to sign them in instead
        if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
          console.log('User already exists, attempting sign in...')
          return await this.signIn(email, password)
        }
        throw authError
      }
      
      console.log('✅ Auth signup successful:', authData)
      
      // Email verification disabled for testing - create profile immediately
      if (authData.user) {
        const profile = await this.createProfile(authData.user.id, email, profileData)
        console.log('✅ Profile created:', profile)
        
        return {
          ...authData,
          profile
        }
      }
      
      return authData
    } catch (error) {
      console.error('Signup error:', error)
      throw error
    }
  },

  // Sign in with email and password
  async signIn(email, password) {
    try {
      console.log('🔍 Supabase signin starting...', { email })
      
      // Sign in to Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (authError) {
        console.error('Auth signin error:', authError)
        throw authError
      }
      
      console.log('✅ Auth signin successful:', authData)
      
      // Check if email is verified (temporarily disabled for testing)
      // if (authData.user && !authData.user.email_confirmed_at) {
      //   console.log('📧 Email not verified')
      //   throw new Error('Please verify your email before signing in. Check your inbox for a verification link.')
      // }
      
      // Get user profile
      if (authData.user) {
        const profile = await this.getProfile(authData.user.id)
        console.log('✅ Profile loaded:', profile)
        console.log('🔍 Profile details - calories:', profile?.calories)
        console.log('🔍 Profile details - macros:', profile?.macros)
        
        const userWithProfile = {
          ...authData,
          profile: profile || null // Handle case where profile doesn't exist yet
        }
        
        console.log('🔍 Final user data with profile:', userWithProfile)
        return userWithProfile
      }
      
      return authData
    } catch (error) {
      console.error('Signin error:', error)
      throw error
    }
  },

  // Create user profile in database
  async createProfile(userId, email, profileData) {
    try {
      console.log('🔍 Creating profile...', { userId, email, profileData })
      
      // First check if profile already exists
      const existingProfile = await this.getProfile(userId)
      if (existingProfile) {
        console.log('Profile already exists, updating instead of creating')
        return await this.updateProfile(userId, {
          ...profileData,
          updated_at: new Date().toISOString()
        })
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email,
          ...profileData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) {
        console.error('Profile creation error:', error)
        throw error
      }
      
      console.log('✅ Profile created successfully:', data)
      return data
    } catch (error) {
      console.error('Create profile error:', error)
      throw error
    }
  },

  // Get user profile by user ID
  async getProfile(userId) {
    try {
      console.log('🔍 Getting profile...', { userId })
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle() // Use maybeSingle() instead of single() to handle no results
      
      if (error) {
        console.error('Get profile error:', error)
        throw error
      }
      
      if (!data) {
        console.log('No profile found for user:', userId)
        return null
      }
      
      console.log('✅ Profile retrieved:', data)
      return data
    } catch (error) {
      console.error('Get profile error:', error)
      throw error
    }
  },

  // Update user profile
  async updateProfile(userId, updates) {
    try {
      console.log('🔍 Updating profile...', { userId, updates })
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()
      
      if (error) {
        console.error('Update profile error:', error)
        throw error
      }
      
      console.log('✅ Profile updated:', data)
      return data
    } catch (error) {
      console.error('Update profile error:', error)
      throw error
    }
  },

  // Sign out
  async signOut() {
    try {
      console.log('🔍 Signing out...')
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Signout error:', error)
        throw error
      }
      
      console.log('✅ Signed out successfully')
    } catch (error) {
      console.error('Signout error:', error)
      throw error
    }
  },

  // Get current user and profile
  async getCurrentUser() {
    try {
      console.log('🔍 Getting current user...')
      
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.error('Get current user error:', authError)
        throw authError
      }
      
      if (!user) {
        console.log('No current user')
        return null
      }
      
      // Get profile
      const profile = await this.getProfile(user.id)
      
      return {
        ...user,
        profile
      }
    } catch (error) {
      console.error('Get current user error:', error)
      throw error
    }
  },

  // Resend email verification
  async resendVerification(email) {
    try {
      console.log('🔍 Resending verification email...', { email })
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        console.error('Resend verification error:', error)
        throw error
      }
      
      console.log('✅ Verification email sent')
      return { success: true, message: 'Verification email sent! Check your inbox.' }
    } catch (error) {
      console.error('Resend verification error:', error)
      throw error
    }
  }
}
