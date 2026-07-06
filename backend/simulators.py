"""Lightweight simulators for TEST_MODE to avoid heavy ML deps during CI/tests.
Provides deterministic, safe outputs matching production interfaces used by server.
"""
import hashlib
import numpy as np

class ArcfaceSimulator:
    def extract_embedding(self, image_bytes: bytes):
        # deterministic 512-dim embedding from SHA256 hash
        h = hashlib.sha256(image_bytes).digest()
        # expand to 512 floats by repeating hash
        vals = list(h) * (512 // len(h) + 1)
        emb = np.array(vals[:512], dtype=float)
        norm = np.linalg.norm(emb)
        if norm == 0:
            return [0.0] * 512
        return (emb / norm).tolist()

class FaceLivenessStub:
    def predict(self, img):
        # return liveness_score(0.0-1.0), spoof_risk(0-100)
        return 0.95, 2.0

class WhisperStub:
    def transcribe_and_verify(self, audio_bytes, expected):
        # return transcription, accuracy (0-1), confidence (0-1)
        return expected or "", 1.0, 0.99

class EcapaStub:
    def extract_voiceprint(self, audio_bytes):
        return hashlib.sha1(audio_bytes).hexdigest()
    def verify_speaker(self, a, b):
        return 1.0 if a == b else 0.0

class AasistStub:
    def evaluate_spoof(self, audio_bytes):
        # voice_spoof_risk, ai_voice_prob, replay_prob
        return 5.0, 0.02, 0.01

class DeepfakeStub:
    def predict_risk(self, img):
        return 1.0

class RiskEngineStub:
    def calculate_trust_score(self, **kwargs):
        return 95.0, "LOW RISK", {"face": 50, "voice": 45}

# Factory
arcface_simulator = ArcfaceSimulator()
face_liveness_stub = FaceLivenessStub()
whisper_stub = WhisperStub()
ecapa_stub = EcapaStub()
aasist_stub = AasistStub()
deepfake_stub = DeepfakeStub()
risk_engine_stub = RiskEngineStub()
