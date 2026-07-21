import sys
import os
import pytest

# Ensure backend directory is in the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np
import cv2
import wave
import io
import base64

from silent_face_liveness import SilentFaceAntiSpoofing
from whisper_voice_verifier import WhisperVoiceVerifier
from ecapa_speaker_verifier import EcapaSpeakerVerifier
from aasist_voice_spoof import AasistVoiceSpoofer
from deepfake_bench_detector import DeepfakeBenchDetector
from risk_engine import BiometricRiskEngine

def test_silent_face_liveness():
    detector = SilentFaceAntiSpoofing()
    # Create random BGR image (face crop)
    img = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
    liveness_score, spoof_risk = detector.predict(img)
    
    assert 0.0 <= liveness_score <= 100.0
    assert 0.0 <= spoof_risk <= 100.0
    assert abs(liveness_score + spoof_risk - 100.0) < 1e-3 or spoof_risk == 85.0

def test_whisper_voice_verifier():
    verifier = WhisperVoiceVerifier()
    
    # Create basic 1-second silent WAV in bytes
    wav_io = io.BytesIO()
    wav_file = wave.open(wav_io, 'wb')
    wav_file.setnchannels(1)
    wav_file.setsampwidth(2)
    wav_file.setframerate(16000)
    wav_file.writeframes(b'\x00' * 32000)
    wav_file.close()
    audio_bytes = wav_io.getvalue()
    
    transcribed, accuracy, confidence = verifier.transcribe_and_verify(audio_bytes, "Verify my sovereign identity")
    # Silence check
    assert "VAD Failed" in transcribed or "[No Audio Detected]" in transcribed or transcribed == ""
    assert accuracy == 0.0
    assert confidence == 0.0

def test_ecapa_speaker_verifier():
    verifier = EcapaSpeakerVerifier()
    
    # Create simple synth sine wave audio bytes to mock voice
    wav_io = io.BytesIO()
    wav_file = wave.open(wav_io, 'wb')
    wav_file.setnchannels(1)
    wav_file.setsampwidth(2)
    wav_file.setframerate(16000)
    
    # Write a 1-second 440Hz sine wave
    t = np.linspace(0, 1.0, 16000, endpoint=False)
    signal = (np.sin(2 * np.pi * 440 * t) * 16383).astype(np.int16)
    wav_file.writeframes(signal.tobytes())
    wav_file.close()
    audio_bytes = wav_io.getvalue()
    
    vp1 = verifier.extract_voiceprint(audio_bytes)
    assert "features" in vp1
    assert "pitch" in vp1["features"]
    
    # Self similarity check
    match = verifier.verify_speaker(vp1, vp1)
    assert match > 80.0

def test_aasist_voice_spoof():
    aasist = AasistVoiceSpoofer()
    
    # Synth WAV
    wav_io = io.BytesIO()
    wav_file = wave.open(wav_io, 'wb')
    wav_file.setnchannels(1)
    wav_file.setsampwidth(2)
    wav_file.setframerate(16000)
    t = np.linspace(0, 1.0, 16000, endpoint=False)
    signal = (np.sin(2 * np.pi * 300 * t) * 16383).astype(np.int16)
    wav_file.writeframes(signal.tobytes())
    wav_file.close()
    audio_bytes = wav_io.getvalue()
    
    is_human, liveness_score, reason = aasist.check_spoof(audio_bytes)
    assert isinstance(is_human, bool)
    assert 0.0 <= liveness_score <= 100.0

def test_deepfake_bench_detector():
    df_detector = DeepfakeBenchDetector()
    img = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
    risk = df_detector.predict_risk(img)
    assert 0.0 <= risk <= 100.0

def test_risk_scoring_engine():
    engine = BiometricRiskEngine()
    
    # 1. Ideal Low Risk
    score, level, breakdown = engine.calculate_trust_score(
        face_match_score=98.0,
        face_liveness_score=97.0,
        voice_match_score=98.0,
        speech_accuracy_score=96.0,
        deepfake_risk_score=2.0,
        voice_spoof_risk_score=1.5
    )
    assert score >= 95.0
    assert level == "LOW RISK"
    
    # 2. Medium Risk
    score, level, breakdown = engine.calculate_trust_score(
        face_match_score=85.0,
        face_liveness_score=82.0,
        voice_match_score=84.0,
        speech_accuracy_score=80.0,
        deepfake_risk_score=10.0,
        voice_spoof_risk_score=12.0
    )
    assert 70.0 <= score < 95.0
    assert level in ["MEDIUM RISK", "HIGH RISK"]
    
    # 3. Direct Spoof Fail override
    score, level, breakdown = engine.calculate_trust_score(
        face_match_score=98.0,
        face_liveness_score=30.0, # Fail liveness
        voice_match_score=98.0,
        speech_accuracy_score=96.0,
        deepfake_risk_score=2.0,
        voice_spoof_risk_score=1.5
    )
    assert score <= 35.0
    assert level == "HIGH RISK"
    assert breakdown["override_applied"] is True
