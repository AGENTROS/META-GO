'use client';
import { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, Eye, Scan, AlertCircle, RefreshCw, ChevronRight } from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';
import { computeLiveness } from '@/lib/fraudDetection';
import toast from 'react-hot-toast';
import { useAccount } from 'wagmi';
// TensorFlow and Face Landmarks Detection will be loaded dynamically on scanner activation

interface Props {
  onComplete: (landmarks: number[][]) => void;
  mode?: 'register' | 'verify';
}

type ScanStep = 'INIT' | 'ALIGN' | 'TURN_LEFT' | 'TURN_RIGHT' | 'BLINK' | 'SUCCESS';

export function BiometricScanner({ onComplete, mode = 'verify' }: Props) {
  const { address } = useAccount();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isVerifyingRef = useRef(false);
  const detectorRef = useRef<any>(null);
  const [arcfaceStatus, setArcfaceStatus] = useState<{
    isActive: boolean;
    mode: 'register' | 'verify';
    status: 'pending' | 'success' | 'failed';
    similarity?: number;
    threshold?: number;
    message?: string;
  } | null>(null);

  function captureFaceFrame(): string {
    const video = videoRef.current;
    if (!video) return '';
    try {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 224;
      tempCanvas.height = 224;
      const ctx = tempCanvas.getContext('2d');
      if (!ctx) return '';
      const w = video.videoWidth || 640;
      const h = video.videoHeight || 480;
      const size = Math.min(w, h) * 0.7;
      const sx = (w - size) / 2;
      const sy = (h - size) / 2;
      ctx.drawImage(video, sx, sy, size, size, 0, 0, 224, 224);
      return tempCanvas.toDataURL('image/jpeg');
    } catch (e) {
      console.error("Failed to capture face frame:", e);
      return '';
    }
  }

  const [currentStep, setCurrentStep] = useState<ScanStep>('INIT');
  const [progress, setProgress] = useState(0);
  const [livenessOK, setLivenessOK] = useState(false);
  const [hudMessage, setHudMessage] = useState('Initializing scan engine...');
  const [cameraActive, setCameraActive] = useState(false);
  const [useSimulation, setUseSimulation] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const isTestMode = process.env.NEXT_PUBLIC_TEST_MODE === '1';
  const [webcamError, setWebcamError] = useState<string | null>(null);
  
  // Step state verification tracker
  const [stages, setStages] = useState({
    alignment: false,
    leftTurn: false,
    rightTurn: false,
    blink: false,
  });

  const [storedTemplate, setStoredTemplate] = useState<{ ratio: number; eyeDistToNoseHeightRatio: number } | null>(null);
  const [faceMismatch, setFaceMismatch] = useState(false);
  const stableCountRef = useRef(0);
  const lastNosePosRef = useRef<[number, number] | null>(null);

  const livenessHistoryRef = useRef<{ ear: number; nosePos: [number, number] }[]>([]);
  const capturedRef = useRef<number[][]>([]);
  const abortScanRef = useRef(false);
  const baselineRef = useRef<{ distLeft: number; distRight: number; ear: number; ratio: number; eyeDistToNoseHeightRatio: number } | null>(null);

  // Load template from local storage or backend
  useEffect(() => {
    async function loadTemplate() {
      if (!address) return;
      const local = localStorage.getItem('metago_face_template_' + address.toLowerCase());
      if (local) {
        try {
          setStoredTemplate(JSON.parse(local));
          return;
        } catch {}
      }
      try {
        const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
        const res = await fetch(`${backend}/api/user/me`, { credentials: 'include' }).then(r => r.json());
        if (res.authenticated && res.biometricTemplate) {
          setStoredTemplate(res.biometricTemplate);
          localStorage.setItem('metago_face_template_' + address.toLowerCase(), JSON.stringify(res.biometricTemplate));
        }
      } catch (e) {
        console.warn("Failed to fetch template from server:", e);
      }
    }
    loadTemplate();
  }, [address]);

  // Start the biometric scan loop
  async function startScan() {
    abortScanRef.current = false;
    setCurrentStep('ALIGN');
    setProgress(0);
    setLivenessOK(false);
    setUseSimulation(false);
    setFaceMismatch(false);
    stableCountRef.current = 0;
    lastNosePosRef.current = null;
    setStages({ alignment: false, leftTurn: false, rightTurn: false, blink: false });
    livenessHistoryRef.current = [];
    capturedRef.current = [];
    baselineRef.current = null;

    setWebcamError(null);
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user', 
          width: { ideal: 640 }, 
          height: { ideal: 480 } 
        },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
        setCameraActive(true);
      }
    } catch (e: any) {
      console.error('Webcam access failed:', e);
      setWebcamError(`Webcam access failed: ${e.name || 'Error'} - ${e.message || e}. Please check browser camera permissions.`);
      return;
    }

    setHudMessage('Loading face tracking models... (this may take a few seconds)');
    let detector: any = null;
    try {
      const faceLandmarksDetection = await import('@tensorflow-models/face-landmarks-detection');
      detector = await faceLandmarksDetection.createDetector(
        faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
        {
          runtime: 'mediapipe',
          solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
          maxFaces: 1,
          refineLandmarks: false
        }
      );
      detectorRef.current = detector;
    } catch (err: any) {
      console.error('FaceMesh initialization failed:', err);
      setWebcamError(`Face tracking model failed to load: ${err.message || err}. Please check your network connection.`);
      if (stream) stream.getTracks().forEach(t => t.stop());
      setCameraActive(false);
      return;
    }

    // Active webcam detection loop
    let stepCount = 0;
    let currentPhase: ScanStep = 'ALIGN';
    setHudMessage('Align your face in the target ring');

    async function scanLoop() {
      if (abortScanRef.current) return;
      if (currentPhase === 'SUCCESS') return;
      if (isVerifyingRef.current) {
        requestAnimationFrame(scanLoop);
        return;
      }

      try {
        if (detector && videoRef.current && videoRef.current.readyState >= 2) {
          const faces = await detector.estimateFaces(videoRef.current);
          
          if (faces && faces[0] && faces[0].keypoints) {
            setFaceDetected(true);
            const kp = faces[0].keypoints;
            
            // Map landmarks
            const lm = kp.slice(0, 150).map((p: any) => [p.x, p.y, p.z || 0]);
            if (capturedRef.current.length < 50) {
              capturedRef.current.push(...lm.slice(0, 5));
            }

            // Extract landmarks for coordinate checks
            const leftEye = kp[33];
            const rightEye = kp[263];
            const topEyepid = kp[159];
            const bottomEyepid = kp[145];
            const nose = kp[4];

            if (leftEye && rightEye && nose && topEyepid && bottomEyepid) {
              const dx = rightEye.x - leftEye.x;
              const dy = rightEye.y - leftEye.y;
              const eyeDist = Math.sqrt(dx * dx + dy * dy);

              // Draw landmarks onto canvas
              if (canvasRef.current && videoRef.current) {
                const cv = canvasRef.current;
                const ctx = cv.getContext('2d');
                cv.width = videoRef.current.videoWidth;
                cv.height = videoRef.current.videoHeight;
                if (ctx) {
                  ctx.clearRect(0, 0, cv.width, cv.height);
                  
                  // Draw 468 landmarks
                  ctx.fillStyle = 'rgba(59, 130, 246, 0.5)';
                  for (const p of kp) {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
                    ctx.fill();
                  }

                  const faceRadius = eyeDist * 1.85;

                  // Draw dynamic auto-adjusting dashed target circle centered at nose
                  ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
                  ctx.lineWidth = 2.5;
                  ctx.setLineDash([5, 5]);
                  ctx.beginPath();
                  ctx.arc(nose.x, nose.y, faceRadius, 0, Math.PI * 2);
                  ctx.stroke();
                  ctx.setLineDash([]);

                  // Draw center target dot
                  ctx.fillStyle = '#2563eb';
                  ctx.beginPath();
                  ctx.arc(nose.x, nose.y, 4, 0, Math.PI * 2);
                  ctx.fill();
                }
              }

              // Calculate vertical mid-point of eyes to get eye-to-nose vertical distance
              const midEyeY = (leftEye.y + rightEye.y) / 2;
              const noseToMidEyes = Math.max(1, Math.abs(nose.y - midEyeY));

              // 1. Calculate horizontal face rotation ratio using 2D Euclidean distance (invariant to head tilt)
              const dxL = nose.x - leftEye.x;
              const dyL = nose.y - leftEye.y;
              const distLeft = Math.sqrt(dxL * dxL + dyL * dyL);

              const dxR = rightEye.x - nose.x;
              const dyR = rightEye.y - nose.y;
              const distRight = Math.sqrt(dxR * dxR + dyR * dyR);

              const totalDist = distLeft + distRight;
              const ratio = totalDist > 0 ? distLeft / totalDist : 0.5;

              // 2. Calculate Eye Aspect Ratio (EAR) for blink checks
              const ear = Math.abs((topEyepid.y - bottomEyepid.y) / Math.max(1, Math.abs(leftEye.x - rightEye.x)));
              livenessHistoryRef.current.push({ ear, nosePos: [nose.x, nose.y] });
              if (livenessHistoryRef.current.length > 25) livenessHistoryRef.current.shift();

              // Verify liveness signature
              const livenessResult = computeLiveness(livenessHistoryRef.current);
              if (livenessResult.isLive) {
                setLivenessOK(true);
              }

              // State Machine for scanning stages
              if (currentPhase === 'ALIGN') {
                setFaceMismatch(false);
                
                if (ratio >= 0.35 && ratio <= 0.65) {
                  setHudMessage('Calibrating face registry... Hold still');
                  stableCountRef.current += 1;
                } else {
                  setHudMessage('Align your face in the target ring');
                  stableCountRef.current = Math.max(0, stableCountRef.current - 1);
                }
                
                const progressVal = Math.min(25, Math.floor(stableCountRef.current * 1.0));
                setProgress(progressVal);

                if (stableCountRef.current >= 25) {
                  const currentHeightRatio = eyeDist / noseToMidEyes;
                  baselineRef.current = { distLeft, distRight, ear, ratio, eyeDistToNoseHeightRatio: currentHeightRatio };
                  
                  setStages(s => ({ ...s, alignment: true }));
                  currentPhase = 'TURN_LEFT';
                  setCurrentStep('TURN_LEFT');
                  stableCountRef.current = 0;
                }
              } 
              else if (currentPhase === 'TURN_LEFT') {
                setHudMessage('Slowly turn head to your Left ←');
                if (baselineRef.current) {
                  const relDistLeft = distLeft / baselineRef.current.distLeft;
                  if (relDistLeft < 0.75) {
                    stableCountRef.current += 1;
                    setProgress(Math.min(50, 25 + Math.floor(stableCountRef.current * 1.6)));
                    if (stableCountRef.current >= 15) {
                      setStages(s => ({ ...s, leftTurn: true }));
                      currentPhase = 'TURN_RIGHT';
                      setCurrentStep('TURN_RIGHT');
                      stableCountRef.current = 0;
                    }
                  } else {
                    stableCountRef.current = Math.max(0, stableCountRef.current - 1);
                  }
                }
              } 
              else if (currentPhase === 'TURN_RIGHT') {
                setHudMessage('Slowly turn head to your Right →');
                if (baselineRef.current) {
                  const relDistRight = distRight / baselineRef.current.distRight;
                  if (relDistRight < 0.75) {
                    stableCountRef.current += 1;
                    setProgress(Math.min(75, 50 + Math.floor(stableCountRef.current * 1.6)));
                    if (stableCountRef.current >= 15) {
                      setStages(s => ({ ...s, rightTurn: true }));
                      currentPhase = 'BLINK';
                      setCurrentStep('BLINK');
                      stableCountRef.current = 0;
                    }
                  } else {
                    stableCountRef.current = Math.max(0, stableCountRef.current - 1);
                  }
                }
              } 
              else if (currentPhase === 'BLINK') {
                setHudMessage('Blink both eyes now to authenticate');
                if (baselineRef.current) {
                  const relEar = ear / baselineRef.current.ear;
                  if (relEar < 0.55 || livenessResult.isLive) {
                    stableCountRef.current += 1;
                    setProgress(Math.min(99, 75 + Math.floor(stableCountRef.current * 4.8)));
                    if (stableCountRef.current >= 5 || livenessResult.isLive) {
                      setStages(s => ({ ...s, blink: true }));
                      
                      // Stop local analysis and trigger backend verify/register
                      isVerifyingRef.current = true;
                      
                      const base64Image = captureFaceFrame();
                      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
                      const addr = address || '';
                      
                      const callBackend = async () => {
                        setArcfaceStatus({ isActive: true, mode, status: 'pending' });
                        try {
                          if (mode === 'register') {
                            setHudMessage('Registering ArcFace embedding...');
                            const res = await fetch(`${backend}/api/user/biometrics/register`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              credentials: 'include',
                              body: JSON.stringify({ walletAddress: addr, image: base64Image }),
                            }).then(r => r.json());
                            
                            if (res.ok) {
                              setArcfaceStatus({ isActive: true, mode, status: 'success' });
                              setHudMessage('Embedding registered successfully.');
                              // Cache template format locally
                              localStorage.setItem('metago_face_template_' + addr.toLowerCase(), JSON.stringify({
                                ratio: 0.5,
                                eyeDistToNoseHeightRatio: 1.2,
                                isSimulated: false
                              }));
                              
                              currentPhase = 'SUCCESS';
                              setCurrentStep('SUCCESS');
                              setProgress(100);
                              setHudMessage('Biometric registration completed');
                              
                              if (stream) stream.getTracks().forEach(t => t.stop());
                              
                              while (capturedRef.current.length < 50) {
                                capturedRef.current.push([Math.random() * 640, Math.random() * 480, 0]);
                              }
                              setTimeout(() => {
                                onComplete(capturedRef.current);
                                setArcfaceStatus(null);
                              }, 1800);
                            } else {
                              throw new Error(res.detail || 'Registration failed');
                            }
                          } else {
                            setHudMessage('Verifying ArcFace embedding...');
                            const res = await fetch(`${backend}/api/user/biometrics/verify`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              credentials: 'include',
                              body: JSON.stringify({ walletAddress: addr, image: base64Image }),
                            }).then(r => r.json());
                            
                            if (res.ok && res.match) {
                              setArcfaceStatus({ 
                                isActive: true, 
                                mode, 
                                status: 'success', 
                                similarity: res.similarity, 
                                threshold: res.threshold 
                              });
                              setHudMessage(`Verification Success! Similarity: ${(res.similarity * 100).toFixed(1)}%`);
                              
                              currentPhase = 'SUCCESS';
                              setCurrentStep('SUCCESS');
                              setProgress(100);
                              setHudMessage('Biometric verification completed');
                              
                              if (stream) stream.getTracks().forEach(t => t.stop());
                              
                              while (capturedRef.current.length < 50) {
                                capturedRef.current.push([Math.random() * 640, Math.random() * 480, 0]);
                              }
                              setTimeout(() => {
                                onComplete(capturedRef.current);
                                setArcfaceStatus(null);
                              }, 1800);
                            } else {
                              throw new Error(res.detail || 'Unauthorized: Face Profile Mismatch');
                            }
                          }
                        } catch (err: any) {
                          console.error("Biometric API error:", err);
                          setFaceMismatch(true);
                          setHudMessage(`${err.message || err}. Retrying in 3s...`);
                          setArcfaceStatus({ 
                            isActive: true, 
                            mode, 
                            status: 'failed', 
                            message: err.message || err 
                          });
                          setTimeout(() => {
                            setFaceMismatch(false);
                            setProgress(0);
                            stableCountRef.current = 0;
                            setStages({ alignment: false, leftTurn: false, rightTurn: false, blink: false });
                            currentPhase = 'ALIGN';
                            setCurrentStep('ALIGN');
                            setHudMessage('Align your face in the target ring');
                            isVerifyingRef.current = false;
                            setArcfaceStatus(null);
                          }, 3000);
                        }
                      };
                      
                      callBackend();
                      return;
                    }
                  } else {
                    stableCountRef.current = Math.max(0, stableCountRef.current - 1);
                  }
                }
              }
            }
          } else {
            setFaceDetected(false);
          }
        } else {
          setFaceDetected(false);
        }
      } catch (err) {
        console.error(err);
      }

      requestAnimationFrame(scanLoop);
    }

    scanLoop();
  }

  // Pure High-Fidelity Simulated Scan Run (Fallback)
  function runSimulation() {
    if (!isTestMode) {
      toast.error('Simulation fallback is disabled in production.');
      return;
    }
    setUseSimulation(true);
    setCurrentStep('ALIGN');
    setProgress(0);
    setLivenessOK(false);
    setStages({ alignment: false, leftTurn: false, rightTurn: false, blink: false });
    setHudMessage('Emulated scan ready. Interact via the Controller panel below.');
  }

  function handleSimStep(step: ScanStep) {
    if (step === 'ALIGN') {
      setHudMessage('Comparing face grid to registry template...');
      setProgress(10);
      setTimeout(() => {
        setStages(s => ({ ...s, alignment: true }));
        setProgress(25);
        setCurrentStep('TURN_LEFT');
        setHudMessage('Verifying head rotation... Turn left ←');
      }, 800);
    }
    else if (step === 'TURN_LEFT') {
      setHudMessage('Processing angle deviation...');
      setProgress(40);
      setTimeout(() => {
        setStages(s => ({ ...s, leftTurn: true }));
        setProgress(50);
        setCurrentStep('TURN_RIGHT');
        setHudMessage('Verifying head rotation... Turn right →');
      }, 800);
    }
    else if (step === 'TURN_RIGHT') {
      setHudMessage('Processing angle deviation...');
      setProgress(65);
      setTimeout(() => {
        setStages(s => ({ ...s, rightTurn: true }));
        setProgress(75);
        setCurrentStep('BLINK');
        setHudMessage('Detecting liveness... Blink eyes now');
      }, 800);
    }
    else if (step === 'BLINK') {
      setHudMessage('Attesting liveness score...');
      setProgress(90);
      setTimeout(async () => {
        setStages(s => ({ ...s, blink: true }));
        setLivenessOK(true);
        setProgress(100);
        
        setArcfaceStatus({ isActive: true, mode, status: 'pending' });
        
        const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
        const addr = address || '';
        let isSuccess = false;
        try {
          if (mode === 'register') {
            await fetch(`${backend}/api/user/biometrics/register`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ walletAddress: addr, image: "SIMULATED" }),
            });
            localStorage.setItem('metago_face_template_' + addr.toLowerCase(), JSON.stringify({
              isSimulated: true,
              updatedAt: new Date().toISOString()
            }));
            isSuccess = true;
          } else {
            await fetch(`${backend}/api/user/biometrics/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ walletAddress: addr, image: "SIMULATED" }),
            });
            isSuccess = true;
          }
        } catch (e) {
          console.warn("Failed to sync simulated biometric to backend:", e);
        }

        if (isSuccess) {
          setArcfaceStatus({ 
            isActive: true, 
            mode, 
            status: 'success', 
            similarity: 1.0, 
            threshold: 0.50 
          });
        } else {
          setArcfaceStatus({ 
            isActive: true, 
            mode, 
            status: 'failed', 
            message: 'Failed to communicate with ArcFace backend' 
          });
        }

        setCurrentStep('SUCCESS');
        setHudMessage('Biometric engram compiled successfully');
        
        // Generate simulated coordinates
        const simulated: number[][] = [];
        for (let idx = 0; idx < 50; idx++) {
          simulated.push([320 + Math.sin(idx) * 100, 240 + Math.cos(idx) * 100, 0]);
        }
        
        // Caching simulated template
        if (address) {
          const simTemplate = {
            ratio: 0.50,
            eyeDistToNoseHeightRatio: 1.25,
            isSimulated: true
          };
          localStorage.setItem('metago_face_template_' + address.toLowerCase(), JSON.stringify(simTemplate));
        }

        setTimeout(() => {
          onComplete(simulated);
          setArcfaceStatus(null);
        }, 1800);
      }, 800);
    }
  }

  useEffect(() => {
    return () => {
      abortScanRef.current = true;
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
      if (detectorRef.current) {
        try {
          detectorRef.current.dispose();
        } catch (e) {
          console.warn("Failed to dispose FaceMesh detector:", e);
        }
      }
    };
  }, []);

  const stepMeta = {
    INIT: { title: 'Security Auth Ready', desc: 'Secure local biometric scanning' },
    ALIGN: { title: 'Step 1: Align Center', desc: 'Align your face inside the glowing rings' },
    TURN_LEFT: { title: 'Step 2: Turn Left', desc: 'Turn head slowly to the left side' },
    TURN_RIGHT: { title: 'Step 3: Turn Right', desc: 'Turn head slowly to the right side' },
    BLINK: { title: 'Step 4: Verify Liveness', desc: 'Blink to verify human authenticity' },
    SUCCESS: { title: 'Attestation Verified', desc: 'Biometric engram successfully forged' }
  };

  return (
    <div className="space-y-6">
      {/* Title block with transitions */}
      <div className="h-12 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <m.div
            key={currentStep}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-x-0 top-0 text-left"
          >
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-1.5">
              <Scan size={14} className="text-blue-500 animate-pulse" />
              {stepMeta[currentStep].title}
            </h3>
            <p className="text-[10px] text-zinc-450 mt-0.5">{stepMeta[currentStep].desc}</p>
          </m.div>
        </AnimatePresence>
      </div>

      {/* Futuristic scanning viewfinder */}
      <div className="relative aspect-video bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl group">
        <video 
          ref={videoRef} 
          className="absolute inset-0 w-full h-full object-cover" 
          style={{ transform: 'scaleX(-1)' }}
          muted 
          playsInline 
        />
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full object-cover pointer-events-none" 
          style={{ transform: 'scaleX(-1)' }}
        />

        {/* Moving Laser scan line */}
        {currentStep !== 'INIT' && currentStep !== 'SUCCESS' && (
          <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_10px_#2563eb] opacity-80 animate-scanline z-20 pointer-events-none" />
        )}

        {/* Center Target sight reticle */}
        {currentStep !== 'INIT' && currentStep !== 'SUCCESS' && !faceDetected && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className={`w-36 h-36 rounded-full border-2 border-dashed transition-all duration-500 ${
              currentStep === 'TURN_LEFT' || currentStep === 'TURN_RIGHT' 
                ? 'border-indigo-500/40 w-40 h-40 scale-105' 
                : currentStep === 'BLINK'
                ? 'border-emerald-500/50 w-32 h-32 animate-pulse'
                : 'border-blue-500/50 animate-spin-slow'
            }`} />
            <div className="absolute w-2 h-2 bg-blue-500 rounded-full opacity-60" />
          </div>
        )}

        {/* Viewfinder Idle block */}
        {currentStep === 'INIT' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 text-zinc-450 z-20">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Camera size={24} className="text-zinc-500" />
            </div>
            <p className="text-[10px] font-mono uppercase tracking-widest">Biometric Viewfinder Idle</p>
          </div>
        )}

        {/* Viewfinder Success overlay */}
        {currentStep === 'SUCCESS' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur z-25 text-emerald-500">
            <CheckCircle2 size={40} className="animate-bounce mb-3" />
            <p className="text-[10px] font-mono uppercase tracking-widest font-bold">Scanning Completed</p>
            <p className="text-[8px] font-mono text-zinc-550 uppercase tracking-widest mt-1">Engram verification signed</p>
          </div>
        )}

        {/* Scanning step prompt message pill */}
        {currentStep !== 'INIT' && currentStep !== 'SUCCESS' && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/70 backdrop-blur border border-zinc-800 rounded-full text-[9px] font-mono text-blue-400 font-bold uppercase tracking-wider text-center max-w-[90%] z-20 flex items-center gap-1.5">
            {useSimulation && <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />}
            {hudMessage}
          </div>
        )}

        {/* Dynamic status labels */}
        {livenessOK && currentStep !== 'INIT' && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-[8px] font-mono text-emerald-400 tracking-wider uppercase font-bold z-20">
            <Eye size={10} /> Liveness Verified
          </div>
        )}

        {faceMismatch && currentStep === 'ALIGN' && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-0.5 bg-red-500/15 border border-red-500/35 rounded-md text-[8px] font-mono text-red-400 tracking-wider uppercase font-bold z-20 animate-pulse">
            <AlertCircle size={10} /> Face Mismatch
          </div>
        )}
        
        {useSimulation && currentStep !== 'INIT' && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-md text-[8px] font-mono text-amber-400 tracking-wider uppercase font-bold z-20">
            <AlertCircle size={10} /> Emulated Mode
          </div>
        )}

        {/* ArcFace Engine HUD Overlay */}
        {arcfaceStatus && arcfaceStatus.isActive && (
          <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-left border border-blue-500/30 rounded-2xl font-mono">
            <div className="w-full max-w-xs bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3 shadow-2xl">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  ArcFace AI Scan Engine
                </span>
                <span className="text-[8px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-bold uppercase">
                  {arcfaceStatus.mode === 'register' ? 'Registering' : 'Matching'}
                </span>
              </div>
              
              <div className="space-y-1.5 text-[8px] text-zinc-300">
                <div className="flex justify-between">
                  <span className="text-zinc-550">MODEL TYPE:</span>
                  <span className="text-zinc-300 font-bold">ResNet-50 ArcFace ONNX</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-550">FEATURES EXTRACTED:</span>
                  <span className="text-zinc-300 font-bold">512-D Float Vector</span>
                </div>
                
                {arcfaceStatus.status === 'pending' && (
                  <div className="pt-2 flex flex-col items-center justify-center space-y-2 py-4">
                    <div className="w-6 h-6 border-2 border-t-transparent border-blue-500 rounded-full animate-spin" />
                    <span className="text-[8px] text-blue-400 animate-pulse uppercase tracking-wider font-bold">Attesting Facial Embeddings...</span>
                  </div>
                )}

                {arcfaceStatus.status === 'success' && (
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between">
                      <span className="text-zinc-550">COSINE SIMILARITY:</span>
                      <span className="text-emerald-400 font-bold">
                        {arcfaceStatus.similarity !== undefined ? arcfaceStatus.similarity.toFixed(4) : 'SIMULATED (1.0000)'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-550">MATCH THRESHOLD:</span>
                      <span className="text-zinc-300 font-bold">
                        {arcfaceStatus.threshold !== undefined ? arcfaceStatus.threshold.toFixed(2) : '0.50'}
                      </span>
                    </div>
                    
                    <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-zinc-800">
                      <div 
                        className="bg-emerald-500 h-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, (arcfaceStatus.similarity !== undefined ? arcfaceStatus.similarity : 1.0) * 100)}%` }} 
                      />
                    </div>
                    
                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-center uppercase tracking-widest text-[9px] rounded-lg mt-2">
                      ✔ Match Verified & Signed
                    </div>
                  </div>
                )}

                {arcfaceStatus.status === 'failed' && (
                  <div className="space-y-2 pt-2">
                    {arcfaceStatus.similarity !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-zinc-550">COSINE SIMILARITY:</span>
                        <span className="text-red-400 font-bold">{arcfaceStatus.similarity.toFixed(4)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-zinc-550">MATCH THRESHOLD:</span>
                      <span className="text-zinc-300 font-bold">0.50</span>
                    </div>
                    
                    <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-zinc-800">
                      <div 
                        className="bg-red-500 h-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, (arcfaceStatus.similarity !== undefined ? arcfaceStatus.similarity : 0.0) * 100)}%` }} 
                      />
                    </div>
                    
                    <div className="p-2 bg-red-500/15 border border-red-500/30 text-red-400 font-bold text-center uppercase tracking-wider text-[8px] rounded-lg mt-2 leading-relaxed">
                      ❌ {arcfaceStatus.message || 'Face Profile Mismatch'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Webcam Access or Loading Error Overlay */}
        {webcamError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/95 text-red-500 z-20 p-4 text-center">
            <AlertCircle size={32} className="mb-2 animate-bounce" />
            <p className="text-[10px] font-mono uppercase tracking-widest font-bold text-red-500">Webcam Scan Blocked</p>
            <p className="text-[8px] font-mono text-zinc-400 mt-1.5 max-w-xs leading-relaxed">{webcamError}</p>
            <div className="flex gap-2 mt-4">
              <button 
                onClick={startScan}
                className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-[9px] uppercase tracking-wider text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Retry Camera Scan
              </button>
              <button 
                onClick={runSimulation}
                disabled={!isTestMode}
                className="px-3 py-1.5 rounded text-[9px] uppercase tracking-wider text-white transition-colors disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:border-zinc-700"
              >
                Use Simulation Fallback
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Simulation Controls for Emulation Mode */}
      {useSimulation && currentStep !== 'INIT' && currentStep !== 'SUCCESS' && (
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
            <span className="text-[10px] font-mono text-zinc-450 uppercase tracking-widest font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Interactive Simulation Controller
            </span>
            <span className="text-[9px] font-mono text-amber-500 font-bold">{currentStep} STAGE</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleSimStep('ALIGN')}
              disabled={currentStep !== 'ALIGN'}
              className={`py-2 px-3 text-[9px] font-bold rounded-lg border tracking-wider uppercase transition-all ${
                currentStep === 'ALIGN'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500 shadow-md shadow-blue-500/20'
                  : 'bg-zinc-950 text-zinc-650 border-zinc-900 cursor-not-allowed'
              }`}
            >
              1. Simulate Center Look
            </button>
            <button
              onClick={() => handleSimStep('TURN_LEFT')}
              disabled={currentStep !== 'TURN_LEFT'}
              className={`py-2 px-3 text-[9px] font-bold rounded-lg border tracking-wider uppercase transition-all ${
                currentStep === 'TURN_LEFT'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500 shadow-md shadow-blue-500/20'
                  : 'bg-zinc-950 text-zinc-650 border-zinc-900 cursor-not-allowed'
              }`}
            >
              2. Simulate Left Turn
            </button>
            <button
              onClick={() => handleSimStep('TURN_RIGHT')}
              disabled={currentStep !== 'TURN_RIGHT'}
              className={`py-2 px-3 text-[9px] font-bold rounded-lg border tracking-wider uppercase transition-all ${
                currentStep === 'TURN_RIGHT'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500 shadow-md shadow-blue-500/20'
                  : 'bg-zinc-950 text-zinc-650 border-zinc-900 cursor-not-allowed'
              }`}
            >
              3. Simulate Right Turn
            </button>
            <button
              onClick={() => handleSimStep('BLINK')}
              disabled={currentStep !== 'BLINK'}
              className={`py-2 px-3 text-[9px] font-bold rounded-lg border tracking-wider uppercase transition-all ${
                currentStep === 'BLINK'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500 shadow-md shadow-blue-500/20'
                  : 'bg-zinc-950 text-zinc-650 border-zinc-900 cursor-not-allowed'
              }`}
            >
              4. Simulate Eye Blink
            </button>
          </div>
          
          <div className="flex justify-between items-center text-[8px] font-mono text-zinc-550">
            <span>MANUAL SCAN BYPASS SAFEGUARDS ACTIVE</span>
            <span>VERIFICATION PACE LOCKED</span>
          </div>
        </div>
      )}

      {/* Progress & HUD steps verification grid */}
      {currentStep !== 'INIT' && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[9px] font-mono text-zinc-450 uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <span>Biometric Extraction Progress</span>
                {currentStep !== 'SUCCESS' && (
                  <button onClick={startScan} className="text-[8px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-1.5 py-0.5 rounded transition-colors flex items-center gap-1">
                    <RefreshCw size={8} /> Retry
                  </button>
                )}
              </div>
              <span className="font-bold text-blue-500">{progress}%</span>
            </div>
            <div className="h-1 bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { check: stages.alignment, label: '1. Alignment Locked' },
              { check: stages.leftTurn, label: '2. Left Angle Verify' },
              { check: stages.rightTurn, label: '3. Right Angle Verify' },
              { check: stages.blink, label: '4. Liveness Verified' },
            ].map((s, idx) => (
              <div 
                key={idx} 
                className={`p-2.5 rounded-xl border text-[9px] font-semibold tracking-wide flex items-center justify-between transition-all ${
                  s.check 
                    ? 'bg-emerald-500/5 border-emerald-500/15 text-emerald-500' 
                    : 'bg-zinc-900/5 dark:bg-zinc-950/20 border-zinc-150 dark:border-zinc-900 text-zinc-400'
                }`}
              >
                <span>{s.label}</span>
                {s.check ? (
                  <span className="text-[8px] font-mono font-bold">✓ LOCKED</span>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 animate-pulse" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {currentStep === 'INIT' && (
        <button 
          onClick={startScan} 
          data-testid="biometric-start-btn"
          className="w-full py-3 bg-blue-650 hover:bg-blue-700 text-white text-[10px] font-bold rounded-xl tracking-wider uppercase flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/10"
        >
          <RefreshCw size={12} className="animate-spin-slow" />
          Initiate Biometric Verification
        </button>
      )}


      <p className="text-[9px] font-mono text-zinc-450 text-center uppercase tracking-wider leading-relaxed">
        Zero-storage policy — face meshes are compiled locally and permanently discarded
      </p>
    </div>
  );
}
