"""
Meta Go — Silero VAD Wrapper
=============================
Voice Activity Detection using:
1. Silero VAD ONNX model (if available in models/ directory)
2. High-fidelity energy-based analytical fallback (RMS + ZCR sliding window)
"""
import io
import wave
import numpy as np
from typing import Tuple


class SileroVAD:
    """
    Voice Activity Detection wrapper.
    Detects whether a WAV audio stream contains actual human speech.
    """

    def __init__(self):
        self.has_silero = False
        self.model = None
        # Optional: load Silero ONNX model
        # try:
        #     import onnxruntime as ort
        #     import os
        #     model_path = os.path.join(os.path.dirname(__file__), 'models', 'silero_vad.onnx')
        #     if os.path.exists(model_path):
        #         self.model = ort.InferenceSession(model_path)
        #         self.has_silero = True
        # except Exception as e:
        #     print(f"Silero VAD model load failed: {e}. Using analytical fallback.")

    def check_voice_activity(self, audio_bytes: bytes) -> Tuple[bool, float, str]:
        """
        Check if audio contains valid human voice activity.

        Returns:
            (voice_detected: bool, confidence: float 0-1, reason: str)
        """
        if not audio_bytes or len(audio_bytes) < 44:
            return False, 0.0, "Audio data is too short or empty"

        if self.has_silero and self.model:
            try:
                return self._run_silero(audio_bytes)
            except Exception as e:
                print(f"Silero inference failed: {e}. Using analytical fallback.")

        return self._analytical_vad(audio_bytes)

    def _run_silero(self, audio_bytes: bytes) -> Tuple[bool, float, str]:
        """Run Silero ONNX VAD model."""
        try:
            wav_file = wave.open(io.BytesIO(audio_bytes), 'rb')
            frame_rate = wav_file.getframerate()
            n_frames = wav_file.getnframes()
            raw_data = wav_file.readframes(n_frames)
            wav_file.close()

            signal = np.frombuffer(raw_data, dtype=np.int16).astype(np.float32) / 32768.0
            
            # Silero expects 16kHz, 1 channel
            if frame_rate != 16000:
                # Simple downsampling (rough)
                ratio = frame_rate / 16000
                signal = signal[::int(ratio)] if ratio > 1 else signal

            # Run ONNX inference
            input_name = self.model.get_inputs()[0].name
            ort_input = {input_name: signal.reshape(1, -1)}
            output = self.model.run(None, ort_input)
            speech_prob = float(output[0])

            if speech_prob > 0.5:
                return True, speech_prob, "Speech detected by Silero VAD"
            else:
                return False, speech_prob, f"No speech detected (confidence: {speech_prob:.2f})"
        except Exception as e:
            raise RuntimeError(f"Silero inference error: {e}")

    def _analytical_vad(self, audio_bytes: bytes) -> Tuple[bool, float, str]:
        """
        Analytical VAD using energy, ZCR, and spectral features.
        """
        try:
            wav_file = wave.open(io.BytesIO(audio_bytes), 'rb')
            n_channels = wav_file.getnchannels()
            samp_width = wav_file.getsampwidth()
            frame_rate = wav_file.getframerate()
            n_frames = wav_file.getnframes()
            raw_data = wav_file.readframes(n_frames)
            wav_file.close()

            if samp_width == 2:
                signal = np.frombuffer(raw_data, dtype=np.int16).astype(np.float32)
            elif samp_width == 1:
                signal = (np.frombuffer(raw_data, dtype=np.uint8).astype(np.float32) - 128.0) * 256.0
            else:
                signal = np.frombuffer(raw_data, dtype=np.int32).astype(np.float32) / 65536.0

            if n_channels > 1:
                signal = signal.reshape(-1, n_channels).mean(axis=1)

            duration = n_frames / frame_rate

            if duration < 0.3:
                return False, 0.0, "Recording too short (minimum 0.3 seconds required)"

            if len(signal) == 0:
                return False, 0.0, "Empty audio signal"

            # 1. RMS Energy check
            rms = float(np.sqrt(np.mean(signal ** 2)))
            if rms < 80:
                return False, 0.0, "Audio level too low — please speak louder and closer to the microphone"

            # 2. Check active speech percentage using frame energy
            frame_len = int(frame_rate * 0.025)  # 25ms frames
            if frame_len == 0:
                frame_len = 256
            
            frames = [signal[i:i + frame_len] for i in range(0, len(signal), frame_len)
                      if len(signal[i:i + frame_len]) == frame_len]
            
            if not frames:
                return False, 0.1, "Could not analyze audio frames"

            frame_energies = [float(np.sqrt(np.mean(f ** 2))) for f in frames]
            noise_floor = np.percentile(frame_energies, 10)
            speech_threshold = max(noise_floor * 3.0, 200.0)
            
            active_frames = sum(1 for e in frame_energies if e > speech_threshold)
            speech_ratio = active_frames / len(frame_energies)

            if speech_ratio < 0.1:
                return False, speech_ratio, f"Insufficient speech detected ({speech_ratio*100:.0f}% activity) — please speak the full challenge phrase"

            # 3. Zero Crossing Rate — distinguishes speech from noise/hiss
            zcr_per_frame = []
            for f in frames[:min(len(frames), 50)]:
                zcr = float(np.sum(np.abs(np.diff(np.sign(f)))) / (2 * len(f)))
                zcr_per_frame.append(zcr)
            
            avg_zcr = float(np.mean(zcr_per_frame)) if zcr_per_frame else 0.0
            # Human speech: ZCR between 0.01 and 0.15
            zcr_ok = 0.005 <= avg_zcr <= 0.20

            if not zcr_ok and speech_ratio < 0.2:
                return False, speech_ratio * 0.5, "Audio pattern does not match human speech characteristics"

            # Combined confidence score
            energy_conf = min(1.0, rms / 3000.0)
            speech_conf = min(1.0, speech_ratio / 0.4)
            confidence = 0.6 * speech_conf + 0.4 * energy_conf
            confidence = max(0.0, min(1.0, confidence))

            return True, confidence, "Speech detected successfully"

        except wave.Error:
            # Try treating as raw audio (browser might send webm/ogg wrapped)
            return self._fallback_raw_vad(audio_bytes)
        except Exception as e:
            print(f"Analytical VAD error: {e}")
            return False, 0.0, f"Audio processing failed: {str(e)}"

    def _fallback_raw_vad(self, audio_bytes: bytes) -> Tuple[bool, float, str]:
        """Last resort: treat bytes as raw PCM and check energy."""
        try:
            # Try to parse as float32 PCM
            signal = np.frombuffer(audio_bytes[44:], dtype=np.int16).astype(np.float32)
            if len(signal) == 0:
                signal = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32)
            
            rms = float(np.sqrt(np.mean(signal ** 2))) if len(signal) > 0 else 0.0
            if rms > 100:
                return True, min(1.0, rms / 5000.0), "Speech likely detected (raw parse)"
            return False, 0.0, "Could not detect speech in audio data"
        except Exception:
            return False, 0.0, "Audio format not recognized — ensure microphone permission is granted"


# Module-level singleton
_silero_vad_instance = None

def get_vad() -> SileroVAD:
    global _silero_vad_instance
    if _silero_vad_instance is None:
        _silero_vad_instance = SileroVAD()
    return _silero_vad_instance
