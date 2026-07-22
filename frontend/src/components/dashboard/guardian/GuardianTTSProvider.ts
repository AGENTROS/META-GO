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
    // Force stop any ongoing speech
    if (this.synth.speaking || this.synth.pending) {
      this.synth.cancel();
    }

    // Clean text of markdown stars, hashes, and formatting for speech synthesis
    const cleanSpeechText = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#/g, '')
      .replace(/-/g, ' ')
      .replace(/\n/g, '. ')
      .trim();

    return {
      mode: "browser-speech",
      supportsAudioAnalysis: false,
      play: () => new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
        this.currentUtterance = utterance;
        
        // Populate voices dynamically
        const voices = this.synth.getVoices();
        if (voices.length > 0) {
          const selectedVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
          utterance.voice = selectedVoice;
        }

        utterance.rate = 1.0;
        utterance.pitch = 0.9;
        utterance.volume = 1.0;

        utterance.onstart = () => {
          if (onStart) onStart();
        };

        utterance.onend = () => {
          if (onEnd) onEnd();
          resolve();
        };

        utterance.onerror = (e) => {
          console.warn('SpeechSynthesis utterance warning:', e);
          if (onEnd) onEnd();
          resolve();
        };

        if (onBoundary) {
          utterance.onboundary = onBoundary;
        }

        // Resume engine if stuck
        if (this.synth.paused) {
          this.synth.resume();
        }

        // Speak utterance
        setTimeout(() => {
          this.synth.speak(utterance);
        }, 50);
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
