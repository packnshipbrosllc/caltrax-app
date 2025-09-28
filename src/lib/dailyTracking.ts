// Daily food entry and tracking functions for Supabase
import { supabase } from './database';

export interface FoodEntry {
  id?: string;
  user_id: string;
  name: string;
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  quantity: number;
  unit: string;
  health_score?: number;
  confidence?: number;
  source?: string;
  barcode?: string;
  date: string;
  created_at?: string;
  updated_at?: string;
}

export interface DailyTotals {
  id?: string;
  user_id: string;
  date: string;
  total_calories: number;
  total_protein_g: number;
  total_fat_g: number;
  total_carbs_g: number;
  created_at?: string;
  updated_at?: string;
}

// Get user ID from Clerk user ID
export async function getUserIdFromClerkId(clerkUserId: string): Promise<string | null> {
  if (!supabase) {
    console.warn('⚠️ Supabase not configured, cannot get user ID - using local storage only');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (error) {
      console.error('Error getting user ID:', error);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error('Error in getUserIdFromClerkId:', error);
    return null;
  }
}

// Add a food entry to the database
export async function addFoodEntry(clerkUserId: string, foodData: any): Promise<FoodEntry | null> {
  if (!supabase) {
    console.warn('Supabase not configured, cannot add food entry');
    return null;
  }

  try {
    const userId = await getUserIdFromClerkId(clerkUserId);
    if (!userId) {
      console.error('User not found in database');
      return null;
    }

    const today = new Date().toISOString().split('T')[0];
    
    const entry: Omit<FoodEntry, 'id' | 'created_at' | 'updated_at'> = {
      user_id: userId,
      name: foodData.name,
      calories: foodData.nutrition?.calories || foodData.calories || 0,
      protein_g: foodData.nutrition?.protein_g || foodData.protein || 0,
      fat_g: foodData.nutrition?.fat_g || foodData.fat || 0,
      carbs_g: foodData.nutrition?.carbs_g || foodData.carbs || 0,
      quantity: foodData.quantity || 1,
      unit: foodData.unit || 'serving',
      health_score: foodData.score || foodData.health_score || 0,
      confidence: foodData.confidence || 0,
      source: foodData.source || 'manual',
      barcode: foodData.barcode || null,
      date: today
    };

    const { data, error } = await supabase
      .from('daily_entries')
      .insert(entry)
      .select()
      .single();

    if (error) {
      console.error('Error adding food entry:', error);
      return null;
    }

    // Update daily totals
    await updateDailyTotals(userId, today);

    return data;
  } catch (error) {
    console.error('Error in addFoodEntry:', error);
    return null;
  }
}

// Get today's food entries
export async function getTodayEntries(clerkUserId: string): Promise<FoodEntry[]> {
  if (!supabase) {
    console.warn('Supabase not configured, cannot get today entries');
    return [];
  }

  try {
    const userId = await getUserIdFromClerkId(clerkUserId);
    if (!userId) {
      return [];
    }

    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('daily_entries')
      .select('*')
      .eq('user_id', userId)
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

// Get daily totals for a specific date
export async function getDailyTotals(clerkUserId: string, date?: string): Promise<DailyTotals | null> {
  if (!supabase) {
    console.warn('Supabase not configured, cannot get daily totals');
    return null;
  }

  try {
    const userId = await getUserIdFromClerkId(clerkUserId);
    if (!userId) {
      return null;
    }

    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('daily_totals')
      .select('*')
      .eq('user_id', userId)
      .eq('date', targetDate)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error getting daily totals:', error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('Error in getDailyTotals:', error);
    return null;
  }
}

// Get entries for a date range
export async function getEntriesForDateRange(clerkUserId: string, startDate: string, endDate: string): Promise<FoodEntry[]> {
  if (!supabase) {
    console.warn('Supabase not configured, cannot get entries for date range');
    return [];
  }

  try {
    const userId = await getUserIdFromClerkId(clerkUserId);
    if (!userId) {
      return [];
    }
    
    const { data, error } = await supabase
      .from('daily_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })
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

// Update daily totals for a specific date
async function updateDailyTotals(userId: string, date: string): Promise<void> {
  if (!supabase) return;

  try {
    // Get all entries for the date
    const { data: entries, error: entriesError } = await supabase
      .from('daily_entries')
      .select('calories, protein_g, fat_g, carbs_g')
      .eq('user_id', userId)
      .eq('date', date);

    if (entriesError) {
      console.error('Error getting entries for totals:', entriesError);
      return;
    }

    // Calculate totals
    const totals = entries?.reduce((acc, entry) => ({
      total_calories: acc.total_calories + (entry.calories || 0),
      total_protein_g: acc.total_protein_g + (entry.protein_g || 0),
      total_fat_g: acc.total_fat_g + (entry.fat_g || 0),
      total_carbs_g: acc.total_carbs_g + (entry.carbs_g || 0)
    }), {
      total_calories: 0,
      total_protein_g: 0,
      total_fat_g: 0,
      total_carbs_g: 0
    }) || {
      total_calories: 0,
      total_protein_g: 0,
      total_fat_g: 0,
      total_carbs_g: 0
    };

    // Upsert daily totals
    const { error: totalsError } = await supabase
      .from('daily_totals')
      .upsert({
        user_id: userId,
        date: date,
        ...totals
      });

    if (totalsError) {
      console.error('Error updating daily totals:', totalsError);
    }
  } catch (error) {
    console.error('Error in updateDailyTotals:', error);
  }
}

// Delete a food entry
export async function deleteFoodEntry(clerkUserId: string, entryId: string): Promise<boolean> {
  if (!supabase) {
    console.warn('Supabase not configured, cannot delete food entry');
    return false;
  }

  try {
    const userId = await getUserIdFromClerkId(clerkUserId);
    if (!userId) {
      return false;
    }

    const { error } = await supabase
      .from('daily_entries')
      .delete()
      .eq('id', entryId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting food entry:', error);
      return false;
    }

    // Update daily totals
    const today = new Date().toISOString().split('T')[0];
    await updateDailyTotals(userId, today);

    return true;
  } catch (error) {
    console.error('Error in deleteFoodEntry:', error);
    return false;
  }
}
