"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, SwitchCamera, X, Check, RotateCcw, Zap, ZapOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface CameraScannerProps {
  onCapture: (imageBase64: string) => void;
  onClose: () => void;
  isProcessing?: boolean;
}

export function CameraScanner({
  onCapture,
  onClose,
  isProcessing = false,
}: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef(true);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const overlayGuideRef = useRef<HTMLDivElement>(null);

  /** Margin around the overlay guide (fraction of overlay size, e.g. 0.10 = 10% on each side) */
  const OVERLAY_CROP_MARGIN = 0.10;

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment"
  );
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [hasFlash, setHasFlash] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize camera
  const startCamera = useCallback(async () => {
    try {
      setIsInitializing(true);
      
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Check if component is still mounted
      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      
      streamRef.current = stream;

      if (videoRef.current && mountedRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready before playing
        await new Promise<void>((resolve, reject) => {
          if (!videoRef.current) {
            reject(new Error("Video element not available"));
            return;
          }
          
          const video = videoRef.current;
          
          const onLoadedMetadata = () => {
            video.removeEventListener("loadedmetadata", onLoadedMetadata);
            video.removeEventListener("error", onError);
            resolve();
          };
          
          const onError = (e: Event) => {
            video.removeEventListener("loadedmetadata", onLoadedMetadata);
            video.removeEventListener("error", onError);
            reject(e);
          };
          
          video.addEventListener("loadedmetadata", onLoadedMetadata);
          video.addEventListener("error", onError);
          
          // If already loaded
          if (video.readyState >= 1) {
            video.removeEventListener("loadedmetadata", onLoadedMetadata);
            video.removeEventListener("error", onError);
            resolve();
          }
        });
        
        // Only play if still mounted
        if (mountedRef.current && videoRef.current) {
          await videoRef.current.play();
        }
      }

      // Check for flash capability
      if (mountedRef.current) {
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities() as any;
        setHasFlash(!!capabilities?.torch);
        setHasPermission(true);
        setError(null);
      }
    } catch (err: any) {
      // Ignore abort errors when component unmounts
      if (err.name === "AbortError" || !mountedRef.current) {
        return;
      }
      
      console.error("Camera error:", err);
      
      if (mountedRef.current) {
        setHasPermission(false);

        if (err.name === "NotAllowedError") {
          setError("Permissão de câmera negada. Por favor, permita o acesso à câmera.");
        } else if (err.name === "NotFoundError") {
          setError("Nenhuma câmera encontrada no dispositivo.");
        } else {
          setError("Erro ao acessar a câmera. Tente novamente.");
        }
      }
    } finally {
      if (mountedRef.current) {
        setIsInitializing(false);
      }
    }
  }, [facingMode]);

  // Start camera on mount
  useEffect(() => {
    mountedRef.current = true;
    startCamera();

    return () => {
      // Mark as unmounted first
      mountedRef.current = false;
      
      // Cleanup stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      
      // Clear video source
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [startCamera]);

  // Toggle flash
  const toggleFlash = useCallback(async () => {
    if (!streamRef.current || !hasFlash) return;

    try {
      const track = streamRef.current.getVideoTracks()[0];
      await track.applyConstraints({
        advanced: [{ torch: !flashEnabled } as any],
      });
      setFlashEnabled(!flashEnabled);
    } catch (err) {
      console.error("Flash toggle error:", err);
    }
  }, [flashEnabled, hasFlash]);

  // Switch camera
  const switchCamera = useCallback(() => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  }, []);

  // Capture image cropped to the overlay guide + margin (so the crop matches what the user
  // aligned with, with extra margin so markers/corners aren't cut off).
  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !previewContainerRef.current || !overlayGuideRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const container = previewContainerRef.current;
    const overlay = overlayGuideRef.current;

    if (!context) return;

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const containerRect = container.getBoundingClientRect();
    const overlayRect = overlay.getBoundingClientRect();

    // Overlay in container-relative coordinates
    let ox = overlayRect.left - containerRect.left;
    let oy = overlayRect.top - containerRect.top;
    let ow = overlayRect.width;
    let oh = overlayRect.height;

    // Expand by margin (fraction of overlay size on each side)
    const marginX = ow * OVERLAY_CROP_MARGIN;
    const marginY = oh * OVERLAY_CROP_MARGIN;
    let cropLeft = ox - marginX;
    let cropTop = oy - marginY;
    let cropWidth = ow + 2 * marginX;
    let cropHeight = oh + 2 * marginY;

    // Clamp crop to container
    cropLeft = Math.max(0, cropLeft);
    cropTop = Math.max(0, cropTop);
    const cropRight = Math.min(containerRect.width, cropLeft + cropWidth);
    const cropBottom = Math.min(containerRect.height, cropTop + cropHeight);
    cropWidth = cropRight - cropLeft;
    cropHeight = cropBottom - cropTop;

    // object-cover: video is scaled to cover container, centered
    const scale = Math.max(containerRect.width / videoWidth, containerRect.height / videoHeight);
    const displayVideoW = videoWidth * scale;
    const displayVideoH = videoHeight * scale;
    const offsetX = (containerRect.width - displayVideoW) / 2;
    const offsetY = (containerRect.height - displayVideoH) / 2;

    // Map crop rect from container to video coordinates
    let srcX = (cropLeft - offsetX) / scale;
    let srcY = (cropTop - offsetY) / scale;
    let srcW = cropWidth / scale;
    let srcH = cropHeight / scale;

    // Clamp to video bounds
    srcX = Math.max(0, Math.min(videoWidth - 1, srcX));
    srcY = Math.max(0, Math.min(videoHeight - 1, srcY));
    srcW = Math.min(srcW, videoWidth - srcX);
    srcH = Math.min(srcH, videoHeight - srcY);

    // Round to integers for drawImage
    const srcXi = Math.floor(srcX);
    const srcYi = Math.floor(srcY);
    const srcWi = Math.floor(srcW);
    const srcHi = Math.floor(srcH);

    // Output: crop region, optionally scaled down for upload
    const MAX_WIDTH = 1600;
    const JPEG_QUALITY = 0.85;
    let outW = srcWi;
    let outH = srcHi;
    if (outW > MAX_WIDTH) {
      const s = MAX_WIDTH / outW;
      outW = MAX_WIDTH;
      outH = Math.round(srcHi * s);
    }

    canvas.width = outW;
    canvas.height = outH;
    context.drawImage(video, srcXi, srcYi, srcWi, srcHi, 0, 0, outW, outH);

    const imageBase64 = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
    setCapturedImage(imageBase64);

    const compressedSize = (imageBase64.length * 0.75) / 1024 / 1024;
    console.log(`Image captured: crop ${srcWi}x${srcHi} from ${videoWidth}x${videoHeight}, output ${outW}x${outH}, ~${compressedSize.toFixed(2)}MB`);
  }, []);

  // Confirm capture
  const confirmCapture = useCallback(() => {
    if (!capturedImage) return;

    // Remove data URL prefix for API
    const base64Data = capturedImage.replace(/^data:image\/\w+;base64,/, "");
    onCapture(base64Data);
  }, [capturedImage, onCapture]);

  // Retake photo
  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
  }, []);

  // Render initializing state
  if (isInitializing && hasPermission === null) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Iniciando câmera...</h2>
          <p className="text-gray-400">Aguarde enquanto acessamos a câmera</p>
        </div>
      </div>
    );
  }

  // Render permission denied state
  if (hasPermission === false) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6">
        <div className="text-center text-white">
          <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-semibold mb-2">Acesso à Câmera Necessário</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="space-y-3">
            <Button onClick={startCamera} variant="default" className="w-full">
              Tentar Novamente
            </Button>
            <Button onClick={onClose} variant="outline" className="w-full">
              Voltar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera preview or captured image */}
      <div ref={previewContainerRef} className="flex-1 relative overflow-hidden">
        {capturedImage ? (
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full h-full object-contain"
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}

        {/* Dark overlay outside the scan area */}
        {!capturedImage && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Semi-transparent overlay */}
            <div className="absolute inset-0 bg-black/50" />
            
            {/* Clear window with A4 proportions (1:1.414) - centered (crop guide + margin) */}
            <div
              ref={overlayGuideRef}
              className="absolute left-1/2 -translate-x-1/2"
              style={{
                top: '12%',
                width: '80%',
                maxWidth: '340px',
                aspectRatio: '1 / 1.414',
              }}
            >
              {/* Clear area (cut out from overlay) */}
              <div className="absolute inset-0 bg-black/50" style={{
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
              }} />
              
              {/* Border frame */}
              <div className="absolute inset-0 border-2 border-white/60" />
              
              {/* Corner fiducial markers - styled like the answer sheet squares */}
              {/* Top-left */}
              <div className="absolute -top-1 -left-1">
                <div className="w-6 h-6 bg-white opacity-90" />
                <div className="absolute top-7 left-0 w-0.5 h-4 bg-white/60" />
                <div className="absolute top-0 left-7 h-0.5 w-4 bg-white/60" />
              </div>
              
              {/* Top-right */}
              <div className="absolute -top-1 -right-1">
                <div className="w-6 h-6 bg-white opacity-90" />
                <div className="absolute top-7 right-0 w-0.5 h-4 bg-white/60" />
                <div className="absolute top-0 right-7 h-0.5 w-4 bg-white/60" />
              </div>
              
              {/* Bottom-left */}
              <div className="absolute -bottom-1 -left-1">
                <div className="w-6 h-6 bg-white opacity-90" />
                <div className="absolute bottom-7 left-0 w-0.5 h-4 bg-white/60" />
                <div className="absolute bottom-0 left-7 h-0.5 w-4 bg-white/60" />
              </div>
              
              {/* Bottom-right */}
              <div className="absolute -bottom-1 -right-1">
                <div className="w-6 h-6 bg-white opacity-90" />
                <div className="absolute bottom-7 right-0 w-0.5 h-4 bg-white/60" />
                <div className="absolute bottom-0 right-7 h-0.5 w-4 bg-white/60" />
              </div>
            </div>

            {/* Instruction text - at bottom of scan area */}
            <div className="absolute bottom-28 left-0 right-0 text-center px-4">
              <div className="bg-black/70 backdrop-blur-sm inline-block px-4 py-2 rounded-xl">
                <p className="text-white text-sm font-medium">
                  Alinhe os quadrados com os cantos da folha
                </p>
                <p className="text-white/60 text-xs mt-1">
                  Posicione a câmera sobre a folha de respostas
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Processing overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p>Processando folha de respostas...</p>
            </div>
          </div>
        )}
      </div>

      {/* Top controls */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center">
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="text-white bg-black/30 hover:bg-black/50"
        >
          <X className="w-6 h-6" />
        </Button>

        {!capturedImage && (
          <div className="flex gap-2">
            {hasFlash && (
              <Button
                onClick={toggleFlash}
                variant="ghost"
                size="icon"
                className={cn(
                  "text-white bg-black/30 hover:bg-black/50",
                  flashEnabled && "bg-yellow-500/50"
                )}
              >
                {flashEnabled ? (
                  <Zap className="w-6 h-6" />
                ) : (
                  <ZapOff className="w-6 h-6" />
                )}
              </Button>
            )}
            <Button
              onClick={switchCamera}
              variant="ghost"
              size="icon"
              className="text-white bg-black/30 hover:bg-black/50"
            >
              <SwitchCamera className="w-6 h-6" />
            </Button>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="p-6 bg-black">
        {capturedImage ? (
          <div className="flex gap-4 justify-center">
            <Button
              onClick={retakePhoto}
              variant="outline"
              size="lg"
              className="flex-1 max-w-[150px] border-white text-white hover:bg-white/10"
              disabled={isProcessing}
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Repetir
            </Button>
            <Button
              onClick={confirmCapture}
              size="lg"
              className="flex-1 max-w-[150px] bg-apple-green hover:bg-apple-green/90"
              disabled={isProcessing}
            >
              <Check className="w-5 h-5 mr-2" />
              Confirmar
            </Button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={captureImage}
              className="w-20 h-20 rounded-full border-4 border-white bg-white/20 hover:bg-white/30 active:scale-95 transition-all flex items-center justify-center"
              disabled={isProcessing}
            >
              <div className="w-14 h-14 rounded-full bg-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
