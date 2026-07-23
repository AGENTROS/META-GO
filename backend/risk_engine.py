class BiometricRiskEngine:
    """
    Biometric Risk Scoring Engine.
    Combines Face Match, Face Liveness, Voice print matching, Whisper accuracy,
    DeepfakeBench probability, and AASIST audio spoof risks to compute a unified
    Final Trust Score and risk classification level.
    """

    def __init__(
        self,
        face_weight=0.35,
        voice_weight=0.30,
        liveness_weight=0.20,
        accuracy_weight=0.15,
    ):
        self.face_weight = face_weight
        self.voice_weight = voice_weight
        self.liveness_weight = liveness_weight
        self.accuracy_weight = accuracy_weight

    def calculate_trust_score(
        self,
        face_match_score: float,
        face_liveness_score: float,
        voice_match_score: float,
        speech_accuracy_score: float,
        deepfake_risk_score: float,
        voice_spoof_risk_score: float,
    ) -> tuple[float, str, dict]:
        """
        Calculates the Final Trust Score and Risk Level.
        Returns:
            final_trust_score: float (0.0 to 100.0)
            risk_level: str ('LOW RISK', 'MEDIUM RISK', 'HIGH RISK')
            breakdown: dict of details
        """
        # Ensure all scores are floating point numbers within boundary [0.0, 100.0]
        f_match = max(0.0, min(100.0, face_match_score))
        f_live = max(0.0, min(100.0, face_liveness_score))
        v_match = max(0.0, min(100.0, voice_match_score))
        s_acc = max(0.0, min(100.0, speech_accuracy_score))
        df_risk = max(0.0, min(100.0, deepfake_risk_score))
        v_spoof = max(0.0, min(100.0, voice_spoof_risk_score))

        # 1. Base Biometric Performance (Weighted average of positive matches)
        base_trust = (
            (f_match * self.face_weight)
            + (v_match * self.voice_weight)
            + (f_live * self.liveness_weight)
            + (s_acc * self.accuracy_weight)
        )

        # 2. Risk Penalties (Visual Deepfake & Voice Spoofing)
        # Deepfake risk reduces the base trust score
        df_penalty = df_risk * 0.4

        # Voice spoof risk (cloning, replay attacks) reduces it
        spoof_penalty = v_spoof * 0.3

        final_trust_score = base_trust - df_penalty - spoof_penalty

        # 3. Critical Security Threshold Overrides (Gatekeepers)
        # If face spoofing is verified, or deepfake probability is extremely high, fail the session immediately
        is_override = False
        override_reason = ""

        if (
            f_live < 45.0
        ):  # High probability of face liveness check failure (printed photo/screen)
            final_trust_score = min(final_trust_score, 35.0)
            is_override = True
            override_reason = "Face Liveness Failure"

        if df_risk > 70.0:  # Critical deepfake risk
            final_trust_score = min(final_trust_score, 30.0)
            is_override = True
            override_reason = "High Deepfake Risk Flagged"

        if v_spoof > 65.0:  # Synthesized/cloned speech detected
            final_trust_score = min(final_trust_score, 35.0)
            is_override = True
            override_reason = "Voice Spoof Attempt Flagged"

        # Bound the trust score to [0.0, 100.0]
        final_trust_score = max(0.0, min(100.0, final_trust_score))

        # 4. Risk Level Classification
        # 95 - 100: LOW RISK
        # 80 - 94: MEDIUM RISK
        # Below 80: HIGH RISK
        if final_trust_score >= 95.0:
            risk_level = "LOW RISK"
        elif final_trust_score >= 80.0:
            risk_level = "MEDIUM RISK"
        else:
            risk_level = "HIGH RISK"

        breakdown = {
            "base_score": float(round(base_trust, 2)),
            "penalties": {
                "deepfake_penalty": float(round(df_penalty, 2)),
                "voice_spoof_penalty": float(round(spoof_penalty, 2)),
            },
            "override_applied": is_override,
            "override_reason": override_reason,
        }

        return float(round(final_trust_score, 2)), risk_level, breakdown
