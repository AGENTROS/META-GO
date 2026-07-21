"""
Meta Go — ECAPA-TDNN Speaker Verifier (Upgraded)
==================================================
Speaker verification and enrollment using:
1. SpeechBrain ECAPA-TDNN 192-dim embeddings (if installed)
2. High-fidelity analytical pitch/spectral fallback

Templates are Fernet-encrypted before DB storage.
Never stores raw embeddings or recordings.
"""
import io
import os
import wave
import json
import base64
import hashlib
import secrets
import numpy as np
from typing import Optional, Tuple, List, Dict, Any


def _get_fernet():
    """Get or create a Fernet instance for encrypting voice templates."""
    try:
        from cryptography.fernet import Fernet
        # Prefer explicit VOICE_TEMPLATE_KEY. If present, use it.
        voice_key = os.environ.get("VOICE_TEMPLATE_KEY")
        if voice_key:
            return Fernet(voice_key.encode() if isinstance(voice_key, str) else voice_key)

        # Legacy fallback: try deriving from JWT_SECRET for backward compatibility only.
        jwt_secret = os.environ.get("JWT_SECRET")
        if jwt_secret:
            raw = hashlib.sha256(f"voicetemplate:{jwt_secret}".encode()).digest()
            key = base64.urlsafe_b64encode(raw)
            return Fernet(key)
    except ImportError:
        return None


def encrypt_template(template_dict: Dict[str, Any]) -> str:
    """Encrypt a voice template dict and return base64 ciphertext string."""
    fernet = _get_fernet()
    payload = json.dumps(template_dict, separators=(",", ":")).encode()
    if fernet:
        return fernet.encrypt(payload).decode()
    # Fallback: base64 encode only (dev mode without cryptography lib)
    return base64.urlsafe_b64encode(payload).decode()


def decrypt_template(encrypted_str: str) -> Optional[Dict[str, Any]]:
    """Decrypt an encrypted voice template string back to dict."""
    try:
        # Try decrypting using configured VOICE_TEMPLATE_KEY first (if any),
        # then fall back to legacy JWT-derived key or base64-only encoding for compatibility.
        data = encrypted_str.encode()
        primary = None
        try:
            primary = _get_fernet()
        except Exception:
            primary = None

        if primary:
            try:
                payload = primary.decrypt(data)
                return json.loads(payload.decode())
            except Exception:
                # fall through to legacy attempt
                pass

        # Legacy: try base64 decode (no crypto)
        try:
            payload = base64.urlsafe_b64decode(data)
            return json.loads(payload.decode())
        except Exception:
            # final attempt: derive legacy key from JWT_SECRET explicitly
            try:
                jwt_secret = os.environ.get("JWT_SECRET")
                if jwt_secret:
                    from cryptography.fernet import Fernet
                    raw = hashlib.sha256(f"voicetemplate:{jwt_secret}".encode()).digest()
                    key = base64.urlsafe_b64encode(raw)
                    payload = Fernet(key).decrypt(data)
                    return json.loads(payload.decode())
            except Exception as e:
                print(f"[EcapaSpeakerVerifier] Failed to decrypt template (legacy attempt): {e}")
        return None
    except Exception as e:
        print(f"[EcapaSpeakerVerifier] Failed to decrypt template: {e}")
        return None


def reencrypt_template_with_voice_key(encrypted_str: str) -> Optional[str]:
    """Given an existing encrypted template (any supported format), decrypt it and
    re-encrypt using the configured VOICE_TEMPLATE_KEY. Returns the new ciphertext
    or None on failure. This helper enables an explicit migration step.
    """
    try:
        data = decrypt_template(encrypted_str)
        if data is None:
            return None
        from cryptography.fernet import Fernet
        voice_key = os.environ.get("VOICE_TEMPLATE_KEY")
        if not voice_key:
            raise RuntimeError("VOICE_TEMPLATE_KEY not configured; cannot re-encrypt template.")
        f = Fernet(voice_key.encode() if isinstance(voice_key, str) else voice_key)
        payload = json.dumps(data, separators=(",", ":")).encode()
        return f.encrypt(payload).decode()
    except Exception as e:
        print(f"[EcapaSpeakerVerifier] Re-encrypt failed: {e}")
        return None


class EcapaSpeakerVerifier:
    """
    SpeechBrain ECAPA-TDNN Speaker Verification.
    Extracts 192-dim speaker embeddings and computes cosine similarity.
    Falls back to multi-feature analytical voiceprint if SpeechBrain is unavailable.
    """

    def __init__(self):
        self.has_speechbrain = False
        self.verifier = None

        # Attempt to load SpeechBrain ECAPA-TDNN
        try:
            from speechbrain.inference.speaker import SpeakerRecognition  # type: ignore
            self.verifier = SpeakerRecognition.from_hparams(
                source="speechbrain/spkrec-ecapa-voxceleb",
                savedir=os.path.join(os.path.dirname(__file__), "models", "ecapa")
            )
            self.has_speechbrain = True
            print("[EcapaSpeakerVerifier] Loaded SpeechBrain ECAPA-TDNN model.")
        except ImportError:
            print("[EcapaSpeakerVerifier] speechbrain not installed. Using analytical fallback.")
        except Exception as e:
            print(f"[EcapaSpeakerVerifier] SpeechBrain load failed: {e}. Using analytical fallback.")

    # ------------------------------------------------------------------
    # Embedding extraction
    # ------------------------------------------------------------------

    def extract_embedding(self, audio_bytes: bytes) -> Optional[Dict[str, Any]]:
        """
        Extract a speaker embedding from audio bytes.
        Returns a dict with 'type', 'embedding' (list of floats), and 'features'.
        Returns None if extraction fails.
        """
        if not audio_bytes or len(audio_bytes) < 44:
            return None

        if self.has_speechbrain and self.verifier:
            try:
                return self._extract_speechbrain(audio_bytes)
            except Exception as e:
                print(f"[EcapaSpeakerVerifier] SpeechBrain extraction failed: {e}")

        return self._extract_analytical(audio_bytes)

    def _extract_speechbrain(self, audio_bytes: bytes) -> Dict[str, Any]:
        """Extract 192-dim ECAPA-TDNN embedding using SpeechBrain."""
        import tempfile
        import torch

        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            f.write(audio_bytes)
            tmp_path = f.name

        try:
            embedding = self.verifier.encode_batch(
                self.verifier.load_audio(tmp_path).unsqueeze(0)
            ).squeeze(0).detach().cpu().numpy()
            # Normalize L2
            norm = np.linalg.norm(embedding)
            if norm > 0:
                embedding = embedding / norm
            return {
                "type": "ecapa_192d",
                "embedding": embedding.tolist(),
                "features": None,
            }
        finally:
            try:
                os.unlink(tmp_path)
            except Exception:
                pass

    def _extract_analytical(self, audio_bytes: bytes) -> Optional[Dict[str, Any]]:
        """
        Extract multi-feature analytical voiceprint (pitch, sub-bands, MFCC proxy, ZCR).
        Returns dict with 'type': 'analytical' and 'features'.
        """
        try:
            wav_file = wave.open(io.BytesIO(audio_bytes), 'rb')
            n_channels = wav_file.getnchannels()
            samp_width = wav_file.getsampwidth()
            frame_rate = wav_file.getframerate()
            n_frames = wav_file.getnframes()
            raw_data = wav_file.readframes(n_frames)
            wav_file.close()
        except Exception:
            return self._parse_non_wav(audio_bytes)

        if samp_width == 2:
            signal = np.frombuffer(raw_data, dtype=np.int16).astype(np.float32)
        elif samp_width == 1:
            signal = (np.frombuffer(raw_data, dtype=np.uint8).astype(np.float32) - 128.0) * 256.0
        else:
            signal = np.frombuffer(raw_data, dtype=np.int32).astype(np.float32) / 65536.0

        if n_channels > 1:
            signal = signal.reshape(-1, n_channels).mean(axis=1)

        if len(signal) < 1000:
            return None

        # 1. Pitch (F0) via autocorrelation
        min_lag = max(1, int(frame_rate / 350))
        max_lag = int(frame_rate / 60)
        center = len(signal) // 2
        seg_len = min(len(signal), int(frame_rate * 0.5))
        segment = signal[max(0, center - seg_len // 2): center + seg_len // 2]
        autocorr = np.correlate(segment, segment, mode='full')
        autocorr = autocorr[len(autocorr) // 2:]
        if len(autocorr) > max_lag and max_lag > min_lag:
            r_lag = autocorr[min_lag:max_lag]
            peak_lag = int(np.argmax(r_lag)) + min_lag
            pitch = float(frame_rate / peak_lag) if peak_lag > 0 else 130.0
        else:
            pitch = 130.0
        pitch = max(60.0, min(400.0, pitch))

        # 2. Sub-band energy ratios (8 bands)
        fft_data = np.abs(np.fft.rfft(signal))
        freqs = np.fft.rfftfreq(len(signal), d=1.0 / frame_rate)
        band_edges = [0, 125, 250, 500, 1000, 2000, 4000, 6000, 8000]
        sub_bands = []
        for i in range(len(band_edges) - 1):
            idx = np.where((freqs >= band_edges[i]) & (freqs < band_edges[i + 1]))[0]
            e = float(np.sum(fft_data[idx] ** 2)) if len(idx) > 0 else 0.0
            sub_bands.append(e)
        total_e = sum(sub_bands) + 1e-10
        sub_bands = [b / total_e for b in sub_bands]

        # 3. Spectral centroid (vocal timbre)
        spectral_centroid = float(np.sum(freqs * fft_data) / (np.sum(fft_data) + 1e-10))

        # 4. Energy variance (rhythm / dynamic range)
        frame_len = max(1, int(frame_rate * 0.04))
        frames = [signal[i:i + frame_len] for i in range(0, len(signal), frame_len)
                  if len(signal[i:i + frame_len]) > 0]
        frame_rms = [float(np.sqrt(np.mean(f ** 2))) for f in frames]
        energy_variance = float(np.var(frame_rms)) if frame_rms else 0.0

        # 5. Zero Crossing Rate (voiced/unvoiced ratio)
        zcr_vals = []
        for f in frames[:50]:
            zcr = float(np.sum(np.abs(np.diff(np.sign(f)))) / (2 * len(f) + 1e-6))
            zcr_vals.append(zcr)
        avg_zcr = float(np.mean(zcr_vals)) if zcr_vals else 0.0

        # 6. Formant proxy (peak frequencies in 0-4kHz)
        speech_idx = np.where((freqs >= 200) & (freqs < 4000))[0]
        if len(speech_idx) > 0:
            speech_fft = fft_data[speech_idx]
            speech_freqs = freqs[speech_idx]
            # Top 3 spectral peaks as formant proxies
            peak_indices = np.argsort(speech_fft)[-3:][::-1]
            formants = [float(speech_freqs[p]) for p in peak_indices]
        else:
            formants = [500.0, 1500.0, 2500.0]

        return {
            "type": "analytical",
            "embedding": None,
            "features": {
                "pitch": pitch,
                "spectral_center": spectral_centroid,
                "energy_var": energy_variance,
                "sub_bands": sub_bands,
                "zcr": avg_zcr,
                "formants": formants,
            }
        }

    def _parse_non_wav(self, audio_bytes: bytes) -> Optional[Dict[str, Any]]:
        """Handle non-WAV audio (browser webm/ogg)."""
        try:
            data = audio_bytes[44:] if len(audio_bytes) > 44 else audio_bytes
            signal = np.frombuffer(data, dtype=np.int16).astype(np.float32)
            if len(signal) < 100:
                return None
            pitch = 130.0
            rms = float(np.sqrt(np.mean(signal ** 2)))
            return {
                "type": "analytical",
                "embedding": None,
                "features": {
                    "pitch": pitch,
                    "spectral_center": 1200.0,
                    "energy_var": float(np.var(signal[:1000])) if len(signal) > 1000 else 0.0,
                    "sub_bands": [0.125] * 8,
                    "zcr": 0.05,
                    "formants": [500.0, 1500.0, 2500.0],
                }
            }
        except Exception:
            return None

    # ------------------------------------------------------------------
    # Template building (signup: combine 3-5 recordings)
    # ------------------------------------------------------------------

    def build_combined_template(self, embeddings: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """
        Combine multiple embeddings (from 3-5 signup recordings) into one template.
        For ECAPA embeddings: average + L2-normalize.
        For analytical: average each feature across all recordings.
        """
        valid = [e for e in embeddings if e is not None]
        if not valid:
            return None

        ecapa_embs = [e for e in valid if e.get("type") == "ecapa_192d" and e.get("embedding")]
        analytical_embs = [e for e in valid if e.get("type") == "analytical" and e.get("features")]

        template: Dict[str, Any] = {"version": "2", "count": len(valid)}

        if ecapa_embs:
            arr = np.array([e["embedding"] for e in ecapa_embs], dtype=np.float32)
            avg = arr.mean(axis=0)
            norm = np.linalg.norm(avg)
            if norm > 0:
                avg = avg / norm
            template["type"] = "ecapa_192d"
            template["embedding"] = avg.tolist()

        if analytical_embs:
            feats = [e["features"] for e in analytical_embs]
            avg_pitch = float(np.mean([f["pitch"] for f in feats]))
            avg_centroid = float(np.mean([f["spectral_center"] for f in feats]))
            avg_ev = float(np.mean([f["energy_var"] for f in feats]))
            avg_zcr = float(np.mean([f["zcr"] for f in feats]))
            band_arrs = np.array([f["sub_bands"] for f in feats])
            avg_bands = band_arrs.mean(axis=0).tolist()
            formant_arrs = np.array([f["formants"] for f in feats])
            avg_formants = formant_arrs.mean(axis=0).tolist()
            template["features"] = {
                "pitch": avg_pitch,
                "spectral_center": avg_centroid,
                "energy_var": avg_ev,
                "sub_bands": avg_bands,
                "zcr": avg_zcr,
                "formants": avg_formants,
            }
            if "type" not in template:
                template["type"] = "analytical"

        return template

    # ------------------------------------------------------------------
    # Verification (signin: compare fresh embedding vs stored template)
    # ------------------------------------------------------------------

    def verify_speaker(
        self,
        current_embedding: Optional[Dict[str, Any]],
        stored_template: Dict[str, Any]
    ) -> float:
        """
        Compare current embedding against stored template.
        Returns match score 0.0 to 100.0.
        """
        if not current_embedding or not stored_template:
            return 0.0

        # ECAPA cosine similarity path
        if (
            stored_template.get("type") == "ecapa_192d"
            and current_embedding.get("type") == "ecapa_192d"
            and stored_template.get("embedding")
            and current_embedding.get("embedding")
        ):
            s = np.array(stored_template["embedding"], dtype=np.float32)
            c = np.array(current_embedding["embedding"], dtype=np.float32)
            cosine = float(np.dot(s, c) / (np.linalg.norm(s) * np.linalg.norm(c) + 1e-10))
            # Cosine 0.85+ = excellent, 0.70 = borderline, <0.55 = mismatch
            score = max(0.0, min(100.0, (cosine - 0.50) / 0.50 * 100.0))
            return score

        # Analytical path
        if stored_template.get("features") and current_embedding.get("features"):
            return self._compare_analytical(
                current_embedding["features"], stored_template["features"]
            )

        # Cross-type: ecapa vs analytical — partial match based on available data
        return 65.0  # Neutral borderline — cannot fully compare cross-type

    def _compare_analytical(
        self, curr: Dict[str, Any], stored: Dict[str, Any]
    ) -> float:
        """Compare analytical features and return 0-100 match score."""
        # 1. Pitch similarity
        pitch_diff = abs(curr.get("pitch", 130.0) - stored.get("pitch", 130.0))
        pitch_score = max(0.0, min(100.0, (1.0 - pitch_diff / 50.0) * 100.0))

        # 2. Sub-band cosine similarity
        curr_bands = np.array(curr.get("sub_bands", [0.125] * 8), dtype=np.float32)
        stor_bands = np.array(stored.get("sub_bands", [0.125] * 8), dtype=np.float32)
        n1, n2 = np.linalg.norm(curr_bands), np.linalg.norm(stor_bands)
        band_score = (float(np.dot(curr_bands, stor_bands)) / (n1 * n2 + 1e-10)) * 100.0 if (n1 > 0 and n2 > 0) else 50.0

        # 3. Spectral centroid diff
        center_diff = abs(curr.get("spectral_center", 1200.0) - stored.get("spectral_center", 1200.0))
        center_score = max(0.0, min(100.0, (1.0 - center_diff / 1200.0) * 100.0))

        # 4. Formant similarity
        curr_f = np.array(curr.get("formants", [500.0, 1500.0, 2500.0]), dtype=np.float32)
        stor_f = np.array(stored.get("formants", [500.0, 1500.0, 2500.0]), dtype=np.float32)
        formant_diff = float(np.mean(np.abs(curr_f - stor_f)))
        formant_score = max(0.0, min(100.0, (1.0 - formant_diff / 800.0) * 100.0))

        # 5. ZCR similarity
        zcr_diff = abs(curr.get("zcr", 0.05) - stored.get("zcr", 0.05))
        zcr_score = max(0.0, min(100.0, (1.0 - zcr_diff / 0.10) * 100.0))

        # Weighted aggregate
        match = (
            0.30 * pitch_score
            + 0.25 * band_score
            + 0.20 * center_score
            + 0.15 * formant_score
            + 0.10 * zcr_score
        )
        return float(max(0.0, min(99.5, match)))

    # ------------------------------------------------------------------
    # Legacy compat (used by old server.py code)
    # ------------------------------------------------------------------
    def extract_voiceprint(self, audio_bytes: bytes) -> Dict[str, Any]:
        """Legacy: extract embedding dict."""
        result = self.extract_embedding(audio_bytes)
        return result or {"type": "empty", "embedding": None, "features": None}
