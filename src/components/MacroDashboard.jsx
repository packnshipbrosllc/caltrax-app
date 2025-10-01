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
import { useUser } from '@clerk/clerk-react';

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

export default function MacroDashboard({ onBack, onAddFood, onShowMealPlan, onShowWorkout }) {
  // Use Clerk's user hook
  const { user, isLoaded } = useUser();
  
  const [view, setView] = useState('today');
  const [todayData, setTodayData] = useState(null);
  const [weekData, setWeekData] = useState(null);
  const [weeklyTotals, setWeeklyTotals] = useState(null);
  const [dailyGoals, setDailyGoals] = useState({
    calories: 2000,
    protein_g: 150,
    fat_g: 65,
    carbs_g: 250
  });

  // Update daily goals from Clerk user metadata
  useEffect(() => {
    if (!isLoaded) return;
    
    console.log('🔍 MacroDashboard - Loading user goals');
    console.log('User object:', user);
    console.log('User metadata:', user?.unsafeMetadata);
    
    // Get profile from Clerk metadata
    const profile = user?.unsafeMetadata?.caltraxProfile;
    
    if (profile && profile.calories && profile.macros) {
      console.log('✅ Found profile in Clerk metadata');
      
      const newDailyGoals = {
        calories: Number(profile.calories),
        protein_g: Number(profile.macros.protein),
        fat_g: Number(profile.macros.fat),
        carbs_g: Number(profile.macros.carbs)
      };
      
      console.log('Setting daily goals:', newDailyGoals);
      setDailyGoals(newDailyGoals);
    } else {
      console.warn('❌ No profile found in Clerk metadata, using defaults');
      console.log('Profile data:', profile);
    }
  }, [user, isLoaded]);

  useEffect(() => {
    loadData();
  }, [view]);

  const loadData = async () => {
    // For now, use localStorage until database is set up
    const today = getTodayMacros();
    setTodayData(today);
    
    if (view === 'week') {
      const week = getWeekMacros();
      const totals = getWeeklyTotals();
      setWeekData(week);
      setWeeklyTotals(totals);
    }
    
    /* TODO: Replace with database calls when backend is ready
    if (!user?.id) {
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/tracking/entries`, {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Process database data...
      }
    } catch (error) {
      console.error('Error loading from database:', error);
    }
    */
  };

  const handleDeleteEntry = async (date, entryId) => {
    const success = deleteFoodEntry(date, entryId);
    
    if (success) {
      loadData();
    }
    
    /* TODO: Also delete from database when backend is ready
    if (user?.id) {
      try {
        await fetch(`${process.env.REACT_APP_API_URL}/api/tracking/entry/${entryId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${userToken}`
          }
        });
      } catch (error) {
        console.error('Failed to delete from database:', error);
      }
    }
    */
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
            {onShowMealPlan && (
              <Button 
                onClick={onShowMealPlan}
                variant="outline"
                className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
              >
                <Utensils className="w-4 h-4 mr-2" />
                Meal Plan
              </Button>
            )}
            {onShowWorkout && (
              <Button 
                onClick={onShowWorkout}
                variant="outline"
                className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
              >
                <Dumbbell className="w-4 h-4 mr-2" />
                Workout Plan
              </Button>
            )}
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
                        {entry.healthScore && (
                          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                            Score: {entry.healthScore}/10
                          </span>
                        )}
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
  
  if (!data || !totals) {
    return (
      <div className="text-center py-8 text-zinc-400">
        <p>Loading week data...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
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
