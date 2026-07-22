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

    // Clean text of markdown stars, hashes, and formatting for speech synthesis
    const cleanSpeechText = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#/g, '')
      .replace(/-/g, ' ')
      .replace(/\n/g, '. ');

    return {
      mode: "browser-speech",
      supportsAudioAnalysis: false,
      play: () => new Promise((resolve, reject) => {
        // Always get latest voices on play call
        const voices = this.synth.getVoices();
        const preferredVoice = voices.find(v => 
          v.name.includes('Google UK English Male') || 
          v.name.includes('Daniel') || 
          v.name.includes('Natural') || 
          v.name.includes('Google US English') ||
          v.lang.startsWith('en')
        ) || voices[0] || null;

        this.currentUtterance = new SpeechSynthesisUtterance(cleanSpeechText);
        if (preferredVoice) {
          this.currentUtterance.voice = preferredVoice;
        }
        
        // Deep Male Voice Pitch Tuning
        this.currentUtterance.rate = 1.0;
        this.currentUtterance.pitch = 0.8;
        this.currentUtterance.volume = 1.0;

        this.currentUtterance.onstart = () => {
          if (onStart) onStart();
        };
        this.currentUtterance.onend = () => {
          if (onEnd) onEnd();
          resolve();
        };
        this.currentUtterance.onerror = (e) => {
          if (onError) onError();
          resolve(); // Resolve to prevent state lockup
        };
        if (onBoundary) {
          this.currentUtterance.onboundary = onBoundary;
        }

        // Resume audio context/synth if paused by browser autoplay policy
        if (this.synth.paused) {
          this.synth.resume();
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
