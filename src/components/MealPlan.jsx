import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Utensils, 
  Clock, 
  Target, 
  TrendingUp, 
  ArrowLeft, 
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';

export default function MealPlan({ onBack, user }) {
  
  const [mealPlan, setMealPlan] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);

  // Auto-generate meal plan when user profile is available
  useEffect(() => {
    if (user?.profile && !mealPlan) {
      handleGeneratePlan();
    }
  }, [user]);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Sample meal data - in a real app, this would come from an API
  const generateMealPlan = () => {
    const { profile } = user;
    if (!profile) return null;

    const { calories, macros, goals, dietaryRestrictions } = profile;
    const meals = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

    // Generate 7 days of meals
    const weeklyPlan = days.map((day, dayIndex) => ({
      day,
      meals: meals.map(meal => {
        const mealCalories = Math.round(calories * getMealCalorieRatio(meal));
        const mealMacros = calculateMealMacros(mealCalories, macros, goals);
        
        return {
          name: meal,
          calories: mealCalories,
          macros: mealMacros,
          foods: generateMealFoods(meal, mealCalories, mealMacros, goals, dietaryRestrictions),
          time: getMealTime(meal)
        };
      })
    }));

    return weeklyPlan;
  };

  const getMealCalorieRatio = (meal) => {
    const ratios = {
      'Breakfast': 0.25,
      'Lunch': 0.35,
      'Dinner': 0.30,
      'Snacks': 0.10
    };
    return ratios[meal] || 0.25;
  };

  const calculateMealMacros = (calories, dailyMacros, goals) => {
    const protein = Math.round((dailyMacros.protein * calories) / user.profile.calories);
    const fat = Math.round((dailyMacros.fat * calories) / user.profile.calories);
    const carbs = Math.round((dailyMacros.carbs * calories) / user.profile.calories);
    
    return { protein, fat, carbs };
  };

  const generateMealFoods = (meal, calories, macros, goals, restrictions) => {
    // Sample food database - in a real app, this would be much larger
    const foodDatabase = {
      'Breakfast': [
        { name: 'Oatmeal with Berries', calories: 300, protein: 12, fat: 6, carbs: 50, healthScore: 8 },
        { name: 'Greek Yogurt Parfait', calories: 250, protein: 20, fat: 8, carbs: 25, healthScore: 9 },
        { name: 'Avocado Toast', calories: 320, protein: 15, fat: 18, carbs: 30, healthScore: 7 },
        { name: 'Protein Smoothie', calories: 280, protein: 25, fat: 5, carbs: 35, healthScore: 8 },
        { name: 'Scrambled Eggs', calories: 200, protein: 18, fat: 14, carbs: 2, healthScore: 9 }
      ],
      'Lunch': [
        { name: 'Grilled Chicken Salad', calories: 400, protein: 35, fat: 15, carbs: 20, healthScore: 9 },
        { name: 'Quinoa Bowl', calories: 450, protein: 18, fat: 12, carbs: 60, healthScore: 8 },
        { name: 'Salmon with Vegetables', calories: 380, protein: 30, fat: 20, carbs: 15, healthScore: 9 },
        { name: 'Turkey Wrap', calories: 350, protein: 25, fat: 10, carbs: 40, healthScore: 7 },
        { name: 'Lentil Soup', calories: 300, protein: 20, fat: 8, carbs: 45, healthScore: 8 }
      ],
      'Dinner': [
        { name: 'Baked Salmon', calories: 450, protein: 40, fat: 25, carbs: 10, healthScore: 9 },
        { name: 'Grilled Chicken Breast', calories: 400, protein: 45, fat: 15, carbs: 5, healthScore: 9 },
        { name: 'Vegetable Stir Fry', calories: 350, protein: 15, fat: 12, carbs: 50, healthScore: 8 },
        { name: 'Lean Beef with Sweet Potato', calories: 500, protein: 35, fat: 20, carbs: 40, healthScore: 7 },
        { name: 'Tofu Curry', calories: 380, protein: 20, fat: 18, carbs: 35, healthScore: 8 }
      ],
      'Snacks': [
        { name: 'Mixed Nuts', calories: 160, protein: 6, fat: 14, carbs: 6, healthScore: 8 },
        { name: 'Apple with Almond Butter', calories: 200, protein: 8, fat: 12, carbs: 25, healthScore: 9 },
        { name: 'Greek Yogurt', calories: 120, protein: 15, fat: 2, carbs: 8, healthScore: 9 },
        { name: 'Hummus with Veggies', calories: 150, protein: 6, fat: 8, carbs: 15, healthScore: 8 },
        { name: 'Protein Bar', calories: 200, protein: 20, fat: 8, carbs: 20, healthScore: 6 }
      ]
    };

    const availableFoods = foodDatabase[meal] || [];
    
    // Filter based on dietary restrictions
    let filteredFoods = availableFoods;
    if (restrictions.includes('Vegetarian')) {
      filteredFoods = filteredFoods.filter(food => 
        !food.name.toLowerCase().includes('chicken') && 
        !food.name.toLowerCase().includes('beef') && 
        !food.name.toLowerCase().includes('salmon') &&
        !food.name.toLowerCase().includes('turkey')
      );
    }
    if (restrictions.includes('Vegan')) {
      filteredFoods = filteredFoods.filter(food => 
        !food.name.toLowerCase().includes('yogurt') && 
        !food.name.toLowerCase().includes('eggs') && 
        !food.name.toLowerCase().includes('cheese')
      );
    }

    // Select foods that fit the calorie and macro targets
    const selectedFoods = [];
    let remainingCalories = calories;
    let remainingProtein = macros.protein;
    let remainingFat = macros.fat;
    let remainingCarbs = macros.carbs;

    // Try to find 2-3 foods that fit the targets
    for (let i = 0; i < 3 && remainingCalories > 50; i++) {
      const suitableFoods = filteredFoods.filter(food => 
        food.calories <= remainingCalories * 0.6 && // Don't exceed 60% of remaining calories
        food.protein <= remainingProtein * 1.2 &&
        food.fat <= remainingFat * 1.2 &&
        food.carbs <= remainingCarbs * 1.2
      );

      if (suitableFoods.length === 0) break;

      const selectedFood = suitableFoods[Math.floor(Math.random() * suitableFoods.length)];
      selectedFoods.push(selectedFood);
      
      remainingCalories -= selectedFood.calories;
      remainingProtein -= selectedFood.protein;
      remainingFat -= selectedFood.fat;
      remainingCarbs -= selectedFood.carbs;
    }

    return selectedFoods;
  };

  const getMealTime = (meal) => {
    const times = {
      'Breakfast': '8:00 AM',
      'Lunch': '12:30 PM',
      'Dinner': '7:00 PM',
      'Snacks': '3:00 PM'
    };
    return times[meal] || '12:00 PM';
  };

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    const plan = generateMealPlan();
    setMealPlan(plan);
    setIsGenerating(false);
  };

  // Error boundary check after hooks
  if (!user) {
    console.error('MealPlan: No user provided');
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p className="text-zinc-400 mb-4">No user data available</p>
          <Button onClick={onBack}>Go Back</Button>
        </div>
      </div>
    );
  }

  if (!user?.profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Profile Required</h2>
          <p className="text-zinc-400 mb-4">Please complete your profile to generate a meal plan</p>
          <Button onClick={onBack} className="bg-gradient-to-r from-blue-500 to-purple-600">
            Go Back
          </Button>
        </div>
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
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight">Your Meal Plan</h1>
          </div>
          <Button 
            onClick={handleGeneratePlan}
            disabled={isGenerating}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate Plan
              </>
            )}
          </Button>
        </div>

        {/* User Goals Summary */}
        <Card className="bg-zinc-900/60 border-zinc-800 mb-6">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{user.profile.calories}</div>
                <div className="text-sm text-zinc-400">Daily Calories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{user.profile.macros.protein}g</div>
                <div className="text-sm text-zinc-400">Protein</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{user.profile.macros.fat}g</div>
                <div className="text-sm text-zinc-400">Fat</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{user.profile.macros.carbs}g</div>
                <div className="text-sm text-zinc-400">Carbs</div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <div className="text-sm text-zinc-400">Goals: {user.profile.goals.join(', ')}</div>
            </div>
          </CardContent>
        </Card>

        {/* Day Selector */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {days.map((day, index) => (
            <Button
              key={day}
              variant={selectedDay === index ? 'default' : 'outline'}
              onClick={() => setSelectedDay(index)}
              className={`whitespace-nowrap ${
                selectedDay === index 
                  ? 'bg-blue-600' 
                  : 'border-zinc-600 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              {day}
            </Button>
          ))}
        </div>

        {/* Meal Plan */}
        {mealPlan ? (
          <div className="space-y-6">
            {mealPlan[selectedDay].meals.map((meal, index) => (
              <motion.div
                key={meal.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="bg-zinc-900/60 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Utensils className="w-5 h-5" />
                        {meal.name}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-zinc-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {meal.time}
                        </div>
                        <div className="font-semibold text-zinc-200">{meal.calories} cal</div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Macro Breakdown */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-zinc-800/50 rounded-lg">
                        <div className="text-lg font-semibold text-green-400">{meal.macros.protein}g</div>
                        <div className="text-xs text-zinc-400">Protein</div>
                      </div>
                      <div className="text-center p-3 bg-zinc-800/50 rounded-lg">
                        <div className="text-lg font-semibold text-yellow-400">{meal.macros.fat}g</div>
                        <div className="text-xs text-zinc-400">Fat</div>
                      </div>
                      <div className="text-center p-3 bg-zinc-800/50 rounded-lg">
                        <div className="text-lg font-semibold text-purple-400">{meal.macros.carbs}g</div>
                        <div className="text-xs text-zinc-400">Carbs</div>
                      </div>
                    </div>

                    {/* Food Items */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-zinc-200">Suggested Foods:</h4>
                      {meal.foods.map((food, foodIndex) => (
                        <div key={foodIndex} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">{food.name}</div>
                            <div className="text-sm text-zinc-400">
                              {food.calories} cal • {food.protein}g protein • {food.fat}g fat • {food.carbs}g carbs
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm text-zinc-400">Score: {food.healthScore}/10</div>
                            <div className={`w-2 h-2 rounded-full ${
                              food.healthScore >= 8 ? 'bg-green-400' :
                              food.healthScore >= 6 ? 'bg-yellow-400' : 'bg-red-400'
                            }`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <RefreshCw className="w-16 h-16 text-zinc-400 mx-auto mb-4 animate-spin" />
            <h3 className="text-xl font-semibold mb-2">Generating Your Meal Plan</h3>
            <p className="text-zinc-400">Creating personalized recommendations based on your goals...</p>
          </div>
        )}
      </div>
    </div>
  );
}


