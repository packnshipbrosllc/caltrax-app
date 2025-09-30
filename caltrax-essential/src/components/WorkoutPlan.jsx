import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Dumbbell, 
  Clock, 
  Target, 
  Calendar,
  ArrowLeft, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Play,
  Timer
} from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { simpleStorage } from '../utils/simpleStorage';
import { planStorage } from '../utils/planStorage';

export default function WorkoutPlan({ onBack, user }) {
  
  const [workoutPlan, setWorkoutPlan] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);
  const [rateLimitInfo, setRateLimitInfo] = useState({ canGenerate: true, daysUntilNext: 0 });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Load existing workout plan and check rate limits
  useEffect(() => {
    
    if (user?.email) {
      // Load latest workout plan
      const latestPlan = planStorage.getLatestWorkoutPlan(user.email);
      if (latestPlan) {
        setWorkoutPlan(latestPlan);
      }

      // Check rate limits
      const rateLimit = planStorage.canGeneratePlan(user.email, 'workout');
      setRateLimitInfo(rateLimit);
    }
  }, [user]);

  // Error boundary check after hooks
  if (!user) {
    console.error('WorkoutPlan: No user provided');
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

  // Check if user can generate a new workout plan (once per week)
  const canGenerateWorkout = () => {
    return rateLimitInfo.canGenerate;
  };

  // Generate workout plan based on user goals
  const generateWorkoutPlan = () => {
    const { profile } = user;
    if (!profile) return null;

    const { goals, weight, height, age, activityLevel } = profile;
    const isBeginner = activityLevel === 'sedentary' || activityLevel === 'light';
    const isIntermediate = activityLevel === 'moderate';
    const isAdvanced = activityLevel === 'very' || activityLevel === 'extreme';

    // Determine workout focus based on goals
    let workoutFocus = 'general';
    if (goals.includes('build_muscle') || goals.includes('gain_weight')) {
      workoutFocus = 'strength';
    } else if (goals.includes('burn_fat') || goals.includes('lose_weight')) {
      workoutFocus = 'cardio';
    } else if (goals.includes('build_endurance')) {
      workoutFocus = 'endurance';
    }

    // Generate 7 days of workouts
    const weeklyPlan = days.map((day, dayIndex) => {
      const isWeekend = dayIndex >= 5; // Saturday, Sunday
      const isRestDay = dayIndex === 6; // Sunday
      
      if (isRestDay) {
        return {
          day,
          type: 'Rest Day',
          duration: 0,
          exercises: [],
          description: 'Active recovery or complete rest'
        };
      }

      const workout = generateDayWorkout(dayIndex, workoutFocus, isBeginner, isIntermediate, isAdvanced, isWeekend);
      return {
        day,
        type: workout.type,
        duration: workout.duration,
        exercises: workout.exercises,
        description: workout.description
      };
    });

    return weeklyPlan;
  };

  const generateDayWorkout = (dayIndex, focus, isBeginner, isIntermediate, isAdvanced, isWeekend) => {
    const workoutTypes = {
      strength: {
        beginner: [
          { type: 'Upper Body', exercises: ['Push-ups', 'Dumbbell Rows', 'Shoulder Press', 'Bicep Curls', 'Tricep Dips'] },
          { type: 'Lower Body', exercises: ['Squats', 'Lunges', 'Glute Bridges', 'Calf Raises', 'Wall Sits'] },
          { type: 'Full Body', exercises: ['Burpees', 'Mountain Climbers', 'Plank', 'Deadlifts', 'Pull-ups'] }
        ],
        intermediate: [
          { type: 'Push Day', exercises: ['Bench Press', 'Overhead Press', 'Dips', 'Incline Press', 'Lateral Raises'] },
          { type: 'Pull Day', exercises: ['Pull-ups', 'Bent-over Rows', 'Lat Pulldowns', 'Face Pulls', 'Hammer Curls'] },
          { type: 'Leg Day', exercises: ['Squats', 'Romanian Deadlifts', 'Leg Press', 'Walking Lunges', 'Calf Raises'] }
        ],
        advanced: [
          { type: 'Push Day', exercises: ['Barbell Bench Press', 'Military Press', 'Weighted Dips', 'Incline DB Press', 'Lateral Raises', 'Tricep Extensions'] },
          { type: 'Pull Day', exercises: ['Weighted Pull-ups', 'Barbell Rows', 'Cable Rows', 'Rear Delt Flyes', 'Barbell Curls', 'Hammer Curls'] },
          { type: 'Leg Day', exercises: ['Back Squats', 'Deadlifts', 'Bulgarian Split Squats', 'Leg Press', 'Walking Lunges', 'Calf Raises'] }
        ]
      },
      cardio: {
        beginner: [
          { type: 'Cardio', exercises: ['Walking', 'Light Jogging', 'Cycling', 'Swimming', 'Dancing'] },
          { type: 'HIIT', exercises: ['Jumping Jacks', 'High Knees', 'Butt Kicks', 'Mountain Climbers', 'Burpees'] },
          { type: 'Low Impact', exercises: ['Walking', 'Swimming', 'Cycling', 'Elliptical', 'Rowing'] }
        ],
        intermediate: [
          { type: 'Cardio', exercises: ['Running', 'Cycling', 'Swimming', 'Rowing', 'Stair Climbing'] },
          { type: 'HIIT', exercises: ['Burpees', 'Mountain Climbers', 'Jump Squats', 'Push-ups', 'Plank Jacks'] },
          { type: 'Circuit', exercises: ['Jumping Jacks', 'Push-ups', 'Squats', 'Mountain Climbers', 'Plank'] }
        ],
        advanced: [
          { type: 'Cardio', exercises: ['Running', 'Cycling', 'Swimming', 'Rowing', 'Stair Climbing', 'Skipping'] },
          { type: 'HIIT', exercises: ['Burpees', 'Mountain Climbers', 'Jump Squats', 'Push-ups', 'Plank Jacks', 'Box Jumps'] },
          { type: 'Circuit', exercises: ['Jumping Jacks', 'Push-ups', 'Squats', 'Mountain Climbers', 'Plank', 'Burpees'] }
        ]
      },
      endurance: {
        beginner: [
          { type: 'Endurance', exercises: ['Walking', 'Light Jogging', 'Cycling', 'Swimming', 'Elliptical'] },
          { type: 'Interval', exercises: ['Walk/Run Intervals', 'Cycling Intervals', 'Swimming Laps', 'Rowing Intervals'] }
        ],
        intermediate: [
          { type: 'Endurance', exercises: ['Running', 'Cycling', 'Swimming', 'Rowing', 'Stair Climbing'] },
          { type: 'Interval', exercises: ['Run Intervals', 'Cycling Intervals', 'Swimming Intervals', 'Rowing Intervals'] }
        ],
        advanced: [
          { type: 'Endurance', exercises: ['Long Distance Running', 'Cycling', 'Swimming', 'Rowing', 'Stair Climbing'] },
          { type: 'Interval', exercises: ['Sprint Intervals', 'Cycling Intervals', 'Swimming Intervals', 'Rowing Intervals'] }
        ]
      },
      general: {
        beginner: [
          { type: 'Full Body', exercises: ['Push-ups', 'Squats', 'Lunges', 'Plank', 'Mountain Climbers'] },
          { type: 'Cardio', exercises: ['Walking', 'Light Jogging', 'Cycling', 'Swimming', 'Dancing'] },
          { type: 'Flexibility', exercises: ['Yoga', 'Stretching', 'Pilates', 'Tai Chi', 'Meditation'] }
        ],
        intermediate: [
          { type: 'Full Body', exercises: ['Burpees', 'Mountain Climbers', 'Push-ups', 'Squats', 'Plank'] },
          { type: 'Cardio', exercises: ['Running', 'Cycling', 'Swimming', 'Rowing', 'Stair Climbing'] },
          { type: 'Strength', exercises: ['Push-ups', 'Pull-ups', 'Squats', 'Lunges', 'Plank'] }
        ],
        advanced: [
          { type: 'Full Body', exercises: ['Burpees', 'Mountain Climbers', 'Push-ups', 'Squats', 'Plank', 'Box Jumps'] },
          { type: 'Cardio', exercises: ['Running', 'Cycling', 'Swimming', 'Rowing', 'Stair Climbing', 'Skipping'] },
          { type: 'Strength', exercises: ['Weighted Push-ups', 'Pull-ups', 'Squats', 'Lunges', 'Plank', 'Deadlifts'] }
        ]
      }
    };

    const level = isBeginner ? 'beginner' : isIntermediate ? 'intermediate' : 'advanced';
    const availableWorkouts = workoutTypes[focus][level];
    const selectedWorkout = availableWorkouts[dayIndex % availableWorkouts.length];

    const duration = isWeekend ? 30 : isBeginner ? 20 : isIntermediate ? 45 : 60;

    return {
      type: selectedWorkout.type,
      duration,
      exercises: selectedWorkout.exercises,
      description: `${selectedWorkout.type} workout for ${duration} minutes`
    };
  };

  const handleGeneratePlan = async () => {
    if (!user?.email) {
      console.error('No user email found');
      return;
    }

    setIsGenerating(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const plan = generateWorkoutPlan();
      if (plan) {
        // Save the workout plan
        const savedPlan = planStorage.saveWorkoutPlan(user.email, plan);
        setWorkoutPlan(savedPlan);
        
        // Record the generation for rate limiting
        planStorage.recordPlanGeneration(user.email, 'workout');
        
        // Update rate limit info
        const rateLimit = planStorage.canGeneratePlan(user.email, 'workout');
        setRateLimitInfo(rateLimit);
        
        console.log('Workout plan generated and saved:', savedPlan);
      }
    } catch (error) {
      console.error('Error generating workout plan:', error);
    } finally {
      setIsGenerating(false);
    }
  };


  if (!user?.profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Profile Required</h2>
          <p className="text-zinc-400 mb-4">Please complete your profile to generate a workout plan</p>
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={onBack}
              className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight">Your Workout Plan</h1>
          </div>
          <div className="flex items-center gap-4">
            {!canGenerateWorkout() && (
              <div className="text-sm text-yellow-400 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Next generation available in {rateLimitInfo.daysUntilNext} days
              </div>
            )}
            <Button 
              onClick={handleGeneratePlan}
              disabled={isGenerating || !canGenerateWorkout()}
              className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Generate Plan
                </>
              )}
            </Button>
          </div>
        </div>

        {/* User Goals Summary */}
        <Card className="bg-zinc-900/60 border-zinc-800 mb-6">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{user.profile.goals.join(', ')}</div>
                <div className="text-sm text-zinc-400">Fitness Goals</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{user.profile.activityLevel}</div>
                <div className="text-sm text-zinc-400">Activity Level</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{user.profile.weight} lbs</div>
                <div className="text-sm text-zinc-400">Weight</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{user.profile.height}"</div>
                <div className="text-sm text-zinc-400">Height</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Workout Plan */}
        {workoutPlan ? (
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Days List */}
            <div className="lg:col-span-1">
              <Card className="bg-zinc-900/60 border-zinc-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Weekly Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-1">
                    {workoutPlan.map((day, index) => (
                      <button
                        key={day.day}
                        onClick={() => setSelectedDay(index)}
                        className={`w-full text-left p-4 hover:bg-zinc-800 transition-colors ${
                          selectedDay === index ? 'bg-zinc-800 border-l-4 border-green-400' : ''
                        }`}
                      >
                        <div className="font-medium">{day.day}</div>
                        <div className="text-sm text-zinc-400">{day.type}</div>
                        <div className="text-xs text-zinc-500">{day.duration} min</div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Selected Day Details */}
            <div className="lg:col-span-3">
              <Card className="bg-zinc-900/60 border-zinc-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Dumbbell className="w-5 h-5" />
                    {workoutPlan[selectedDay].day} - {workoutPlan[selectedDay].type}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2 text-green-400">
                        <Timer className="w-4 h-4" />
                        <span className="font-medium">{workoutPlan[selectedDay].duration} minutes</span>
                      </div>
                    </div>
                    <p className="text-zinc-400">{workoutPlan[selectedDay].description}</p>
                  </div>

                  {workoutPlan[selectedDay].exercises.length > 0 ? (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Exercises</h3>
                      <div className="grid gap-3">
                        {workoutPlan[selectedDay].exercises.map((exercise, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg"
                          >
                            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 font-bold text-sm">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{exercise}</div>
                              <div className="text-sm text-zinc-400">
                                {workoutPlan[selectedDay].type === 'Rest Day' ? 'Rest' : '3 sets x 12 reps'}
                              </div>
                            </div>
                            <Button size="sm" variant="outline" className="border-zinc-600 text-zinc-300 hover:bg-zinc-700">
                              <Play className="w-4 h-4" />
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                      <p className="text-zinc-400">Rest day - enjoy your recovery!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card className="bg-zinc-900/60 border-zinc-800">
            <CardContent className="text-center py-12">
              <Dumbbell className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Workout Plan Yet</h3>
              <p className="text-zinc-400 mb-6">
                Generate your personalized workout plan based on your goals and fitness level.
              </p>
              <Button 
                onClick={handleGeneratePlan}
                disabled={isGenerating || !canGenerateWorkout()}
                className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Generate Your Plan
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
