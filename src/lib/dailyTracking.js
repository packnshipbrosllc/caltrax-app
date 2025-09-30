// Daily tracking functions for food entries
import { supabase } from '../config/supabase';

// Add food entry to database
export async function addFoodEntry(clerkUserId, foodData) {
  if (!supabase) {
    console.warn('Supabase not configured, cannot add food entry');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('food_entries')
      .insert({
        clerk_user_id: clerkUserId,
        date: new Date().toISOString().split('T')[0],
        name: foodData.name,
        calories: foodData.nutrition?.calories || 0,
        protein_g: foodData.nutrition?.protein_g || 0,
        fat_g: foodData.nutrition?.fat_g || 0,
        carbs_g: foodData.nutrition?.carbs_g || 0,
        health_score: foodData.score || 0,
        confidence: foodData.confidence || 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding food entry:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in addFoodEntry:', error);
    return null;
  }
}

// Get today's food entries
export async function getTodayEntries(clerkUserId) {
  if (!supabase) {
    return [];
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('food_entries')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .eq('date', today)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting today entries:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getTodayEntries:', error);
    return [];
  }
}

// Get entries for date range
export async function getEntriesForDateRange(clerkUserId, startDate, endDate) {
  if (!supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('food_entries')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting entries for date range:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getEntriesForDateRange:', error);
    return [];
  }
}

// Delete food entry
export async function deleteFoodEntry(clerkUserId, entryId) {
  if (!supabase) {
    console.warn('Supabase not configured, cannot delete food entry');
    return false;
  }

  try {
    const { error } = await supabase
      .from('food_entries')
      .delete()
      .eq('id', entryId)
      .eq('clerk_user_id', clerkUserId);

    if (error) {
      console.error('Error deleting food entry:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteFoodEntry:', error);
    return false;
  }
}
