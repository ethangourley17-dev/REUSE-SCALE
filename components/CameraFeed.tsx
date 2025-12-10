import React, { useRef, useEffect, useState, useCallback } from 'react';

interface CameraFeedProps {
  onCapture: (imageData: string) => void;
  trigger?: boolean;
}

const CameraFeed: React.FC<CameraFeedProps> = ({ onCapture, trigger }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permission, setPermission] = useState<PermissionState | 'prompt'>('prompt');

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720, facingMode: 'environment' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setPermission('granted');
    } catch (err) {
      console.error("Camera error:", err);
      setPermission('denied');
    }
  };

  const captureImage = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        const { videoWidth, videoHeight } = videoRef.current;
        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;
        context.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);
        const imageData = canvasRef.current.toDataURL('image/jpeg', 0.85);
        onCapture(imageData);
      }
    }
  }, [onCapture]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (trigger) {
      captureImage();
    }
  }, [trigger, captureImage]);

  return (
    <div className="relative bg-black rounded-xl overflow-hidden shadow-lg border border-slate-700 aspect-video group">
      {permission === 'denied' ? (
        <div className="absolute inset-0 flex items-center justify-center text-red-500">
          Camera Access Denied
        </div>
      ) : (
        <>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Overlay Guide for License Plate */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
            <div className="w-1/3 h-1/4 border-2 border-white rounded-lg border-dashed"></div>
          </div>

          <div className="absolute bottom-4 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
                onClick={captureImage}
                className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white border border-white/50 rounded-full px-6 py-2 flex items-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Snap Photo
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CameraFeed;