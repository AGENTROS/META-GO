export type GuardianState =
  | "idle"
  | "listening"
  | "processing"
  | "speaking"
  | "explaining"
  | "alert"
  | "error";

export interface GuardianSpeechResult {
  mode: "browser-speech" | "audio-buffer";
  supportsAudioAnalysis: boolean;
  play: () => Promise<void>;
  cancel: () => void;
}

export class GuardianTTSProvider {
  private synth: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voice: SpeechSynthesisVoice | null = null;
  
  constructor() {
    this.synth = window.speechSynthesis;
    // Attempt to load a good voice
    const loadVoices = () => {
      const voices = this.synth.getVoices();
      // Priority list for high-tech AI robotic / assistant voice profiles
      this.voice = voices.find(v => 
        v.name.includes('Google UK English Male') || 
        v.name.includes('Daniel') || 
        v.name.includes('Jarvis') || 
        v.name.includes('Natural') || 
        v.name.includes('Google US English') ||
        v.lang === 'en-US'
      ) || voices[0] || null;
    };
    loadVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = loadVoices;
    }
  }

  public async speak(text: string, onStart?: () => void, onEnd?: () => void, onError?: () => void, onBoundary?: (e: SpeechSynthesisEvent) => void): Promise<GuardianSpeechResult> {
    this.cancel();
    
    return {
      mode: "browser-speech",
      supportsAudioAnalysis: false,
      play: () => new Promise((resolve, reject) => {
        this.currentUtterance = new SpeechSynthesisUtterance(text);
        if (this.voice) {
          this.currentUtterance.voice = this.voice;
        }
        // Futuristic AI Guardian Voice Tuning
        this.currentUtterance.rate = 1.05;
        this.currentUtterance.pitch = 0.85; // Deep robotic AI resonance

        this.currentUtterance.onstart = () => {
          if (onStart) onStart();
        };
        this.currentUtterance.onend = () => {
          if (onEnd) onEnd();
          resolve();
        };
        this.currentUtterance.onerror = (e) => {
          if (onError) onError();
          reject(e);
        };
        if (onBoundary) {
          this.currentUtterance.onboundary = onBoundary;
        }

        this.synth.speak(this.currentUtterance);
      }),
      cancel: () => this.cancel()
    };
  }

  public cancel(): void {
    if (this.synth.speaking || this.synth.pending) {
      this.synth.cancel();
    }
    this.currentUtterance = null;
  }
}

export const guardianTTS = typeof window !== 'undefined' ? new GuardianTTSProvider() : null;
