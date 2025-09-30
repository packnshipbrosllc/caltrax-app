import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, X, Utensils, Calculator } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { addFoodEntry } from '../utils/macroStorage';

const ManualFoodInput = ({ onClose, onFoodAdded }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('serving');
  const [customFood, setCustomFood] = useState({
    name: '',
    calories: '',
    protein: '',
    fat: '',
    carbs: '',
    servingSize: '100g'
  });
  const [showCustomForm, setShowCustomForm] = useState(false);

  // Sample food database - in a real app, this would be much larger and come from an API
  const foodDatabase = [
    { name: 'Chicken Breast (cooked)', calories: 165, protein: 31, fat: 3.6, carbs: 0, serving: '100g' },
    { name: 'Brown Rice (cooked)', calories: 111, protein: 2.6, fat: 0.9, carbs: 23, serving: '100g' },
    { name: 'Salmon (cooked)', calories: 208, protein: 25, fat: 12, carbs: 0, serving: '100g' },
    { name: 'Avocado', calories: 160, protein: 2, fat: 15, carbs: 9, serving: '100g' },
    { name: 'Greek Yogurt (plain)', calories: 59, protein: 10, fat: 0.4, carbs: 3.6, serving: '100g' },
    { name: 'Eggs (large)', calories: 70, protein: 6, fat: 5, carbs: 0.6, serving: '1 piece' },
    { name: 'Oatmeal (cooked)', calories: 68, protein: 2.4, fat: 1.4, carbs: 12, serving: '100g' },
    { name: 'Banana (medium)', calories: 105, protein: 1.3, fat: 0.4, carbs: 27, serving: '1 piece' },
    { name: 'Almonds', calories: 579, protein: 21, fat: 50, carbs: 22, serving: '100g' },
    { name: 'Sweet Potato (cooked)', calories: 86, protein: 1.6, fat: 0.1, carbs: 20, serving: '100g' },
    { name: 'Broccoli (cooked)', calories: 35, protein: 2.8, fat: 0.4, carbs: 7, serving: '100g' },
    { name: 'Quinoa (cooked)', calories: 120, protein: 4.4, fat: 1.9, carbs: 22, serving: '100g' },
    { name: 'Cottage Cheese', calories: 98, protein: 11, fat: 4.3, carbs: 3.4, serving: '100g' },
    { name: 'Apple (medium)', calories: 95, protein: 0.5, fat: 0.3, carbs: 25, serving: '1 piece' },
    { name: 'Spinach (raw)', calories: 23, protein: 2.9, fat: 0.4, carbs: 3.6, serving: '100g' },
    { name: 'Whole Wheat Bread', calories: 247, protein: 13, fat: 4.2, carbs: 41, serving: '100g' },
    { name: 'Tuna (canned in water)', calories: 116, protein: 26, fat: 0.8, carbs: 0, serving: '100g' },
    { name: 'Olive Oil', calories: 884, protein: 0, fat: 100, carbs: 0, serving: '100ml' },
    { name: 'Milk (2%)', calories: 50, protein: 3.3, fat: 2, carbs: 4.7, serving: '100ml' },
    { name: 'Blueberries', calories: 57, protein: 0.7, fat: 0.3, carbs: 14, serving: '100g' }
  ];

  const units = [
    { value: 'serving', label: 'Serving' },
    { value: 'g', label: 'Grams' },
    { value: 'ml', label: 'Milliliters' },
    { value: 'cup', label: 'Cup' },
    { value: 'tbsp', label: 'Tablespoon' },
    { value: 'tsp', label: 'Teaspoon' },
    { value: 'piece', label: 'Piece' }
  ];

  useEffect(() => {
    if (searchQuery.length > 1) {
      searchFoods();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchFoods = () => {
    setIsSearching(true);
    // Simulate API delay
    setTimeout(() => {
      const results = foodDatabase.filter(food =>
        food.name.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 10);
      setSearchResults(results);
      setIsSearching(false);
    }, 300);
  };

  const handleFoodSelect = (food) => {
    setSelectedFood(food);
    setSearchQuery(food.name);
    setSearchResults([]);
  };

  const calculateNutrition = (food, qty, unit) => {
    if (!food) return null;

    let multiplier = qty;
    
    // Convert units to grams for calculation
    if (unit === 'g') {
      multiplier = qty;
    } else if (unit === 'ml') {
      multiplier = qty; // Assuming 1ml = 1g for most foods
    } else if (unit === 'cup') {
      multiplier = qty * 240; // 1 cup = 240g
    } else if (unit === 'tbsp') {
      multiplier = qty * 15; // 1 tbsp = 15g
    } else if (unit === 'tsp') {
      multiplier = qty * 5; // 1 tsp = 5g
    } else if (unit === 'piece') {
      // For pieces, we'll use the serving size as reference
      multiplier = qty;
    } else {
      // Default serving
      multiplier = qty;
    }

    return {
      calories: Math.round(food.calories * multiplier / 100),
      protein: Math.round(food.protein * multiplier / 100 * 10) / 10,
      fat: Math.round(food.fat * multiplier / 100 * 10) / 10,
      carbs: Math.round(food.carbs * multiplier / 100 * 10) / 10
    };
  };

  const handleAddFood = () => {
    if (!selectedFood) return;

    const nutrition = calculateNutrition(selectedFood, quantity, unit);
    if (!nutrition) return;

    const foodData = {
      name: `${selectedFood.name} (${quantity} ${unit})`,
      nutrition,
      score: 7, // Default health score
      confidence: 100,
      source: 'manual'
    };

    addFoodEntry(foodData);
    onFoodAdded(foodData);
    onClose();
  };

  const handleAddCustomFood = () => {
    if (!customFood.name || !customFood.calories) return;

    const nutrition = {
      calories: parseInt(customFood.calories),
      protein_g: parseFloat(customFood.protein) || 0,
      fat_g: parseFloat(customFood.fat) || 0,
      carbs_g: parseFloat(customFood.carbs) || 0
    };

    const foodData = {
      name: customFood.name,
      nutrition,
      score: 6, // Default health score for custom foods
      confidence: 100,
      source: 'custom'
    };

    addFoodEntry(foodData);
    onFoodAdded(foodData);
    onClose();
  };

  const nutrition = selectedFood ? calculateNutrition(selectedFood, quantity, unit) : null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Utensils className="w-5 h-5" />
              Add Food Manually
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {!showCustomForm ? (
              <>
                {/* Search Section */}
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search for food..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {searchResults.map((food, index) => (
                        <div
                          key={index}
                          onClick={() => handleFoodSelect(food)}
                          className="p-3 bg-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-700 transition-colors"
                        >
                          <div className="font-medium text-white">{food.name}</div>
                          <div className="text-sm text-zinc-400">
                            {food.calories} cal • {food.protein}g protein • {food.fat}g fat • {food.carbs}g carbs
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Food Details */}
                {selectedFood && (
                  <div className="space-y-4">
                    <div className="p-4 bg-zinc-800 rounded-lg">
                      <h3 className="font-medium text-white mb-2">{selectedFood.name}</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <label className="text-zinc-400">Quantity</label>
                          <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                            className="w-full mt-1 px-3 py-2 bg-zinc-700 border border-zinc-600 rounded text-white"
                            min="0.1"
                            step="0.1"
                          />
                        </div>
                        <div>
                          <label className="text-zinc-400">Unit</label>
                          <select
                            value={unit}
                            onChange={(e) => setUnit(e.target.value)}
                            className="w-full mt-1 px-3 py-2 bg-zinc-700 border border-zinc-600 rounded text-white"
                          >
                            {units.map(u => (
                              <option key={u.value} value={u.value}>{u.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Nutrition Preview */}
                    {nutrition && (
                      <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                        <h4 className="font-medium text-blue-300 mb-2 flex items-center gap-2">
                          <Calculator className="w-4 h-4" />
                          Nutrition (per {quantity} {unit})
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-400">{nutrition.calories}</div>
                            <div className="text-zinc-400">Calories</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-400">{nutrition.protein}g</div>
                            <div className="text-zinc-400">Protein</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-400">{nutrition.fat}g</div>
                            <div className="text-zinc-400">Fat</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-400">{nutrition.carbs}g</div>
                            <div className="text-zinc-400">Carbs</div>
                          </div>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handleAddFood}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add to Diary
                    </Button>
                  </div>
                )}

                {/* Custom Food Option */}
                <div className="text-center">
                  <button
                    onClick={() => setShowCustomForm(true)}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                  >
                    Can't find your food? Add custom food
                  </button>
                </div>
              </>
            ) : (
              /* Custom Food Form */
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-white mb-2">Add Custom Food</h3>
                  <p className="text-sm text-zinc-400">Enter nutrition information per 100g</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-zinc-400 text-sm">Food Name</label>
                    <input
                      type="text"
                      value={customFood.name}
                      onChange={(e) => setCustomFood(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Homemade Pizza"
                      className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-zinc-400 text-sm">Calories</label>
                      <input
                        type="number"
                        value={customFood.calories}
                        onChange={(e) => setCustomFood(prev => ({ ...prev, calories: e.target.value }))}
                        placeholder="250"
                        className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-400 text-sm">Protein (g)</label>
                      <input
                        type="number"
                        value={customFood.protein}
                        onChange={(e) => setCustomFood(prev => ({ ...prev, protein: e.target.value }))}
                        placeholder="12"
                        step="0.1"
                        className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-400 text-sm">Fat (g)</label>
                      <input
                        type="number"
                        value={customFood.fat}
                        onChange={(e) => setCustomFood(prev => ({ ...prev, fat: e.target.value }))}
                        placeholder="8"
                        step="0.1"
                        className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-400 text-sm">Carbs (g)</label>
                      <input
                        type="number"
                        value={customFood.carbs}
                        onChange={(e) => setCustomFood(prev => ({ ...prev, carbs: e.target.value }))}
                        placeholder="30"
                        step="0.1"
                        className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleAddCustomFood}
                    disabled={!customFood.name || !customFood.calories}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Custom Food
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCustomForm(false)}
                    className="flex-1 border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                  >
                    Back to Search
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ManualFoodInput;

