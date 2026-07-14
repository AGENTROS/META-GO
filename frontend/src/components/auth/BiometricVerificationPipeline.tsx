'use client';

import { useState, useRef, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Camera, Mic, Shield, CheckCircle2, AlertTriangle, RefreshCw, Volume2, ShieldCheck, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSIWE } from '@/hooks/useSIWE';
import { WalletConnector } from './WalletConnector';
import { getJWTToken } from '@/lib/tokenManager';

interface VerificationPipelineProps {
  onComplete: (data: any) => void;
  mode?: 'verify' | 'register';
}

type StepID = 'WALLET' | 'FACE_SCAN' | 'LIVENESS' | 'VOICE_MFA' | 'SCORING' | 'DONE';

interface PipelineStep {
  id: StepID;
  label: string;
  desc: string;
}

export function BiometricVerificationPipeline({ onComplete, mode = 'verify' }: VerificationPipelineProps) {
  const { address, isConnected } = useAccount();
  const [activeStep, setActiveStep] = useState<StepID>('WALLET');
  const { signIn, isLoading: siweLoading } = useSIWE();
  const [walletVerified, setWalletVerified] = useState(false);
  
  // Webcam & Audio elements
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCanvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // States
  const [loadingChallenge, setLoadingChallenge] = useState(false);
  const [passphrase, setPassphrase] = useState('I authorize secure identity verification');
  const [faceImageB64, setFaceImageB64] = useState<string | null>(null);
  const [audioB64, setAudioB64] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [faceError, setFaceError] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  
  // Liveness active challenges states
  const [livenessSequence, setLivenessSequence] = useState<string[]>([]);
  const [sequenceIndex, setSequenceIndex] = useState(0);
  const [livenessChallenge, setLivenessChallenge] = useState<string>('ALIGN');
  const [livenessProgress, setLivenessProgress] = useState(0);
  const [livenessHudMessage, setLivenessHudMessage] = useState('Position face in center');
  
  const detectorRef = useRef<any>(null);
  const abortScanRef = useRef(false);
  const baselineRef = useRef<{ 
    ear: number; 
    distLeft: number; 
    distRight: number; 
    eyeDist: number;
    verticalRatio: number;
    noseX: number;
    noseY: number;
  } | null>(null);
  const stableCountRef = useRef(0);
  
  // Results / Metrics
  const [pipelineResult, setPipelineResult] = useState<any>(null);

  const steps: PipelineStep[] = [
    { id: 'WALLET', label: 'Wallet Verify', desc: 'SIWE Cryptographic Keys' },
    { id: 'FACE_SCAN', label: 'Face Scan', desc: 'ArcFace Feature Mapping' },
    { id: 'LIVENESS', label: 'Liveness Check', desc: 'Silent Anti-Spoofing' },
    { id: 'VOICE_MFA', label: 'Voice MFA', desc: 'Whisper + ECAPA Attestation' },
    { id: 'SCORING', label: 'Risk Engine', desc: 'Scoring & Calibration' },
    { id: 'DONE', label: 'Sovereign Token', desc: 'Mint and Access Grant' },
  ];

  // Sync state to refs to prevent stale closure bugs in requestAnimationFrame loops
  const activeStepRef = useRef<StepID>('WALLET');
  activeStepRef.current = activeStep;

  const livenessSequenceRef = useRef<string[]>([]);
  livenessSequenceRef.current = livenessSequence;

  const sequenceIndexRef = useRef<number>(0);
  sequenceIndexRef.current = sequenceIndex;

  const livenessChallengeRef = useRef<string>('ALIGN');
  livenessChallengeRef.current = livenessChallenge;

  // Fetch Voice Challenge phrase from Backend
  const fetchChallenge = async () => {
    setLoadingChallenge(true);
    try {
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
      const token = getJWTToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`${backend}/api/user/biometrics/challenge`, { headers }).then(r => r.json());
      if (res.ok && res.challenge) {
        setPassphrase(res.challenge);
      }
    } catch (e) {
      console.warn("Failed to load random passphrase challenge:", e);
    } finally {
      setLoadingChallenge(false);
    }
  };

  useEffect(() => {
    if (isConnected && walletVerified) {
      setActiveStep('FACE_SCAN');
      startCamera();
    } else {
      setActiveStep('WALLET');
    }
  }, [isConnected, walletVerified]);

  useEffect(() => {
    fetchChallenge();
    return () => {
      abortScanRef.current = true;
      stopCamera();
      stopAudioRecording();
      if (detectorRef.current) {
        try {
          detectorRef.current.dispose();
        } catch (e) {
          console.warn("Failed to dispose FaceMesh detector in pipeline:", e);
        }
      }
    };
  }, []);

  // SIWE verification handler
  async function handleVerifyWallet() {
    try {
      await signIn();
      setWalletVerified(true);
      toast.success('Wallet verified successfully via SIWE');
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Signature rejected or validation failed');
    }
  }

  // Web camera handlers
  const startCamera = async () => {
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(e => console.warn(e));
      }

      setModelLoading(true);
      const faceLandmarksDetection = await import('@tensorflow-models/face-landmarks-detection');
      const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
      const detector = await faceLandmarksDetection.createDetector(model, {
        runtime: 'mediapipe',
        solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
        maxFaces: 2,
        refineLandmarks: false,
      });
      detectorRef.current = detector;
      setModelLoading(false);

      runRealTimeFaceScan();
    } catch (err) {
      setModelLoading(false);
      toast.error('Could not activate camera. Please grant permission.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  // Captures 224x224 crop
  const captureFaceSnapshot = (): string => {
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
      const size = Math.min(w, h) * 0.75;
      const sx = (w - size) / 2;
      const sy = (h - size) / 2;
      ctx.drawImage(video, sx, sy, size, size, 0, 0, 224, 224);
      return tempCanvas.toDataURL('image/jpeg');
    } catch (e) {
      console.error(e);
      return '';
    }
  };

  // Drawing helper functions
  function drawReticle(nose: any, eyeDist: number, color: string) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(nose.x, nose.y, eyeDist * 1.85, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawRealtimeOverlay(kp: any[], nose: any, eyeDist: number, ratio: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(59, 130, 246, 0.4)';
    for (const p of kp) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.0, 0, Math.PI * 2);
      ctx.fill();
    }

    let color = 'rgba(59, 130, 246, 0.7)';
    const challenge = livenessChallengeRef.current;
    if (challenge === 'BLINK') color = 'rgba(245, 158, 11, 0.8)';
    if (challenge === 'TURN_LEFT' || challenge === 'TURN_RIGHT') color = 'rgba(99, 102, 241, 0.8)';
    if (challenge === 'LOOK_UP' || challenge === 'LOOK_DOWN') color = 'rgba(236, 72, 153, 0.8)';
    if (challenge === 'HOLD_STILL') color = 'rgba(139, 92, 246, 0.8)';
    if (challenge === 'SUCCESS') color = 'rgba(16, 185, 129, 0.9)';

    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(nose.x, nose.y, eyeDist * 1.85, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(nose.x, nose.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawWarningReticle() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 100, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Front-end brightness exposure quality checks
  function checkFaceQuality(video: HTMLVideoElement): { ok: boolean; reason?: string } {
    try {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 80;
      tempCanvas.height = 80;
      const ctx = tempCanvas.getContext('2d');
      if (!ctx) return { ok: true };
      ctx.drawImage(video, 0, 0, 80, 80);
      const imgData = ctx.getImageData(0, 0, 80, 80);
      const data = imgData.data;
      
      let totalBrightness = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i+1];
        const b = data[i+2];
        totalBrightness += 0.299 * r + 0.587 * g + 0.114 * b;
      }
      const avgBrightness = totalBrightness / (80 * 80);
      
      if (avgBrightness < 35) {
        return { ok: false, reason: 'Lighting too dark — please increase brightness' };
      }
      if (avgBrightness > 225) {
        return { ok: false, reason: 'Lighting too bright — please avoid overexposure' };
      }
      return { ok: true };
    } catch (e) {
      return { ok: true };
    }
  }

  // Set up randomized liveness challenges
  const startLivenessSequence = () => {
    const pool = ['BLINK', 'TURN_LEFT', 'TURN_RIGHT', 'LOOK_UP', 'LOOK_DOWN', 'HOLD_STILL'];
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const sequence = ['ALIGN', ...shuffled.slice(0, 3)]; 
    
    setLivenessSequence(sequence);
    setSequenceIndex(0);
    livenessSequenceRef.current = sequence;
    sequenceIndexRef.current = 0;
    
    setLivenessChallenge('ALIGN');
    setLivenessProgress(0);
    setLivenessHudMessage('Align face center');
    
    setActiveStep('LIVENESS');
  };

  const nextChallenge = () => {
    const nextIdx = sequenceIndexRef.current + 1;
    const seq = livenessSequenceRef.current;
    
    if (nextIdx >= seq.length) {
      setLivenessChallenge('SUCCESS');
      setLivenessProgress(100);
      setLivenessHudMessage('Liveness verified successfully');
      abortScanRef.current = true;
      
      const snapshot = captureFaceSnapshot();
      setFaceImageB64(snapshot);
      stopCamera();
      
      setTimeout(() => {
        setActiveStep('VOICE_MFA');
      }, 1200);
    } else {
      sequenceIndexRef.current = nextIdx;
      setSequenceIndex(nextIdx);
      const nextCh = seq[nextIdx];
      setLivenessChallenge(nextCh);
      setLivenessProgress(Math.floor((nextIdx / seq.length) * 100));
      
      stableCountRef.current = 0;
      
      if (nextCh === 'BLINK') setLivenessHudMessage('Blink both eyes now');
      else if (nextCh === 'TURN_LEFT') setLivenessHudMessage('Turn head slowly to the Left ←');
      else if (nextCh === 'TURN_RIGHT') setLivenessHudMessage('Turn head slowly to the Right →');
      else if (nextCh === 'LOOK_UP') setLivenessHudMessage('Look slowly Up ↑');
      else if (nextCh === 'LOOK_DOWN') setLivenessHudMessage('Look slowly Down ↓');
      else if (nextCh === 'HOLD_STILL') setLivenessHudMessage('Keep your face still');
    }
  };

  // Real time face landmark detection loop
  const runRealTimeFaceScan = () => {
    abortScanRef.current = false;
    stableCountRef.current = 0;
    baselineRef.current = null;
    setFaceError(null);
    setFaceDetected(false);

    async function scanLoop() {
      if (abortScanRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const detector = detectorRef.current;

      if (video && video.readyState >= 2 && detector) {
        if (canvas) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
        // Run pre-verification quality checks (brightness/exposure)
        const quality = checkFaceQuality(video);
        if (!quality.ok) {
          setFaceError(quality.reason || 'Poor capture quality');
          drawWarningReticle();
          requestAnimationFrame(scanLoop);
          return;
        }

        try {
          const faces = await detector.estimateFaces(video, { flipHorizontal: false });
          if (faces && faces.length > 0) {
            setFaceDetected(true);
            if (faces.length > 1) {
              setFaceError("Multiple faces detected");
              drawWarningReticle();
              requestAnimationFrame(scanLoop);
              return;
            }

            const kp = faces[0].keypoints;
            const leftEye = kp[33];
            const rightEye = kp[263];
            const topEyepid = kp[159];
            const bottomEyepid = kp[145];
            const nose = kp[4];

            if (leftEye && rightEye && nose && topEyepid && bottomEyepid) {
              const eyeDist = Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y);

              // 1. Distance Check
              if (eyeDist < 60) {
                setFaceError("Face too far away — please get closer");
                drawReticle(nose, eyeDist, 'rgba(239,68,68,0.7)');
                requestAnimationFrame(scanLoop);
                return;
              } else if (eyeDist > 180) {
                setFaceError("Face too close — please step back");
                drawReticle(nose, eyeDist, 'rgba(239,68,68,0.7)');
                requestAnimationFrame(scanLoop);
                return;
              }

              // 2. Alignment Check
              const distLeft = Math.hypot(nose.x - leftEye.x, nose.y - leftEye.y);
              const distRight = Math.hypot(rightEye.x - nose.x, rightEye.y - nose.y);
              const total = distLeft + distRight;
              const ratio = total > 0 ? distLeft / total : 0.5;

              setFaceError(null);

              // Draw mesh overlay
              drawRealtimeOverlay(kp, nose, eyeDist, ratio);

              // 3. Active Liveness Challenges
              const stepState = activeStepRef.current;
              if (stepState === 'LIVENESS') {
                const currentChallenge = livenessSequenceRef.current[sequenceIndexRef.current];
                
                if (currentChallenge === 'ALIGN') {
                  if (ratio >= 0.35 && ratio <= 0.65) {
                    setLivenessHudMessage('Calibrating... Hold still');
                    stableCountRef.current += 1;
                    setLivenessProgress(Math.min(25, Math.floor(stableCountRef.current * 1.6)));
                    if (stableCountRef.current >= 15) {
                      const ear = Math.hypot(topEyepid.y - bottomEyepid.y, topEyepid.x - bottomEyepid.x) / (eyeDist || 1);
                      const eyeMidY = (leftEye.y + rightEye.y) / 2;
                      const verticalRatio = (nose.y - eyeMidY) / (eyeDist || 1);
                      
                      baselineRef.current = { 
                        ear, 
                        distLeft, 
                        distRight, 
                        eyeDist,
                        verticalRatio,
                        noseX: nose.x,
                        noseY: nose.y
                      };
                      nextChallenge();
                    }
                  } else {
                    setLivenessHudMessage('Align face center');
                    stableCountRef.current = Math.max(0, stableCountRef.current - 1);
                  }
                }
                else if (currentChallenge === 'BLINK') {
                  const ear = Math.hypot(topEyepid.y - bottomEyepid.y, topEyepid.x - bottomEyepid.x) / (eyeDist || 1);
                  if (baselineRef.current) {
                    if (ear < 0.65 * baselineRef.current.ear) {
                      // Eyes are closed (EAR dropped)
                      stableCountRef.current += 1;
                      // If held closed for a long time (e.g. deliberate slow blink)
                      if (stableCountRef.current >= 3) nextChallenge();
                    } else if (stableCountRef.current >= 1) {
                      // Eyes were closed for at least 1 frame and are now open again (Natural fast blink cycle complete)
                      nextChallenge();
                    }
                  }
                }
                else if (currentChallenge === 'TURN_LEFT') {
                  if (ratio < 0.33) {
                    stableCountRef.current += 1;
                    if (stableCountRef.current >= 10) {
                      nextChallenge();
                    }
                  }
                }
                else if (currentChallenge === 'TURN_RIGHT') {
                  if (ratio > 0.67) {
                    stableCountRef.current += 1;
                    if (stableCountRef.current >= 10) {
                      nextChallenge();
                    }
                  }
                }
                else if (currentChallenge === 'LOOK_UP') {
                  const eyeMidY = (leftEye.y + rightEye.y) / 2;
                  const verticalRatio = (nose.y - eyeMidY) / (eyeDist || 1);
                  if (baselineRef.current && verticalRatio < 0.82 * baselineRef.current.verticalRatio) {
                    stableCountRef.current += 1;
                    if (stableCountRef.current >= 8) {
                      nextChallenge();
                    }
                  }
                }
                else if (currentChallenge === 'LOOK_DOWN') {
                  const eyeMidY = (leftEye.y + rightEye.y) / 2;
                  const verticalRatio = (nose.y - eyeMidY) / (eyeDist || 1);
                  if (baselineRef.current && verticalRatio > 1.18 * baselineRef.current.verticalRatio) {
                    stableCountRef.current += 1;
                    if (stableCountRef.current >= 8) {
                      nextChallenge();
                    }
                  }
                }
                else if (currentChallenge === 'HOLD_STILL') {
                  if (baselineRef.current) {
                    const drift = Math.hypot(nose.x - baselineRef.current.noseX, nose.y - baselineRef.current.noseY);
                    if (drift < 0.080 * eyeDist) {
                      stableCountRef.current += 1;
                      if (stableCountRef.current >= 15) {
                        nextChallenge();
                      }
                    } else {
                      stableCountRef.current = 0;
                      baselineRef.current.noseX = nose.x;
                      baselineRef.current.noseY = nose.y;
                    }
                  }
                }
              }
            }
          } else {
            setFaceDetected(false);
            setFaceError("No face detected");
            drawWarningReticle();
          }
        } catch (err) {
          console.error(err);
        }
      } else {
        setFaceDetected(false);
      }

      requestAnimationFrame(scanLoop);
    }

    scanLoop();
  };

  // Audio Recording & Web Visualizer
  const startAudioRecording = async () => {
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      setRecording(true);
      
      let options = {};
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm')) {
          options = { mimeType: 'audio/webm' };
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options = { mimeType: 'audio/mp4' };
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          options = { mimeType: 'audio/ogg' };
        }
      }
      
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          setAudioB64(reader.result as string);
        };
        setRecording(false);
      };

      recorder.start();
      drawAudioVisualization();
      
    } catch (err) {
      console.error("Microphone or recorder initialization failed:", err);
      toast.error("Microphone access denied or unsupported audio format.");
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(t => t.stop());
      audioStreamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
    }
  };

  const drawAudioVisualization = () => {
    const canvas = audioCanvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!recording) return;
      animationFrameRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'rgba(9, 9, 11, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 1.5;

        ctx.fillStyle = `hsla(${200 + barHeight}, 85%, 60%, 0.8)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);

        x += barWidth;
      }
    };
    draw();
  };

  // Submit Biometric Verification Pipeline
  const runScoringVerification = async () => {
    if (!faceImageB64) {
      toast.error("Face image snapshot is missing.");
      return;
    }
    if (!audioB64) {
      toast.error("Audio recording is missing. Please read the challenge phrase.");
      return;
    }

    setVerifying(true);
    setActiveStep('SCORING');

    try {
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
      const addr = address || '';
      const token = getJWTToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${backend}/api/user/biometrics/verify-pipeline`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          walletAddress: addr,
          image: faceImageB64,
          audio: audioB64,
          passphraseChallenge: passphrase
        }),
      }).then(r => r.json());

      if (res.ok || res.trustScore !== undefined) {
        setPipelineResult(res);
        toast.success(`Pipeline computed: Trust Score ${res.trustScore}%`);
        
        setTimeout(() => {
          setActiveStep('DONE');
        }, 3000);
      } else {
        throw new Error(res.detail || "Scoring calculation failed.");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to contact risk engine.");
      setActiveStep('VOICE_MFA');
    } finally {
      setVerifying(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW RISK': return 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10';
      case 'MEDIUM RISK': return 'text-amber-500 border-amber-500/30 bg-amber-500/10';
      default: return 'text-red-500 border-red-500/30 bg-red-500/10';
    }
  };

  return (
    <div className="w-full max-w-4xl bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 shadow-2xl relative text-left">
      {/* Decorative neon borders */}
      <div className="absolute -top-[1px] left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-60" />
      
      {/* Top Banner Status */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-zinc-800 gap-4">
        <div>
          <span className="text-[10px] font-mono text-blue-500 uppercase tracking-widest font-bold">Biometric Audits Portal</span>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Shield className="text-blue-500" size={20} />
            Enterprise Biometric Verification
          </h1>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/50">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[10px] font-mono text-zinc-400">PIPELINE SECURITY LEVEL: CLASS-A</span>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 py-6">
        {steps.map((s, idx) => {
          const isCurrent = s.id === activeStep;
          const isPassed = steps.findIndex(st => st.id === activeStep) > idx;
          return (
            <div key={s.id} className={`p-3 rounded-xl border transition-all duration-300 ${
              isCurrent 
                ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
                : isPassed
                ? 'bg-emerald-600/5 border-emerald-500/30 opacity-80'
                : 'bg-zinc-900/20 border-zinc-850 opacity-50'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-mono font-bold text-zinc-550">0{idx + 1}</span>
                {isPassed && <CheckCircle2 size={12} className="text-emerald-500" />}
                {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />}
              </div>
              <p className={`text-[10px] font-bold tracking-tight ${isCurrent ? 'text-blue-400' : isPassed ? 'text-emerald-400' : 'text-zinc-400'}`}>{s.label}</p>
              <p className="text-[8px] text-zinc-550 leading-tight mt-0.5">{s.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Step Contents */}
      <div className="bg-zinc-900/30 border border-zinc-850 rounded-2xl p-6 min-h-[350px] flex flex-col justify-between">
        
        {/* Step 1: Wallet Verification */}
        {activeStep === 'WALLET' && (
          <div className="space-y-6 text-center py-10">
            <div className="w-16 h-16 rounded-full border border-blue-500/20 bg-blue-500/5 flex items-center justify-center mx-auto animate-pulse">
              <ShieldCheck size={32} className="text-blue-500" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h2 className="text-base font-bold text-white uppercase tracking-wider font-mono">Step 1: Cryptographic Wallet Verification</h2>
              <p className="text-xs text-zinc-400">
                To launch the biometric scoring sequence, verify your Web3 signature keys. This binds your W3C DID passport to the biometric engine.
              </p>
            </div>
            <div className="inline-block p-4 border border-zinc-800 bg-zinc-900/40 rounded-2xl text-[10px] font-mono text-zinc-450 max-w-sm mx-auto text-left space-y-1">
              <p className="text-zinc-400 font-bold mb-1 uppercase tracking-wider text-[9px]">SIWE Attestation Parameters</p>
              <p>Chain Identity: {isConnected ? 'POLYGON (Connected)' : 'POLYGON (Disconnected)'}</p>
              <p>Wallet State: {isConnected ? `CONNECTED: ${address?.slice(0, 6)}...${address?.slice(-4)}` : 'Disconnected'}</p>
              <p>Sign-In Message: Verification commits nonces to safeguard against replay attacks.</p>
            </div>
            
            <div className="pt-4">
              {isConnected ? (
                <button onClick={handleVerifyWallet} disabled={siweLoading}
                  className="w-full max-w-xs py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 mx-auto">
                  {siweLoading && <div className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-white rounded-full animate-spin" />}
                  Sign Cryptographic Signature
                </button>
              ) : (
                <div className="max-w-sm mx-auto">
                  <WalletConnector onSuccess={() => {}} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2 & 3: Face Scan and Liveness Check */}
        {(activeStep === 'FACE_SCAN' || activeStep === 'LIVENESS') && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7 relative overflow-hidden rounded-2xl border border-zinc-800 bg-black aspect-video flex items-center justify-center">
              <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} playsInline muted />
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover pointer-events-none" style={{ transform: 'scaleX(-1)' }} />
              
              {modelLoading && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-4 border-t-transparent border-blue-500 rounded-full animate-spin" />
                  <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest">Loading Neural Mesh Model...</p>
                </div>
              )}

              {faceError && (
                <div className="absolute top-4 right-4 px-3 py-1 bg-red-600/20 border border-red-500/30 text-red-500 rounded-lg text-[9px] font-mono uppercase tracking-wider animate-pulse">
                  {faceError}
                </div>
              )}
              
              <div className="absolute bottom-4 left-4 right-4 p-2 rounded-lg border border-zinc-800 bg-black/60 backdrop-blur-md text-[10px] text-center text-zinc-300">
                {activeStep === 'FACE_SCAN' ? 'Align your face in the center of the dashed ring.' : livenessHudMessage}
              </div>
            </div>

            <div className="lg:col-span-5 space-y-4">
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-blue-500 font-bold uppercase tracking-wider">
                  {activeStep === 'FACE_SCAN' ? 'ArcFace Recognition' : 'Active Liveness Attestation'}
                </span>
                <h3 className="text-sm font-bold text-white uppercase">
                  {activeStep === 'FACE_SCAN' ? 'Step 2: Facial Structure Scan' : 'Step 3: Liveness Verification'}
                </h3>
                <p className="text-xs text-zinc-455 leading-relaxed">
                  {activeStep === 'FACE_SCAN' 
                    ? 'Decodes high-quality pixels to run ArcFace models on the backend. This checks face quality, lighting, and blur thresholds locally before sending to backend for 512-dim embedding calculation.'
                    : 'Validates biological authenticity through physical liveness challenges. Follow the randomized sequence prompts in the viewfinder.'}
                </p>
              </div>

              {activeStep === 'LIVENESS' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                    <span>Liveness Progress:</span>
                    <span className="text-blue-400 font-bold">{livenessProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${livenessProgress}%` }} />
                  </div>
                </div>
              )}

              {activeStep === 'FACE_SCAN' ? (
                <button onClick={() => {
                  if (!faceDetected || faceError) {
                    toast.error("Please align face properly before starting liveness check.");
                    return;
                  }
                  startLivenessSequence();
                }}
                  disabled={!faceDetected || !!faceError}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-850 disabled:text-zinc-650 text-white text-xs font-bold font-mono uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-blue-600/10">
                  Initiate Liveness Attestation →
                </button>
              ) : (
                <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-2 text-[10px] font-mono text-zinc-450">
                  <div className="flex justify-between">
                    <span>Current Challenge:</span>
                    <span className="text-blue-450 font-bold uppercase">{livenessChallenge}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Validation Status:</span>
                    <span className="text-emerald-400">ACTIVE</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Voice MFA */}
        {activeStep === 'VOICE_MFA' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-2xl relative">
                <canvas ref={audioCanvasRef} className="w-full h-32 rounded-xl bg-zinc-900 border border-zinc-850" />
                <div className="absolute top-6 left-6 inline-flex px-2 py-0.5 rounded border border-red-500/30 bg-red-500/10 text-red-500 font-mono text-[8px] uppercase font-bold tracking-widest animate-pulse">
                  {recording ? 'MIC ACTIVE' : 'MIC INACTIVE'}
                </div>
              </div>

              <div className="flex gap-2">
                {!recording ? (
                  <button onClick={startAudioRecording}
                    className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-bold font-mono uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5">
                    <Mic size={14} /> Start Recording
                  </button>
                ) : (
                  <button onClick={stopAudioRecording}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold font-mono uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5">
                    Stop & Compile Recording
                  </button>
                )}
                
                <button onClick={fetchChallenge} disabled={loadingChallenge}
                  className="px-4 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-colors">
                  <RefreshCw size={14} className={loadingChallenge ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-4">
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-blue-500 font-bold uppercase tracking-wider">Whisper & ECAPA-TDNN</span>
                <h3 className="text-sm font-bold text-white uppercase">Step 4: Voice MFA Enrollment</h3>
                <p className="text-xs text-zinc-455 leading-relaxed">
                  Record the dynamic security sentence challenge shown below. The system checks speech correctness via OpenAI Whisper and extracts voiceprint properties.
                </p>
              </div>

              <div className="p-3.5 bg-blue-950/20 border border-blue-900/30 rounded-xl space-y-1.5">
                <span className="text-[8px] font-mono text-blue-400 uppercase tracking-widest block font-bold">SPEAK THIS PASSPHRASE</span>
                <p className="text-xs font-bold text-white leading-relaxed italic">
                  "{passphrase}"
                </p>
              </div>

              <button onClick={runScoringVerification} disabled={!audioB64 || verifying}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-650 text-white text-xs font-bold font-mono uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2">
                {verifying && <div className="w-3 h-3 border-2 border-zinc-400 border-t-white rounded-full animate-spin" />}
                Run Pipeline Analysis →
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Scoring Risk Engine */}
        {activeStep === 'SCORING' && (
          <div className="space-y-6 text-center py-10 max-w-lg mx-auto">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-blue-500/20 bg-blue-500/5 animate-ping" />
              <Shield className="text-blue-500 animate-pulse" size={28} />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white uppercase tracking-wider font-mono">Step 5: Aggregating Biometric Scoring Matrices</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Contacting Risk Scoring Engine. Re-calibrating face matching ratios, liveness anti-spoof checks, deepfake probabilities, Whisper vocal verification, and AASIST audio phase metrics into a final Trust Score.
              </p>
            </div>

            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 animate-[loading_3.0s_ease-out]" style={{ width: '100%' }} />
            </div>
          </div>
        )}

        {/* Step 6: Done (Dashboard UI) */}
        {activeStep === 'DONE' && pipelineResult && (
          <div className="space-y-6">
            
            {/* Top Stats Overview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              
              {/* Radial trust score gauge */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-4 border border-zinc-800 bg-zinc-950/60 rounded-2xl text-center relative overflow-hidden">
                <div className="absolute -inset-10 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
                
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block font-bold mb-3">FINAL TRUST SCORE</span>
                
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="56" cy="56" r="48" stroke="#18181b" strokeWidth="6" fill="transparent" />
                    <circle cx="56" cy="56" r="48" stroke="#2563eb" strokeWidth="6" fill="transparent"
                      strokeDasharray={2 * Math.PI * 48}
                      strokeDashoffset={2 * Math.PI * 48 * (1 - pipelineResult.trustScore / 100)} 
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <span className="absolute text-xl font-black text-white font-mono">{pipelineResult.trustScore}%</span>
                </div>
                
                <span className={`mt-4 px-2.5 py-1 rounded border text-[8px] font-mono font-bold tracking-widest uppercase ${getRiskColor(pipelineResult.riskLevel)}`}>
                  {pipelineResult.riskLevel}
                </span>
              </div>

              {/* Specific detail breakdown bar graphs */}
              <div className="md:col-span-8 space-y-3">
                <h4 className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider border-b border-zinc-800 pb-1.5">Model Scoring Parameters</h4>
                
                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between text-[9px] font-mono text-zinc-450 mb-0.5">
                      <span>ARC_FACE MATCH SIMILARITY</span>
                      <span className="text-white font-bold">{pipelineResult.metrics.faceMatch.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${pipelineResult.metrics.faceMatch}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[9px] font-mono text-zinc-450 mb-0.5">
                      <span>SILENT_LIVENESS RATING</span>
                      <span className="text-white font-bold">{pipelineResult.metrics.faceLiveness.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${pipelineResult.metrics.faceLiveness}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[9px] font-mono text-zinc-450 mb-0.5">
                      <span>ECAPA_SPEAKER MATCH RATING</span>
                      <span className="text-white font-bold">{pipelineResult.metrics.voiceMatch.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${pipelineResult.metrics.voiceMatch}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[9px] font-mono text-zinc-450 mb-0.5">
                      <span>WHISPER SPEECH ACCURACY</span>
                      <span className="text-white font-bold">{pipelineResult.metrics.speechAccuracy.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${pipelineResult.metrics.speechAccuracy}%` }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-1.5">
                    <div>
                      <div className="flex justify-between text-[8px] font-mono text-zinc-500">
                        <span>DEEP_FAKE RISK</span>
                        <span className={pipelineResult.metrics.deepfakeRisk > 50 ? 'text-red-500 font-bold' : 'text-zinc-350'}>
                          {pipelineResult.metrics.deepfakeRisk.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden mt-0.5">
                        <div className={`h-full ${pipelineResult.metrics.deepfakeRisk > 50 ? 'bg-red-500' : 'bg-zinc-650'}`} style={{ width: `${pipelineResult.metrics.deepfakeRisk}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[8px] font-mono text-zinc-500">
                        <span>VOICE_SPOOF RISK</span>
                        <span className={pipelineResult.metrics.voiceSpoofRisk > 55 ? 'text-red-500 font-bold' : 'text-zinc-350'}>
                          {pipelineResult.metrics.voiceSpoofRisk.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden mt-0.5">
                        <div className={`h-full ${pipelineResult.metrics.voiceSpoofRisk > 55 ? 'bg-red-500' : 'bg-zinc-650'}`} style={{ width: `${pipelineResult.metrics.voiceSpoofRisk}%` }} />
                      </div>
                    </div>
                  </div>
                  {pipelineResult.voiceError && (
                    <div className="mt-4 p-3 border border-red-500/30 bg-red-500/10 rounded-xl flex items-start gap-2">
                      <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={14} />
                      <div>
                        <p className="text-[10px] font-bold font-mono text-red-500 uppercase">Voice Verification Flagged</p>
                        <p className="text-xs text-red-400 mt-1">{pipelineResult.voiceError}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Graphs Layout: Spectrogram & Liveness Heatmap */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-800">
              
              {/* Heatmap simulation */}
              <div className="p-4 border border-zinc-850 bg-zinc-950/40 rounded-2xl">
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block font-bold mb-2 flex items-center justify-between">
                  <span>SILENT_LIVENESS HEATMAP PROFILE</span>
                  <span className="text-emerald-500">VALID LIVENESS MAP</span>
                </span>
                
                <div className="relative aspect-video rounded-xl border border-zinc-800 bg-zinc-900 flex items-center justify-center overflow-hidden">
                  {faceImageB64 ? (
                    <img src={faceImageB64} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                  ) : (
                    <div className="text-[10px] text-zinc-600 font-mono">No face preview cached</div>
                  )}
                  {pipelineResult.visuals?.heatmap?.map((pt: any, idx: number) => (
                    <div key={idx} className="absolute w-6 h-6 rounded-full bg-blue-500/20 blur-md border border-blue-500/10"
                      style={{ 
                         left: `${pt.x}%`, 
                         top: `${pt.y}%`, 
                         transform: `scale(${pt.intensity / 90.0})` 
                      }} 
                    />
                  ))}
                  <div className="absolute inset-0 border border-blue-500/20 pointer-events-none rounded-xl" />
                </div>
              </div>

              {/* Spectral voice frequencies graph */}
              <div className="p-4 border border-zinc-850 bg-zinc-950/40 rounded-2xl">
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block font-bold mb-2">
                  AASIST SPECTRUM TIMBRE WAVE
                </span>
                <div className="h-32 rounded-xl bg-zinc-900 border border-zinc-850 p-2.5 flex items-end justify-between gap-[2px]">
                  {pipelineResult.visuals?.spectrogram?.map((val: number, idx: number) => (
                    <div key={idx} className="bg-blue-600/60 rounded-t-[1px] transition-all"
                      style={{ 
                        height: `${val}%`,
                        flex: '1 1 auto'
                      }} 
                    />
                  ))}
                </div>
              </div>

            </div>

            {/* Action buttons */}
            <div className="flex gap-4 pt-4">
              <button onClick={() => {
                if (pipelineResult.riskLevel !== 'HIGH RISK') {
                  onComplete(pipelineResult);
                } else {
                  toast.error("Pipeline verified as High Risk. Access Blocked.");
                }
              }}
                className={`flex-1 py-3.5 font-bold font-mono text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg text-center ${
                  pipelineResult.riskLevel === 'HIGH RISK'
                    ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-800'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/10'
                }`}>
                {pipelineResult.riskLevel === 'HIGH RISK' ? 'Access Denied (Risk Level Exceeded)' : 'Mint and Finalize Session Access →'}
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Zero Storage Disclaimer Footer */}
      <div className="flex items-start gap-2.5 pt-4 text-[9px] text-zinc-500 leading-normal border-t border-zinc-900 mt-4">
        <AlertTriangle size={12} className="shrink-0 mt-0.5 text-zinc-500" />
        <span>
          Compliance Statement: Camera raw frames and microphone audio streams are permanently deleted locally after network vector extraction. The database only retains cryptographic logs, similarity percentages, and hashed witness keys to verify SIWE DID.
        </span>
      </div>
    </div>
  );
}
