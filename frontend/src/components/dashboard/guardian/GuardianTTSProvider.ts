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

    // Try playing direct Sukuna Voice MP3 file
    try {
      const audio = new Audio('/audio/guardian_sukuna.mp3');
      return {
        mode: "audio-buffer",
        supportsAudioAnalysis: true,
        play: () => new Promise((resolve) => {
          audio.onplay = () => { if (onStart) onStart(); };
          audio.onended = () => { if (onEnd) onEnd(); resolve(); };
          audio.onerror = () => {
            // Fallback to speech synthesis if audio error
            this.playFallbackSynth(text, onStart, onEnd, resolve);
          };
          audio.play().catch(() => {
            this.playFallbackSynth(text, onStart, onEnd, resolve);
          });
        }),
        cancel: () => { audio.pause(); audio.currentTime = 0; }
      };
    } catch (e) {
      // Fallback
    }

    return this.getFallbackResult(text, onStart, onEnd);
  }

  private playFallbackSynth(text: string, onStart?: () => void, onEnd?: () => void, resolve?: () => void) {
    const cleanSpeechText = text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/#/g, '').replace(/-/g, ' ').replace(/\n/g, '. ').trim();
    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    const voices = this.synth.getVoices();
    if (voices.length > 0) utterance.voice = voices.find(v => v.lang.startsWith('en')) || voices[0];
    utterance.rate = 1.0;
    utterance.pitch = 0.5; // Deep Sukuna Pitch
    utterance.onstart = () => { if (onStart) onStart(); };
    utterance.onend = () => { if (onEnd) onEnd(); if (resolve) resolve(); };
    utterance.onerror = () => { if (onEnd) onEnd(); if (resolve) resolve(); };
    if (this.synth.paused) this.synth.resume();
    this.synth.speak(utterance);
  }

  private getFallbackResult(text: string, onStart?: () => void, onEnd?: () => void): GuardianSpeechResult {
    return {
      mode: "browser-speech",
      supportsAudioAnalysis: false,
      play: () => new Promise((resolve) => {
        this.playFallbackSynth(text, onStart, onEnd, resolve);
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
