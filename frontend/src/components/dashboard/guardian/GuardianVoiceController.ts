import { GuardianState, guardianTTS } from './GuardianTTSProvider';
import { authenticatedFetch } from '@/lib/api';
import { useAccount } from 'wagmi';

export class GuardianVoiceController {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphoneNode: MediaStreamAudioSourceNode | null = null;
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  
  private _state: GuardianState = 'idle';
  private onStateChange: (state: GuardianState) => void = () => {};
  private onLevelChange: (level: number) => void = () => {};
  private onResponse: (data: any) => void = () => {};
  public onUserTranscript?: (text: string) => void;

  private animationFrameId: number = 0;
  private lastLevel: number = 0;
  private recordingStartTime: number = 0;

  // TTS driven fake level since browser TTS doesn't expose audio streams easily
  private isTTSActive: boolean = false;
  private ttsPulseInterval: NodeJS.Timeout | null = null;

  constructor(
    onStateChange: (state: GuardianState) => void,
    onLevelChange: (level: number) => void,
    onResponse: (res: any) => void
  ) {
    this.onStateChange = onStateChange;
    this.onLevelChange = onLevelChange;
    this.onResponse = onResponse;
  }

  private setState(newState: GuardianState) {
    this._state = newState;
    this.onStateChange(newState);
  }

  public getState() {
    return this._state;
  }

  public async startListening() {
    if (this._state === 'speaking') {
      guardianTTS?.cancel();
      this.stopTTSPulse();
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.microphoneNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.microphoneNode.connect(this.analyser);

      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(this.mediaStream);
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.audioChunks.push(e.data);
      };
      
      this.recordingStartTime = Date.now();
      this.mediaRecorder.start();

      this.setState('listening');
      this.updateAudioLevel();
    } catch (err) {
      console.error("Microphone access denied or error:", err);
      this.setState('error');
    }
  }

  public async stopListening(address: string, sessionId: string) {
    if (this._state !== 'listening') return;
    
    this.stopAudioAnalysis();
    this.onLevelChange(0); // Reset level

    const duration = Date.now() - this.recordingStartTime;
    if (duration < 500) {
      this.setState('idle');
      console.log("Recording too short, ignored.");
      return;
    }

    this.setState('processing');

    // Wait until ondataavailable is fully processed
    await new Promise<void>((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        resolve();
        return;
      }
      this.mediaRecorder.onstop = () => resolve();
      this.mediaRecorder.stop();
    });

    const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
    
    if (audioBlob.size < 1000) {
      console.warn("Audio blob too small, likely silent:", audioBlob.size);
      this.setState('idle');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice_query.webm');
      formData.append('address', address);

      const transcribeRes = await authenticatedFetch(`/api/dashboard/intelligence/transcribe`, {
        method: 'POST',
        body: formData,
      });
      
      const transcribeData = await transcribeRes.json();
      if (!transcribeData.ok) {
        console.warn("Transcription failed or silence detected:", transcribeData.message);
        this.setState('idle');
        return;
      }

      const text = transcribeData.text;
      
      if (this.onUserTranscript) {
        this.onUserTranscript(text);
      }

      await this.sendTextQuery(text, address, sessionId);
    } catch (err) {
      console.error(err);
      this.setState('error');
    }
  }

  public async sendTextQuery(text: string, address: string, sessionId: string) {
    if (this._state === 'speaking') {
      guardianTTS?.cancel();
      this.stopTTSPulse();
    }
    
    this.setState('processing');

    try {
      const askRes = await authenticatedFetch(`/api/dashboard/intelligence/ask?address=${address}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text, session_id: sessionId })
      });

      if (!askRes.ok) throw new Error("Ask endpoint failed");
      const askData = await askRes.json();
      
      this.onResponse({ userQuery: text, ...askData });

      this.setState('speaking');
      if (guardianTTS) {
        const speechParams = await guardianTTS.speak(
          askData.reply,
          () => this.startTTSPulse(),
          () => {
            this.stopTTSPulse();
            this.setState('idle');
          },
          () => {
            this.stopTTSPulse();
            this.setState('error');
          },
          () => this.onLevelChange(0.3 + Math.random() * 0.4)
        );
        await speechParams.play();
      } else {
        this.setState('idle');
      }
    } catch (err) {
      if (err && (typeof err !== 'object' || Object.keys(err).length > 0)) {
        console.error('Guardian voice controller error:', err);
      }
      this.setState('error');
    }
  }

  private updateAudioLevel = () => {
    if (this._state !== 'listening' || !this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const avg = sum / dataArray.length;
    // Normalize 0-255 to 0.0 - 1.0 with some floor trimming
    let currentLevel = Math.max(0, (avg - 10) / 100);
    currentLevel = Math.min(1, currentLevel);

    // Smoothing
    this.lastLevel = this.lastLevel * 0.7 + currentLevel * 0.3;
    
    // Very strict flatlining on silence
    const finalLevel = this.lastLevel < 0.05 ? 0 : this.lastLevel;
    
    this.onLevelChange(finalLevel);
    this.animationFrameId = requestAnimationFrame(this.updateAudioLevel);
  }

  private stopAudioAnalysis() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    if (this.microphoneNode) this.microphoneNode.disconnect();
    if (this.mediaStream) this.mediaStream.getTracks().forEach(track => track.stop());
    if (this.audioContext && this.audioContext.state !== 'closed') this.audioContext.close();
    
    this.analyser = null;
    this.microphoneNode = null;
    this.mediaStream = null;
    this.audioContext = null;
  }

  private startTTSPulse() {
    this.isTTSActive = true;
    this.ttsPulseInterval = setInterval(() => {
      // Procedural fallback animation ONLY while TTS is actively speaking (no real stream available)
      const pulse = 0.2 + Math.random() * 0.5;
      this.onLevelChange(pulse);
    }, 100);
  }

  private stopTTSPulse() {
    this.isTTSActive = false;
    if (this.ttsPulseInterval) {
      clearInterval(this.ttsPulseInterval);
      this.ttsPulseInterval = null;
    }
    this.onLevelChange(0);
  }

  public cleanup() {
    this.stopAudioAnalysis();
    this.stopTTSPulse();
    guardianTTS?.cancel();
  }
}
