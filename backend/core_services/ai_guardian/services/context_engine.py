from typing import Dict, Any
from core_services.identity_engine.services.identity_service import IdentityService
from core_services.trust_engine.services.trust_service import TrustService


class ContextEngine:
    def __init__(self, identity_service: IdentityService, trust_service: TrustService):
        self.identity_service = identity_service
        self.trust_service = trust_service

    async def build_context(
        self, did: str, trigger_event: dict = None
    ) -> Dict[str, Any]:
        """Aggregate data to provide context to the Reasoning Engine."""
        passport = await self.identity_service.fetch_identity(did)
        trust = await self.trust_service.get_trust_score(did)

        return {
            "passport_status": passport.verification_status if passport else "unknown",
            "humanity_status": passport.humanity_status if passport else "unknown",
            "trust_score": trust.composite_trust if trust else 0.0,
            "fraud_probability": trust.fraud_probability if trust else 0.0,
            "trigger_event": trigger_event or {},
        }
