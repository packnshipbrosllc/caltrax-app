// Macro tracking storage utilities
import { addFoodEntry as addFoodEntryToDB } from '../lib/dailyTracking';

export const MACRO_STORAGE_KEY = 'caltrax-macros';

export const getTodayDate = () => {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
};

export const getWeekStart = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  d.setDate(diff);
  return d.toISOString().split('T')[0];
};

export const getMacroData = () => {
  try {
    const data = localStorage.getItem(MACRO_STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error loading macro data:', error);
    return {};
  }
};

export const saveMacroData = (data) => {
  try {
    localStorage.setItem(MACRO_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving macro data:', error);
  }
};

export const addFoodEntry = async (foodData, clerkUserId = null) => {
  const today = getTodayDate();
  const macroData = getMacroData();
  
  if (!macroData[today]) {
    macroData[today] = {
      date: today,
      entries: [],
      totals: {
        calories: 0,
        protein_g: 0,
        fat_g: 0,
        carbs_g: 0
      }
    };
  }
  
  const entry = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    name: foodData.name,
    nutrition: foodData.nutrition,
    healthScore: foodData.score || 0,
    confidence: foodData.confidence || 0
  };
  
  macroData[today].entries.push(entry);
  
  // Update totals
  macroData[today].totals.calories += foodData.nutrition.calories || 0;
  macroData[today].totals.protein_g += foodData.nutrition.protein_g || 0;
  macroData[today].totals.fat_g += foodData.nutrition.fat_g || 0;
  macroData[today].totals.carbs_g += foodData.nutrition.carbs_g || 0;
  
  // Save to local storage
  saveMacroData(macroData);
  
  // Also save to database if we have a Clerk user ID
  if (clerkUserId) {
    try {
      await addFoodEntryToDB(clerkUserId, foodData);
      console.log('✅ Food entry saved to database');
    } catch (error) {
      console.error('❌ Failed to save food entry to database:', error);
    }
  } else {
    console.log('⚠️ No Clerk user ID - saving to local storage only');
  }
  
  return entry;
};

export const getTodayMacros = () => {
  const today = getTodayDate();
  const macroData = getMacroData();
  return macroData[today] || {
    date: today,
    entries: [],
    totals: {
      calories: 0,
      protein_g: 0,
      fat_g: 0,
      carbs_g: 0
    }
  };
};

export const getWeekMacros = () => {
  const weekStart = getWeekStart();
  const macroData = getMacroData();
  const weekData = [];
  
  // Get 7 days starting from week start
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    weekData.push(macroData[dateStr] || {
      date: dateStr,
      entries: [],
      totals: {
        calories: 0,
        protein_g: 0,
        fat_g: 0,
        carbs_g: 0
      }
    });
  }
  
  return weekData;
};

export const getWeeklyTotals = () => {
  const weekData = getWeekMacros();
  return weekData.reduce((totals, day) => ({
    calories: totals.calories + day.totals.calories,
    protein_g: totals.protein_g + day.totals.protein_g,
    fat_g: totals.fat_g + day.totals.fat_g,
    carbs_g: totals.carbs_g + day.totals.carbs_g
  }), {
    calories: 0,
    protein_g: 0,
    fat_g: 0,
    carbs_g: 0
  });
};

export const deleteFoodEntry = (date, entryId) => {
  const macroData = getMacroData();
  if (!macroData[date]) return false;
  
  const entryIndex = macroData[date].entries.findIndex(entry => entry.id === entryId);
  if (entryIndex === -1) return false;
  
  const entry = macroData[date].entries[entryIndex];
  
  // Remove from totals
  macroData[date].totals.calories -= entry.nutrition.calories || 0;
  macroData[date].totals.protein_g -= entry.nutrition.protein_g || 0;
  macroData[date].totals.fat_g -= entry.nutrition.fat_g || 0;
  macroData[date].totals.carbs_g -= entry.nutrition.carbs_g || 0;
  
  // Remove entry
  macroData[date].entries.splice(entryIndex, 1);
  
  saveMacroData(macroData);
  return true;
};


