import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Target, Scale, Ruler, Calendar, ArrowRight, Check } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { secureStorage } from '../utils/security';
import { simpleStorage } from '../utils/simpleStorage';
import { authService } from '../services/authService';

export default function UserProfile({ onComplete, user }) {
  const [step, setStep] = useState(1);
  const [profileData, setProfileData] = useState({
    height: '',
    weight: '',
    age: '',
    gender: '',
    activityLevel: '',
    goals: [],
    dietaryRestrictions: []
  });

  const activityLevels = [
    { value: 'sedentary', label: 'Sedentary', description: 'Little to no exercise' },
    { value: 'light', label: 'Lightly Active', description: 'Light exercise 1-3 days/week' },
    { value: 'moderate', label: 'Moderately Active', description: 'Moderate exercise 3-5 days/week' },
    { value: 'very', label: 'Very Active', description: 'Heavy exercise 6-7 days/week' },
    { value: 'extreme', label: 'Extremely Active', description: 'Very heavy exercise, physical job' }
  ];

  const goals = [
    { value: 'build_muscle', label: 'Build Muscle', description: 'Gain lean muscle mass', icon: '💪' },
    { value: 'burn_fat', label: 'Burn Fat', description: 'Lose body fat', icon: '🔥' },
    { value: 'lose_weight', label: 'Lose Weight', description: 'Overall weight loss', icon: '⚖️' },
    { value: 'maintain', label: 'Maintain Weight', description: 'Keep current weight', icon: '⚖️' },
    { value: 'gain_weight', label: 'Gain Weight', description: 'Healthy weight gain', icon: '📈' }
  ];

  const dietaryRestrictions = [
    'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut-Free', 'Keto', 'Paleo', 'Mediterranean'
  ];

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleGoalToggle = (goal) => {
    setProfileData(prev => ({
      ...prev,
      goals: prev.goals.includes(goal) 
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }));
  };

  const handleRestrictionToggle = (restriction) => {
    setProfileData(prev => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.includes(restriction)
        ? prev.dietaryRestrictions.filter(r => r !== restriction)
        : [...prev.dietaryRestrictions, restriction]
    }));
  };

  const calculateCalories = () => {
    const { height, weight, age, gender, activityLevel, goals } = profileData;
    if (!height || !weight || !age || !gender || !activityLevel) return null;

    // Convert height from inches to centimeters for BMR calculation
    const heightInCm = height * 2.54;
    const weightKg = parseFloat(weight);

    // BMR calculation (Mifflin-St Jeor Equation) - more conservative
    let bmr;
    if (gender === 'male') {
      bmr = 10 * weightKg + 6.25 * heightInCm - 5 * age + 5;
    } else {
      bmr = 10 * weightKg + 6.25 * heightInCm - 5 * age - 161;
    }

    // More conservative activity multipliers
    const multipliers = {
      sedentary: 1.2,
      light: 1.35,
      moderate: 1.5,
      very: 1.65,
      extreme: 1.8
    };

    const tdee = bmr * multipliers[activityLevel];
    
    // Apply realistic goal adjustments with safety limits
    let calorieGoal = tdee;
    
    if (goals.includes('lose_weight') || goals.includes('burn_fat')) {
      // Weight loss: 300-500 calorie deficit (0.5-1 lb per week)
      calorieGoal = Math.max(tdee - 400, bmr * 1.1); // Never go below 10% above BMR
    } else if (goals.includes('build_muscle') || goals.includes('gain_weight')) {
      // Weight gain: 200-400 calorie surplus (0.4-0.8 lb per week)
      calorieGoal = Math.min(tdee + 300, tdee * 1.15); // Never exceed 15% above TDEE
    }
    
    // Safety limits: 1200-4000 calories per day
    calorieGoal = Math.max(1200, Math.min(4000, calorieGoal));
    
    return Math.round(calorieGoal);
  };

  const calculateMacros = (calories) => {
    const { goals, weight } = profileData;
    const weightKg = parseFloat(weight);
    
    // Calculate protein based on body weight (1-2g per kg, or 0.45-0.9g per lb)
    let proteinPerKg;
    if (goals.includes('build_muscle') || goals.includes('gain_weight')) {
      proteinPerKg = 2.0; // 2g per kg for muscle building
    } else if (goals.includes('burn_fat') || goals.includes('lose_weight')) {
      proteinPerKg = 1.8; // 1.8g per kg for fat loss (higher for satiety)
    } else {
      proteinPerKg = 1.6; // 1.6g per kg for maintenance
    }
    
    const protein = Math.round(weightKg * proteinPerKg);
    const proteinCalories = protein * 4;
    
    // Calculate fat (20-35% of calories)
    let fatPercentage;
    if (goals.includes('burn_fat') || goals.includes('lose_weight')) {
      fatPercentage = 0.25; // 25% for fat loss
    } else if (goals.includes('build_muscle')) {
      fatPercentage = 0.30; // 30% for muscle building
    } else {
      fatPercentage = 0.30; // 30% for maintenance
    }
    
    const fatCalories = calories * fatPercentage;
    const fat = Math.round(fatCalories / 9); // 9 cal/g
    
    // Remaining calories go to carbs
    const remainingCalories = calories - proteinCalories - fatCalories;
    const carbs = Math.round(remainingCalories / 4); // 4 cal/g
    
    // Safety checks
    const finalProtein = Math.max(50, Math.min(300, protein)); // 50-300g protein
    const finalFat = Math.max(30, Math.min(150, fat)); // 30-150g fat
    const finalCarbs = Math.max(50, Math.min(500, carbs)); // 50-500g carbs

    return { 
      protein: finalProtein, 
      fat: finalFat, 
      carbs: finalCarbs 
    };
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Complete profile setup
      const calories = calculateCalories();
      const macros = calories ? calculateMacros(calories) : null;
      
      if (!calories || !macros) {
        console.error('❌ Failed to calculate nutrition goals');
        alert('Please fill in all required fields');
        return;
      }
      
      const completeProfile = {
        height: profileData.height,
        weight: profileData.weight,
        age: profileData.age,
        gender: profileData.gender,
        activityLevel: profileData.activityLevel,
        goals: profileData.goals,
        dietaryRestrictions: profileData.dietaryRestrictions,
        calories: calories,
        macros: {
          protein: macros.protein,
          fat: macros.fat,
          carbs: macros.carbs
        },
        completedAt: new Date().toISOString()
      };

      console.log('✅ Profile completed:', completeProfile);
      console.log('Calories:', completeProfile.calories);
      console.log('Macros:', completeProfile.macros);

      // Create updated user object
      const updatedUser = {
        ...user,
        profile: completeProfile
      };
      
      // Call parent's onComplete handler
      console.log('🔍 Calling onComplete with profile data');
      onComplete(updatedUser);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return profileData.height && profileData.weight && profileData.age && profileData.gender;
      case 2:
        return profileData.activityLevel && profileData.goals.length > 0;
      case 3:
        return true; // Dietary restrictions are optional
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-4"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold">Complete Your Profile</h1>
          </motion.div>
          <p className="text-zinc-400">Help us personalize your nutrition experience</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-400">Step {step} of 3</span>
            <span className="text-sm text-zinc-400">{Math.round((step / 3) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ruler className="w-5 h-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Height (inches)
                    </label>
                    <input
                      type="number"
                      value={profileData.height}
                      onChange={(e) => handleInputChange('height', e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-900 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="67"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      value={profileData.weight}
                      onChange={(e) => handleInputChange('weight', e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-900 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="70"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Age
                    </label>
                    <input
                      type="number"
                      value={profileData.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-900 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="25"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Gender
                    </label>
                    <select
                      value={profileData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-900 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Activity & Goals */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="w-5 h-5" />
                  Activity Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {activityLevels.map((level) => (
                    <label
                      key={level.value}
                      className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all ${
                        profileData.activityLevel === level.value
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-zinc-600 hover:border-zinc-500'
                      }`}
                    >
                      <input
                        type="radio"
                        name="activityLevel"
                        value={level.value}
                        checked={profileData.activityLevel === level.value}
                        onChange={(e) => handleInputChange('activityLevel', e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{level.label}</div>
                        <div className="text-sm text-zinc-400">{level.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Your Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-3">
                  {goals.map((goal) => (
                    <label
                      key={goal.value}
                      className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all ${
                        profileData.goals.includes(goal.value)
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-zinc-600 hover:border-zinc-500'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={profileData.goals.includes(goal.value)}
                        onChange={() => handleGoalToggle(goal.value)}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-2xl">{goal.icon}</span>
                        <div>
                          <div className="font-medium">{goal.label}</div>
                          <div className="text-sm text-zinc-400">{goal.description}</div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Dietary Restrictions */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Dietary Preferences (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-3">
                  {dietaryRestrictions.map((restriction) => (
                    <label
                      key={restriction}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                        profileData.dietaryRestrictions.includes(restriction)
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-zinc-600 hover:border-zinc-500'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={profileData.dietaryRestrictions.includes(restriction)}
                        onChange={() => handleRestrictionToggle(restriction)}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          profileData.dietaryRestrictions.includes(restriction)
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-zinc-400'
                        }`}>
                          {profileData.dietaryRestrictions.includes(restriction) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span>{restriction}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Preview of calculated goals */}
            {calculateCalories() && (
              <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20 mt-6">
                <CardHeader>
                  <CardTitle className="text-center">Your Personalized Goals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-400">{calculateCalories()}</div>
                      <div className="text-zinc-400">Daily Calories</div>
                    </div>
                    <div className="space-y-2">
                      {(() => {
                        const macros = calculateMacros(calculateCalories());
                        return Object.entries(macros).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="capitalize">{key.replace('_', ' ')}:</span>
                            <span className="font-semibold">{value}g</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="border-zinc-600 text-zinc-300"
          >
            Previous
          </Button>
          <Button
            onClick={handleNext}
            disabled={!isStepValid()}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            {step === 3 ? 'Complete Setup' : 'Next'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}


