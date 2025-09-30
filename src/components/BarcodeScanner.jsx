import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, X, Search, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';

const BarcodeScanner = ({ onClose, onBarcodeDetected }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [streaming, setStreaming] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStreaming(true);
        setError(null);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Camera access denied. Please allow camera access to scan barcodes.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setStreaming(false);
  };

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) return null;

    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const scanBarcode = async () => {
    if (isScanning) return;
    
    setIsScanning(true);
    setError(null);

    try {
      const imageData = captureFrame();
      if (!imageData) {
        setError('Failed to capture image');
        return;
      }

      // Call barcode detection API
      const response = await fetch('/api/barcode/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageData }),
      });

      if (!response.ok) {
        throw new Error('Barcode detection failed');
      }

      const result = await response.json();
      
      if (result.barcode) {
        onBarcodeDetected(result.barcode, result.productInfo);
      } else {
        setError('No barcode detected. Try positioning the barcode in the center of the frame.');
      }
    } catch (err) {
      console.error('Barcode scanning error:', err);
      setError('Failed to scan barcode. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-2xl"
      >
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Barcode Scanner
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
          
          <CardContent className="space-y-4">
            {/* Camera Preview */}
            <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-zinc-800">
              {!streaming && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400">
                  <Camera className="w-8 h-8 mb-2" />
                  <span>Starting camera...</span>
                </div>
              )}
              
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Scanning overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-4 border-2 border-blue-500 rounded-lg">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-blue-500 rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-blue-500 rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-blue-500 rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-blue-500 rounded-br-lg"></div>
                </div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-sm font-medium">
                  Position barcode here
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-400 text-sm text-center bg-red-900/20 p-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={scanBarcode}
                disabled={!streaming || isScanning}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Scan Barcode
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 border-zinc-600 text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </Button>
            </div>

            {/* Instructions */}
            <div className="text-xs text-zinc-400 space-y-1">
              <p>• Position the barcode within the scanning area</p>
              <p>• Ensure good lighting and avoid glare</p>
              <p>• Hold the device steady while scanning</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default BarcodeScanner;

