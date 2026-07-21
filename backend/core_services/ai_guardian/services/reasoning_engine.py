from typing import List, Optional
from ..models.recommendation import GuardianRecommendationModel

class ReasoningEngine:
    def __init__(self):
        pass

    async def generate_recommendation(self, did: str, context: dict) -> Optional[GuardianRecommendationModel]:
        """Rule-based heuristics for generating explainable recommendations."""
        trigger = context.get("trigger_event", {})
        event_type = trigger.get("type")
        
        # Rule 1: Suspicious Wallet Connection
        if event_type == "Graph.WalletLinked":
            if context.get("fraud_probability", 0.0) > 30.0 or context.get("trust_score", 100.0) < 50.0:
                return GuardianRecommendationModel(
                    did=did,
                    action_suggested="Verify your newly linked wallet",
                    explanation="We noticed a new wallet connection on an account with a recent drop in trust score.",
                    confidence_score=92.5,
                    context_used=context
                )

        # Rule 2: Platform Join with Low Humanity
        if event_type == "Presence.WorldJoined":
            if context.get("humanity_status") == "pending":
                return GuardianRecommendationModel(
                    did=did,
                    action_suggested="Complete biometric verification",
                    explanation="You just joined a new platform but your humanity status is pending. Verifying will unlock more features.",
                    confidence_score=85.0,
                    context_used=context
                )
                
        return None
