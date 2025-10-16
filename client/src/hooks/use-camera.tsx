import { useState, useRef, useCallback } from "react";

export function useCamera() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [isStarting, setIsStarting] = useState(false); // Track if camera is currently starting
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    // Prevent multiple simultaneous calls to startCamera
    if (isStarting) {
      console.warn('Camera is already starting, skipping duplicate call');
      return;
    }
    
    try {
      setIsStarting(true);
      setError(null);
      
      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported in this browser");
      }

      // --- OPTIMAL FIX APPLIED HERE ---
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          // 1. Add check for track readiness before stopping.
          if (track.readyState === 'live') {
            track.stop();
          }
        });
        // 2. Aggressively clear the reference after stopping tracks.
        streamRef.current = null;
      }

      // Try with less restrictive constraints first
      let constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 960, max: 1080 }
        },
        audio: false
      };

      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          // Wait for video to be ready before setting streaming to true
          await new Promise<void>((resolve) => {
            const video = videoRef.current!;
            const handleLoadedMetadata = () => {
              video.removeEventListener('loadedmetadata', handleLoadedMetadata);
              setIsStreaming(true);
              resolve();
            };
            
            if (video.readyState >= 1) {
              // Video is already ready
              setIsStreaming(true);
              resolve();
            } else {
              video.addEventListener('loadedmetadata', handleLoadedMetadata);
            }
          });
        }
      } catch (specificErr) {
        // Try with basic constraints if specific ones fail
        const basicConstraints = {
          video: true,
          audio: false
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(basicConstraints);
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          // Wait for video to be ready before setting streaming to true
          await new Promise<void>((resolve) => {
            const video = videoRef.current!;
            const handleLoadedMetadata = () => {
              video.removeEventListener('loadedmetadata', handleLoadedMetadata);
              setIsStreaming(true);
              resolve();
            };
            
            if (video.readyState >= 1) {
              // Video is already ready
              setIsStreaming(true);
              resolve();
            } else {
              video.addEventListener('loadedmetadata', handleLoadedMetadata);
            }
          });
        }
      }
    } catch (err) {
      let errorMessage = "Camera unavailable";
      
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          errorMessage = "Camera permission denied. Please allow camera access and try again.";
        } else if (err.name === "NotFoundError") {
          errorMessage = "No camera found. Use the upload button instead.";
        } else if (err.name === "NotReadableError") {
          errorMessage = "Camera in use by another app. Use upload instead.";
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      console.error("Camera error:", err);
    } finally {
      setIsStarting(false);
    }
  }, [facingMode, isStarting]);

  const stopCamera = useCallback(() => {
    // Prevent stopping camera while it's starting
    if (isStarting) {
      console.warn('Camera is currently starting, cannot stop');
      return;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        // Check for track readiness before stopping
        if (track.readyState === 'live') {
          track.stop();
        }
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsStreaming(false);
  }, [isStarting]);

  const switchCamera = useCallback(async () => {
    const newFacingMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newFacingMode);
    
    // Restart camera with new facing mode
    if (isStreaming) {
      setIsStreaming(false);
      // Apply the same robust cleanup pattern here
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          // Check for track readiness before stopping
          if (track.readyState === 'live') {
            track.stop();
          }
        });
        streamRef.current = null;
      }
      
      // Use await instead of setTimeout for better control flow
      try {
        await startCamera();
      } catch (error) {
        console.error('Failed to restart camera after switching:', error);
        // Optionally show an error to the user
      }
    }
  }, [facingMode, isStreaming, startCamera]);

  const capturePhoto = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!videoRef.current || !isStreaming) {
        reject(new Error("Camera not ready"));
        return;
      }

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("Failed to create canvas context"));
        return;
      }

      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      context.drawImage(videoRef.current, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to capture photo"));
        }
      }, "image/jpeg", 0.8);
    });
  }, [isStreaming]);

  return {
    videoRef,
    isStreaming,
    error,
    facingMode,
    startCamera,
    stopCamera,
    switchCamera,
    capturePhoto
  };
}