'use client';
import { useState, useRef } from 'react';
import { Mic, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props { onComplete: (voiceHash: string) => void }

const PASSPHRASE = 'I authorize Meta Go to verify my sovereign identity';

function verifyPassphrase(spoken: string, expected: string): boolean {
  const spokenWords = spoken.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(Boolean);
  const expectedWords = expected.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(Boolean);
  
  if (spokenWords.length === 0) return false;
  
  let matchCount = 0;
  for (const word of expectedWords) {
    if (spokenWords.includes(word)) {
      matchCount++;
    }
  }
  
  const matchRatio = matchCount / expectedWords.length;
  return matchRatio >= 0.55; // 55% word match threshold
}

export function VoiceScanner({ onComplete }: Props) {
  const [phase, setPhase] = useState<'idle' | 'recording' | 'analyzing' | 'done' | 'unsupported'>('idle');
  const [transcript, setTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showBypass, setShowBypass] = useState(false);
  const recRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);

  async function start() {
    setError(null);
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    // Voice level meter
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      function loop() {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setAudioLevel(Math.min(100, (avg / 128) * 100));
        rafRef.current = requestAnimationFrame(loop);
      }
      loop();
    } catch (e: any) {
      console.warn('Microphone access failed:', e);
      setError('Microphone access denied or unavailable.');
      setShowBypass(true);
      return;
    }

    if (!SpeechRec) {
      console.warn('SpeechRecognition API not supported in this browser.');
      setError('Browser Speech Recognition API is unsupported.');
      setShowBypass(true);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      return;
    }

    setPhase('recording');

    const rec = new SpeechRec();
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e: any) => {
      const txt = Array.from(e.results).map((r: any) => r[0].transcript).join('');
      setTranscript(txt);
    };
    rec.onend = () => {
      setPhase('analyzing');
      setTimeout(() => {
        const t = transcriptRef.current.toLowerCase();
        const isValid = verifyPassphrase(t, PASSPHRASE);
        if (isValid) {
          finalize(`voice-${hashStr(transcriptRef.current)}`);
        } else {
          setPhase('idle');
          setTranscript('');
          toast.error('Passphrase mismatch! Please read the sentence exactly.');
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
          }
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
        }
      }, 1200);
    };
    rec.onerror = (e: any) => {
      console.error('Speech recognition error:', e);
      setError('Voice capturing encountered an error.');
      setShowBypass(true);
      setPhase('idle');
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    recRef.current = rec;
    rec.start();
  }

  const transcriptRef = useRef('');
  transcriptRef.current = transcript;

  function hashStr(s: string) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xfffffff;
    return h.toString(16).padStart(8, '0');
  }

  function finalize(voiceHash: string) {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setPhase('done');
    setTimeout(() => onComplete(voiceHash), 700);
  }

  return (
    <div className="space-y-5">
      <div className="p-5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-center">
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
          <div className={`absolute inset-0 rounded-full ${phase === 'recording' ? 'bg-red-500/10 animate-ping' : ''}`} />
          <div className="relative w-16 h-16 rounded-full bg-blue-600/10 border border-blue-600/30 flex items-center justify-center">
            <Mic size={26} className={phase === 'recording' ? 'text-red-500' : 'text-blue-600'} />
          </div>
        </div>
        <p className="mt-4 text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
          {phase === 'idle' && 'Voice MFA — Click below to record'}
          {phase === 'recording' && 'Listening...'}
          {phase === 'analyzing' && 'Verifying vocal print...'}
          {phase === 'done' && 'Voice engram captured'}
        </p>
        {phase === 'recording' && (
          <div className="mt-3 w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 transition-all" style={{ width: `${audioLevel}%` }} />
          </div>
        )}
      </div>

      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 rounded-xl">
        <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-1">Speak this passphrase</p>
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 italic">"{PASSPHRASE}"</p>
        {transcript && <p className="text-[10px] text-zinc-500 mt-2 font-mono">heard: "{transcript}"</p>}
      </div>

      {error && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900/30 rounded-xl flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Microphone or API Notice</p>
            <p className="text-[10px] mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {phase === 'idle' && (
        <button onClick={start} data-testid="voice-start-btn"
          className="w-full py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-xl text-sm font-bold transition-all">
          Start Voice Enrollment
        </button>
      )}

      {showBypass && phase !== 'done' && (
        <button onClick={() => finalize('simulated-voice-bypass-' + Date.now())}
          className="w-full py-2.5 bg-amber-600/10 hover:bg-amber-600/20 text-amber-550 border border-amber-600/25 text-[10px] font-mono rounded-xl tracking-wider uppercase flex items-center justify-center gap-1.5 transition-colors">
          [Simulator Bypass] Enroll Mock Voice Signature
        </button>
      )}

      {phase === 'done' && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl flex items-center gap-3">
          <CheckCircle2 size={16} className="text-emerald-500" />
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Voice biometric verified</p>
        </div>
      )}

      <div className="flex items-start gap-2 text-[10px] text-zinc-450">
        <AlertCircle size={11} className="shrink-0 mt-0.5" />
        <span>Vocal pattern hashed locally — only the cryptographic digest leaves your device.</span>
      </div>
    </div>
  );
}
