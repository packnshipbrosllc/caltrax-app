import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  TrendingUp, 
  BarChart3, 
  Clock, 
  Trash2, 
  Plus,
  ArrowLeft,
  Utensils,
  Dumbbell
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Progress } from './ui/Progress';
import { getTodayMacros, getWeekMacros, getWeeklyTotals, deleteFoodEntry } from '../utils/macroStorage';
import { getTodayEntries, getEntriesForDateRange, deleteFoodEntry as deleteFoodEntryFromDB } from '../lib/dailyTracking.ts';

// Helper functions
const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const getProgressPercentage = (current, goal) => {
  return Math.min((current / goal) * 100, 100);
};

const getProgressColor = (percentage) => {
  if (percentage >= 100) return 'text-green-400';
  if (percentage >= 80) return 'text-yellow-400';
  return 'text-red-400';
};

export default function MacroDashboard({ onBack, onAddFood, onShowMealPlan, onShowWorkout, user }) {
  const [view, setView] = useState('today'); // 'today' or 'week'
  const [todayData, setTodayData] = useState(null);
  const [weekData, setWeekData] = useState(null);
  const [weeklyTotals, setWeeklyTotals] = useState(null);
  const [dailyGoals, setDailyGoals] = useState({
    calories: 2000,
    protein_g: 150,
    fat_g: 65,
    carbs_g: 250
  });

  // Update daily goals when user profile changes
  useEffect(() => {
    console.log('🔍 MacroDashboard useEffect - user:', user);
    console.log('🔍 MacroDashboard useEffect - user?.profile:', user?.profile);
    
    if (user?.profile) {
      console.log('MacroDashboard - Updating daily goals from user profile');
      console.log('MacroDashboard - user.profile.calories:', user.profile.calories);
      console.log('MacroDashboard - user.profile.macros:', user.profile.macros);
      
      const newDailyGoals = {
        calories: user.profile.calories || 2000,
        protein_g: user.profile.macros?.protein || 150,
        fat_g: user.profile.macros?.fat || 65,
        carbs_g: user.profile.macros?.carbs || 250
      };
      
      console.log('MacroDashboard - Setting new daily goals:', newDailyGoals);
      setDailyGoals(newDailyGoals);
    } else if (user) {
      console.log('❌ User exists but no profile found, using default goals');
      // User exists but no profile - this shouldn't happen but let's handle it
      setDailyGoals({
        calories: 2000,
        protein_g: 150,
        fat_g: 65,
        carbs_g: 250
      });
    } else {
      console.log('❌ No user found, using default goals');
    }
  }, [user]);


  useEffect(() => {
    loadData();
  }, [view]);

  const loadData = async () => {
    if (!user?.id) {
      // Fallback to local storage if no user
      const today = getTodayMacros();
      setTodayData(today);
      
      if (view === 'week') {
        const week = getWeekMacros();
        const totals = getWeeklyTotals();
        setWeekData(week);
        setWeeklyTotals(totals);
      }
      return;
    }

    try {
      // Load from database
      const todayEntries = await getTodayEntries(user.id);
      const todayData = {
        date: new Date().toISOString().split('T')[0],
        entries: todayEntries.map(entry => ({
          id: entry.id,
          timestamp: entry.created_at,
          name: entry.name,
          nutrition: {
            calories: entry.calories,
            protein_g: entry.protein_g,
            fat_g: entry.fat_g,
            carbs_g: entry.carbs_g
          },
          healthScore: entry.health_score,
          confidence: entry.confidence
        })),
        totals: {
          calories: todayEntries.reduce((sum, entry) => sum + (entry.calories || 0), 0),
          protein_g: todayEntries.reduce((sum, entry) => sum + (entry.protein_g || 0), 0),
          fat_g: todayEntries.reduce((sum, entry) => sum + (entry.fat_g || 0), 0),
          carbs_g: todayEntries.reduce((sum, entry) => sum + (entry.carbs_g || 0), 0)
        }
      };
      setTodayData(todayData);
      
      if (view === 'week') {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6); // Sunday
        
        const weekEntries = await getEntriesForDateRange(
          user.id, 
          weekStart.toISOString().split('T')[0], 
          weekEnd.toISOString().split('T')[0]
        );
        
        // Group entries by date
        const weekData = [];
        for (let i = 0; i < 7; i++) {
          const date = new Date(weekStart);
          date.setDate(date.getDate() + i);
          const dateStr = date.toISOString().split('T')[0];
          
          const dayEntries = weekEntries.filter(entry => entry.date === dateStr);
          weekData.push({
            date: dateStr,
            entries: dayEntries.map(entry => ({
              id: entry.id,
              timestamp: entry.created_at,
              name: entry.name,
              nutrition: {
                calories: entry.calories,
                protein_g: entry.protein_g,
                fat_g: entry.fat_g,
                carbs_g: entry.carbs_g
              },
              healthScore: entry.health_score,
              confidence: entry.confidence
            })),
            totals: {
              calories: dayEntries.reduce((sum, entry) => sum + (entry.calories || 0), 0),
              protein_g: dayEntries.reduce((sum, entry) => sum + (entry.protein_g || 0), 0),
              fat_g: dayEntries.reduce((sum, entry) => sum + (entry.fat_g || 0), 0),
              carbs_g: dayEntries.reduce((sum, entry) => sum + (entry.carbs_g || 0), 0)
            }
          });
        }
        
        const weeklyTotals = weekData.reduce((totals, day) => ({
          calories: totals.calories + day.totals.calories,
          protein_g: totals.protein_g + day.totals.protein_g,
          fat_g: totals.fat_g + day.totals.fat_g,
          carbs_g: totals.carbs_g + day.totals.carbs_g
        }), { calories: 0, protein_g: 0, fat_g: 0, carbs_g: 0 });
        
        setWeekData(weekData);
        setWeeklyTotals(weeklyTotals);
      }
    } catch (error) {
      console.error('Error loading data from database:', error);
      // Fallback to local storage
      const today = getTodayMacros();
      setTodayData(today);
      
      if (view === 'week') {
        const week = getWeekMacros();
        const totals = getWeeklyTotals();
        setWeekData(week);
        setWeeklyTotals(totals);
      }
    }
  };

  const handleDeleteEntry = async (date, entryId) => {
    // Delete from local storage
    const localSuccess = deleteFoodEntry(date, entryId);
    
    // Also delete from database if we have a user
    if (user?.id) {
      try {
        await deleteFoodEntryFromDB(user.id, entryId);
        console.log('✅ Food entry deleted from database');
      } catch (error) {
        console.error('❌ Failed to delete food entry from database:', error);
      }
    }
    
    if (localSuccess) {
      loadData();
    }
  };


  if (!todayData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-zinc-100">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={onBack}
              className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Analysis
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight">Macro Tracking</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={view === 'today' ? 'default' : 'outline'}
              onClick={() => setView('today')}
              className={view === 'today' ? 'bg-blue-600' : 'border-zinc-600 text-zinc-300'}
            >
              Today
            </Button>
            <Button
              variant={view === 'week' ? 'default' : 'outline'}
              onClick={() => setView('week')}
              className={view === 'week' ? 'bg-blue-600' : 'border-zinc-600 text-zinc-300'}
            >
              Week
            </Button>
            <Button 
              onClick={onAddFood}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Food
            </Button>
            <Button 
              onClick={() => {
                console.log('Meal Plan button clicked - calling onShowMealPlan');
                if (onShowMealPlan) {
                  onShowMealPlan();
                } else {
                  console.error('onShowMealPlan is not defined');
                }
              }}
              variant="outline"
              className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
            >
              <Utensils className="w-4 h-4 mr-2" />
              Meal Plan
            </Button>
            <Button 
              onClick={() => {
                console.log('Workout Plan button clicked - calling onShowWorkout');
                if (onShowWorkout) {
                  onShowWorkout();
                } else {
                  console.error('onShowWorkout is not defined');
                }
              }}
              variant="outline"
              className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
            >
              <Dumbbell className="w-4 h-4 mr-2" />
              Workout Plan
            </Button>
          </div>
        </div>

        {view === 'today' ? (
          <TodayView 
            data={todayData} 
            goals={dailyGoals}
            onDeleteEntry={handleDeleteEntry}
            onAddFood={onAddFood}
          />
        ) : (
          <WeekView 
            data={weekData} 
            totals={weeklyTotals}
            goals={dailyGoals}
            onDeleteEntry={handleDeleteEntry}
          />
        )}
      </div>
    </div>
  );
}

function TodayView({ data, goals, onDeleteEntry, onAddFood }) {
  const { entries, totals } = data;

  return (
    <div className="space-y-6">
      {/* Macro Progress Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(totals).map(([key, value]) => {
          const goal = goals[key];
          const percentage = getProgressPercentage(value, goal);
          const color = getProgressColor(percentage);
          
          return (
            <Card key={key} className="bg-zinc-900/60 border-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-zinc-400 capitalize">
                    {key.replace('_g', ' (g)').replace('_', ' ')}
                  </div>
                  <div className={`text-sm font-medium ${color}`}>
                    {Math.round(percentage)}%
                  </div>
                </div>
                <div className="text-2xl font-bold mb-2">
                  {Math.round(value)} / {goal}
                </div>
                <Progress value={percentage} className="h-2" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Food Entries */}
      <Card className="bg-zinc-900/60 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Today's Food Entries ({entries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center py-8 text-zinc-400">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No food entries today</p>
              <p className="text-sm">Start by analyzing some food to track your macros!</p>
              <Button 
                onClick={onAddFood}
                className="mt-4 bg-gradient-to-r from-blue-500 to-purple-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Food
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {entries.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-zinc-700"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium">{entry.name}</h3>
                        <span className="text-xs text-zinc-400">
                          {formatTime(entry.timestamp)}
                        </span>
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                          Score: {entry.healthScore}/10
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm text-zinc-400">
                        <div>{entry.nutrition.calories} cal</div>
                        <div>{entry.nutrition.protein_g}g protein</div>
                        <div>{entry.nutrition.fat_g}g fat</div>
                        <div>{entry.nutrition.carbs_g}g carbs</div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeleteEntry(data.date, entry.id)}
                      className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function WeekView({ data, totals, goals, onDeleteEntry }) {
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  return (
    <div className="space-y-6">
      {/* Weekly Totals */}
      <Card className="bg-zinc-900/60 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Weekly Totals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(totals).map(([key, value]) => {
              const weeklyGoal = goals[key] * 7;
              const percentage = getProgressPercentage(value, weeklyGoal);
              const color = getProgressColor(percentage);
              
              return (
                <div key={key} className="text-center">
                  <div className="text-sm text-zinc-400 capitalize mb-1">
                    {key.replace('_g', ' (g)').replace('_', ' ')}
                  </div>
                  <div className={`text-2xl font-bold ${color}`}>
                    {Math.round(value)}
                  </div>
                  <div className="text-xs text-zinc-500">
                    / {weeklyGoal} goal
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Daily Breakdown */}
      <div className="grid gap-4">
        {data.map((day, index) => (
          <Card key={day.date} className="bg-zinc-900/60 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {weekDays[index]} - {new Date(day.date).toLocaleDateString()}
                </div>
                <div className="text-sm text-zinc-400">
                  {day.entries.length} entries
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4 mb-4">
                {Object.entries(day.totals).map(([key, value]) => {
                  const goal = goals[key];
                  const percentage = getProgressPercentage(value, goal);
                  const color = getProgressColor(percentage);
                  
                  return (
                    <div key={key} className="text-center">
                      <div className="text-sm text-zinc-400 capitalize">
                        {key.replace('_g', ' (g)').replace('_', ' ')}
                      </div>
                      <div className={`text-lg font-semibold ${color}`}>
                        {Math.round(value)}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {Math.round(percentage)}% of goal
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {day.entries.length > 0 && (
                <div className="space-y-2">
                  {day.entries.map((entry) => (
                    <div 
                      key={entry.id}
                      className="flex items-center justify-between p-3 bg-zinc-800/50 rounded border border-zinc-700"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{entry.name}</span>
                          <span className="text-xs text-zinc-400">
                            {formatTime(entry.timestamp)}
                          </span>
                        </div>
                        <div className="text-sm text-zinc-400">
                          {entry.nutrition.calories} cal • {entry.nutrition.protein_g}g protein • {entry.nutrition.fat_g}g fat • {entry.nutrition.carbs_g}g carbs
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDeleteEntry(day.date, entry.id)}
                        className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
