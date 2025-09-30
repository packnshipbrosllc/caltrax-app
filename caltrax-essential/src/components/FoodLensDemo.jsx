import React, { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Mic, Zap, Leaf, Shield, Info, Loader2, LogOut, BarChart3, Utensils, Settings, QrCode, Plus, CreditCard } from "lucide-react";
import { Button } from "./ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Progress } from "./ui/Progress";
import { addFoodEntry } from "../utils/macroStorage";
import { simpleStorage } from "../utils/simpleStorage";
import PaymentModal from "./PaymentModal";
import BarcodeScanner from "./BarcodeScanner";
import ManualFoodInput from "./ManualFoodInput";
import { hasAdminAccess } from "../utils/security";
/**
 * FoodLens Vision Demo
 * -------------------------------------------------
 * A single-file demo that:
 * - Streams the device camera
 * - Captures a frame every N seconds
 * - Sends it to the ChatGPT Vision model for nutrition extraction
 * - Speaks nutrition facts via voice (Web Speech or OpenAI TTS)
 * - Shows a 1-10 health score, with animated pros/cons
 *
 * Notes:
 * - Paste your OpenAI API key in the input to make live calls.
 * - This is a concept demo. Accuracy depends on what the model can infer visually.
 * - For packaged foods, try to include the label in view for better results.
 * - Works best in Chrome/Edge on desktop or Android. iOS Safari camera constraints
 *   may require HTTPS and user gestures.
 */

// Note: Nutrition analysis now handled by secure backend API

// Basic scoring heuristic if the model doesn't provide one. You can tweak this freely.
function computeHealthScore(nutrition) {
  if (!nutrition) return 5;
  const { protein_g = 0, fat_g = 0, carbs_g = 0, calories = 0 } = nutrition;
  // High-protein, moderate calories -> higher score; very high fat/sugar-like carbs -> lower
  let score = 5;
  if (protein_g >= 20) score += 2; else if (protein_g >= 10) score += 1;
  if (calories <= 200) score += 1; else if (calories >= 500) score -= 1;
  // Penalize very high fat
  if (fat_g >= 20) score -= 2; else if (fat_g >= 10) score -= 1;
  // Penalize very high carbs (proxy for simple sugars)
  if (carbs_g >= 50) score -= 2; else if (carbs_g >= 30) score -= 1;
  return Math.max(1, Math.min(10, Math.round(score)));
}

// Speak with browser TTS as a simple default (no API calls required)
function speakWithBrowserTTS(text) {
  try {
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.0;
    utter.pitch = 1.0;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  } catch (e) {
    console.warn("SpeechSynthesis failed:", e);
  }
}

// Experimental: Speak using OpenAI TTS. Requires a valid API key and user gesture on some browsers.
async function speakWithOpenAI({ apiKey, text, voice = "alloy" }) {
  if (!apiKey) return speakWithBrowserTTS(text);
  try {
    const res = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice,
        input: text,
        format: "mp3",
      }),
    });
    if (!res.ok) throw new Error(`TTS HTTP ${res.status}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    await audio.play();
  } catch (e) {
    console.warn("OpenAI TTS failed, falling back to browser TTS.", e);
    speakWithBrowserTTS(text);
  }
}

// Note: JSON parsing now handled by secure backend API

export default function FoodLensDemo({ onLogout, onShowDashboard, onShowMealPlan, onShowAdmin, onShowSubscriptionManagement, user: propUser }) {
  console.log('🔍 === FOODLENSDEMO RENDER ===');
  console.log('FoodLensDemo - propUser:', propUser);
  console.log('FoodLensDemo - onLogout:', onLogout);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [streaming, setStreaming] = useState(false);
  const [autoScan, setAutoScan] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [user, setUser] = useState(null);
  const [useOpenAITTS, setUseOpenAITTS] = useState(false);
  const [error, setError] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [result, setResult] = useState({
    name: "—",
    nutrition: { calories: 0, protein_g: 0, fat_g: 0, carbs_g: 0 },
    pros: [],
    cons: [],
    confidence: 0,
    score: 0,
    lastUpdated: null,
  });

  const score = result.score || computeHealthScore(result.nutrition);

  useEffect(() => {
    console.log('🔍 === FOODLENSDEMO USEEFFECT DEBUG START ===');
    // Check authentication on mount
    const userData = simpleStorage.getItem('caltrax-user');
    const hasSignedUp = simpleStorage.getItem('caltrax-signed-up');
    
    console.log('FoodLensDemo - userData:', userData);
    console.log('FoodLensDemo - hasSignedUp:', hasSignedUp);
    
    if (userData && hasSignedUp) {
      console.log('FoodLensDemo - User authenticated, setting up');
      setUser(userData);
      setIsAuthenticated(true);
      // No need to check subscription status for now
    } else {
      console.log('FoodLensDemo - User NOT authenticated, calling logout');
      console.log('🔍 === FOODLENSDEMO CALLING LOGOUT ===');
      // Redirect to login if not authenticated
      onLogout();
      return;
    }
    console.log('🔍 === FOODLENSDEMO USEEFFECT DEBUG END ===');

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(t => t.stop());
      }
    };
  }, [onLogout]);

  // Separate effect for camera initialization
  const startCamera = async () => {
    try {
      console.log("Requesting camera access...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }, 
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStreaming(true);
        console.log("Camera started successfully");
      }
    } catch (e) {
      console.error("Camera access error:", e);
      setError(`Camera access denied: ${e.message}`);
    }
  };

  const checkSubscriptionStatus = async (token) => {
    try {
      const response = await fetch('http://localhost:5001/api/payments/subscription', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubscriptionStatus(data);
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  // Auto-scan interval
  useEffect(() => {
    if (!autoScan) return;
    const id = setInterval(() => {
      analyzeFrame();
    }, 3000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoScan, useOpenAITTS]);

  async function captureFrameBase64() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.8); // base64 dataURL
  }

  async function analyzeFrame() {
    if (isAnalyzing) return;
    
    // Check authentication first
    if (!isAuthenticated || !userToken) {
      setError('Please sign up or login to use the nutrition analysis feature.');
      return;
    }
    
    const dataUrl = await captureFrameBase64();
    if (!dataUrl) return;
    setIsAnalyzing(true);

    try {
      // Call our secure backend with authentication
      const response = await fetch('http://localhost:5001/api/nutrition/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`, // Required for authentication
        },
        body: JSON.stringify({
          image: dataUrl,
          sessionId: sessionStorage.getItem('sessionId') || generateSessionId()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle specific error codes
        if (errorData.code === 'NO_TOKEN' || errorData.code === 'TOKEN_EXPIRED') {
          // Token expired or missing, redirect to login
          localStorage.removeItem('caltrax-token');
          localStorage.removeItem('caltrax-user');
          setIsAuthenticated(false);
          setUserToken(null);
          setUser(null);
          setError('Session expired. Please login again.');
          onLogout();
          return;
        }
        
        if (errorData.code === 'RATE_LIMIT_EXCEEDED') {
          setError('Too many requests. Please wait before trying again.');
          return;
        }
        
        throw new Error(errorData.error || 'Analysis failed');
      }

      const result = await response.json();
      
      // Process the result (same as before)
      const score = result.health_score || computeHealthScore(result.nutrition);
      const stamped = {
        ...result,
        score,
        lastUpdated: new Date().toLocaleTimeString(),
      };
      setResult(stamped);

      // Add to macro tracking
      addFoodEntry(stamped, propUser?.id);

      // Voice output
      const ttsText = `${result.name}. Calories ${result.nutrition.calories}. Protein ${result.nutrition.protein_g} grams. Fat ${result.nutrition.fat_g} grams. Carbs ${result.nutrition.carbs_g} grams. Health score ${score} out of 10.`;
      if (useOpenAITTS) {
        await speakWithOpenAI({ apiKey: '', text: ttsText, voice: "alloy" });
      } else {
        speakWithBrowserTTS(ttsText);
      }

    } catch (error) {
      console.error('Analysis error:', error);
      setError(error.message || 'Failed to analyze nutrition');
    } finally {
      setIsAnalyzing(false);
    }
  }

  // Helper function for session ID
  function generateSessionId() {
    return 'session_' + Math.random().toString(36).substr(2, 9);
  }

  const handleBarcodeDetected = (barcode, productInfo) => {
    // In a real app, you'd look up the barcode in a food database
    const foodData = {
      name: productInfo?.name || `Product (${barcode})`,
      nutrition: productInfo?.nutrition || {
        calories: 0,
        protein_g: 0,
        fat_g: 0,
        carbs_g: 0
      },
      score: productInfo?.score || 6,
      confidence: 100,
      source: 'barcode',
      barcode: barcode
    };

    addFoodEntry(foodData, propUser?.id);
    setResult(foodData);
    setShowBarcodeScanner(false);
  };

  const handleFoodAdded = (foodData) => {
    setResult(foodData);
    setShowManualInput(false);
  };

  const scoreLabel = useMemo(() => {
    if (score >= 9) return "Excellent";
    if (score >= 7) return "Good";
    if (score >= 5) return "Okay";
    if (score >= 3) return "Poor";
    return "Very Poor";
  }, [score]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-zinc-100">
      <div className="max-w-6xl mx-auto p-6">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">CalTrax AI</h1>
          </div>
        <div className="flex items-center gap-2">
          <div className="bg-green-500/20 border border-green-500/30 rounded-xl px-3 py-2 text-sm text-green-300">
            🔒 Authenticated as {user?.name || 'User'}
          </div>
          {subscriptionStatus && !subscriptionStatus.hasActiveSubscription && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
            >
              Upgrade to Premium
            </button>
          )}
          {subscriptionStatus && subscriptionStatus.hasActiveSubscription && (
            <div className="bg-purple-500/20 border border-purple-500/30 rounded-xl px-3 py-2 text-sm text-purple-300">
              ✨ {subscriptionStatus.planType} Plan
            </div>
          )}
            <Button variant="secondary" onClick={() => analyzeFrame()} disabled={isAnalyzing}>
              {isAnalyzing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Zap className="w-4 h-4 mr-1" />}
              Analyze Now
            </Button>
            <Button variant="outline" onClick={onShowDashboard} className="border-zinc-600 text-zinc-300 hover:bg-zinc-800">
              <BarChart3 className="w-4 h-4 mr-1" />
              Dashboard
            </Button>
            <Button variant="outline" onClick={onShowMealPlan} className="border-zinc-600 text-zinc-300 hover:bg-zinc-800">
              <Utensils className="w-4 h-4 mr-1" />
              Meal Plan
            </Button>
            <Button variant="outline" onClick={onShowSubscriptionManagement} className="border-blue-600 text-blue-300 hover:bg-blue-800">
              <CreditCard className="w-4 h-4 mr-1" />
              Subscription
            </Button>
            {hasAdminAccess() && (
              <Button variant="outline" onClick={onShowAdmin} className="border-purple-600 text-purple-300 hover:bg-purple-800">
                <Settings className="w-4 h-4 mr-1" />
                Admin
              </Button>
            )}
            <Button variant="outline" onClick={onLogout} className="border-zinc-600 text-zinc-300 hover:bg-zinc-800">
              <LogOut className="w-4 h-4 mr-1" />
              Logout
            </Button>
          </div>
        </header>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Camera preview */}
          <Card className="bg-zinc-900/60 border-zinc-800 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Camera className="w-5 h-5" /> Live Camera</CardTitle>
              <div className="flex items-center gap-3 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={autoScan} onChange={(e) => setAutoScan(e.target.checked)} />
                  Auto-scan
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={useOpenAITTS} onChange={(e) => setUseOpenAITTS(e.target.checked)} />
                  OpenAI Voice
                </label>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-zinc-800">
                {!streaming && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400">
                    <Camera className="w-8 h-8 mb-3" />
                    <span className="mb-3">Camera access required for food analysis</span>
                    <Button
                      onClick={startCamera}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Start Camera
                    </Button>
                  </div>
                )}
                <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <div className="flex items-center gap-3 mt-3 text-xs text-zinc-400">
                <Mic className="w-4 h-4" />
                <span>Voice: {useOpenAITTS ? "OpenAI TTS (alloy)" : "Browser TTS"}</span>
              </div>
              
              {/* Alternative Input Methods */}
              <div className="mt-4 space-y-2">
                <div className="text-xs text-zinc-400 mb-2">Or try these methods:</div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowBarcodeScanner(true)}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                  >
                    <QrCode className="w-4 h-4 mr-1" />
                    Barcode
                  </Button>
                  <Button
                    onClick={() => setShowManualInput(true)}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Manual
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right: Analysis panel */}
          <Card className="bg-zinc-900/60 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="w-5 h-5" /> Real‑time Nutrition
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-sm text-zinc-400">Detected</div>
                      <div className="text-xl font-semibold">{result.name}</div>
                    </div>
                    <div className="text-xs text-zinc-500">Updated: {result.lastUpdated || "—"}</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-800 p-4 bg-zinc-950/40">
                  <div className="text-sm text-zinc-400 mb-1">Calories</div>
                  <div className="text-2xl font-semibold">{result.nutrition?.calories ?? 0}</div>
                </div>
                <div className="rounded-2xl border border-zinc-800 p-4 bg-zinc-950/40">
                  <div className="text-sm text-zinc-400 mb-1">Protein (g)</div>
                  <div className="text-2xl font-semibold">{result.nutrition?.protein_g ?? 0}</div>
                </div>
                <div className="rounded-2xl border border-zinc-800 p-4 bg-zinc-950/40">
                  <div className="text-sm text-zinc-400 mb-1">Fat (g)</div>
                  <div className="text-2xl font-semibold">{result.nutrition?.fat_g ?? 0}</div>
                </div>
                <div className="rounded-2xl border border-zinc-800 p-4 bg-zinc-950/40">
                  <div className="text-sm text-zinc-400 mb-1">Carbs (g)</div>
                  <div className="text-2xl font-semibold">{result.nutrition?.carbs_g ?? 0}</div>
                </div>

                <div className="col-span-2 rounded-2xl border border-zinc-800 p-4 bg-zinc-950/40">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-zinc-400">Health Score</div>
                    <div className="text-sm text-zinc-300">{scoreLabel}</div>
                  </div>
                  <Progress value={(score / 10) * 100} className="h-3" />
                  <div className="mt-2 text-3xl font-bold tracking-tight">{score}/10</div>
                </div>

                <div className="col-span-2 grid md:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-zinc-800 p-4 bg-zinc-950/40">
                    <div className="flex items-center gap-2 mb-2 text-emerald-400"><Shield className="w-4 h-4" /> Pros</div>
                    <AnimatePresence>
                      {result.pros?.length ? (
                        result.pros.map((p, i) => (
                          <motion.div
                            key={p+"-"+i}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.25 }}
                            className="text-sm text-zinc-200 mb-1"
                          >
                            • {p}
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-sm text-zinc-500">No pros detected yet.</div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="rounded-2xl border border-zinc-800 p-4 bg-zinc-950/40">
                    <div className="flex items-center gap-2 mb-2 text-red-400"><Info className="w-4 h-4" /> Cons</div>
                    <AnimatePresence>
                      {result.cons?.length ? (
                        result.cons.map((c, i) => (
                          <motion.div
                            key={c+"-"+i}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.25 }}
                            className="text-sm text-zinc-200 mb-1"
                          >
                            • {c}
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-sm text-zinc-500">No cons detected yet.</div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="col-span-2 text-xs text-zinc-500 mt-2">
                  Confidence: {(result.confidence * 100 || 0).toFixed(0)}%
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <footer className="mt-6 text-xs text-zinc-500">
          <p>
            Tip: For best results, hold the camera steady and ensure the food (and nutrition label, if applicable) is well lit.
            This demo sends a frame every ~3 seconds while Auto‑scan is enabled.
          </p>
        </footer>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentSuccess={(data) => {
          setSubscriptionStatus({
            hasActiveSubscription: true,
            planType: data.planType,
            status: 'active',
            currentPeriodEnd: data.periodEnd
          });
        }}
        userToken={userToken}
      />

      {/* Barcode Scanner Modal */}
      {showBarcodeScanner && (
        <BarcodeScanner
          onClose={() => setShowBarcodeScanner(false)}
          onBarcodeDetected={handleBarcodeDetected}
        />
      )}

      {/* Manual Food Input Modal */}
      {showManualInput && (
        <ManualFoodInput
          onClose={() => setShowManualInput(false)}
          onFoodAdded={handleFoodAdded}
        />
      )}
    </div>
  );
}
