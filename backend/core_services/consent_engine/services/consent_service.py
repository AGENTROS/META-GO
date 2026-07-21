from typing import List
from ..models.consent import ConsentModel
from ..interfaces.consent_repo import ConsentRepository
from core_services.event_bus.interfaces import EventBus
from datetime import datetime

class ConsentService:
    def __init__(self, repo: ConsentRepository, event_bus: EventBus):
        self.repo = repo
        self.event_bus = event_bus

    async def grant_consent(self, did: str, purpose: str, platform: str, data_requested: List[str], duration: int) -> ConsentModel:
        consent = ConsentModel(
            did=did,
            purpose=purpose,
            platform=platform,
            data_requested=data_requested,
            duration_seconds=duration,
            audit_trail=[{"action": "GRANTED", "timestamp": datetime.utcnow().isoformat()}]
        )
        await self.repo.save(consent)
        
        await self.event_bus.publish("Consent.Granted", {
            "version": "v1",
            "consent_id": consent.consent_id,
            "did": did,
            "platform": platform
        })
        return consent

    async def revoke_consent(self, consent_id: str) -> bool:
        consent = await self.repo.get_by_id(consent_id)
        if consent and not consent.is_revoked:
            consent.revoke()
            await self.repo.update(consent)
            
            await self.event_bus.publish("Consent.Revoked", {
                "version": "v1",
                "consent_id": consent_id,
                "did": consent.did
            })
            return True
        return False
