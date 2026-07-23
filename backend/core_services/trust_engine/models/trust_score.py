from pydantic import BaseModel, Field
from datetime import datetime


class TrustScoreModel(BaseModel):
    did: str
    humanity_score: float = 0.0  # E.g., based on liveness and biometrics
    identity_confidence: float = 0.0  # E.g., based on verified credentials
    wallet_trust: float = 0.0  # E.g., based on on-chain history
    credential_trust: float = 0.0
    social_trust: float = 0.0
    risk_score: float = 0.0
    fraud_probability: float = 0.0

    updated_at: datetime = Field(default_factory=datetime.utcnow)

    @property
    def composite_trust(self) -> float:
        """Calculate a composite score (example weights)."""
        base_trust = (
            self.humanity_score * 0.4
            + self.identity_confidence * 0.3
            + self.wallet_trust * 0.2
            + self.social_trust * 0.1
        )
        # Deduct risk
        adjusted = base_trust - (self.risk_score * 0.5) - (self.fraud_probability * 0.8)
        return max(0.0, min(100.0, adjusted))
