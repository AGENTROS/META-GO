from typing import Optional
from datetime import datetime
from ..models.trust_score import TrustScoreModel
from ..interfaces.trust_repo import TrustRepository
from core_services.event_bus.interfaces import EventBus

class TrustService:
    def __init__(self, repo: TrustRepository, event_bus: EventBus):
        self.repo = repo
        self.event_bus = event_bus

    async def initialize_trust(self, did: str) -> TrustScoreModel:
        score = TrustScoreModel(did=did)
        await self.repo.save(score)
        return score

    async def update_humanity_score(self, did: str, score_delta: float) -> Optional[TrustScoreModel]:
        score = await self.repo.get_by_did(did)
        if score:
            score.humanity_score = min(100.0, max(0.0, score.humanity_score + score_delta))
            score.updated_at = datetime.utcnow()
            await self.repo.update(score)
            await self._publish_trust_update(score)
        return score

    async def increase_risk(self, did: str, risk_delta: float) -> Optional[TrustScoreModel]:
        score = await self.repo.get_by_did(did)
        if score:
            score.risk_score = min(100.0, score.risk_score + risk_delta)
            score.updated_at = datetime.utcnow()
            await self.repo.update(score)
            await self._publish_trust_update(score)
        return score

    async def get_trust_score(self, did: str) -> Optional[TrustScoreModel]:
        return await self.repo.get_by_did(did)

    async def _publish_trust_update(self, score: TrustScoreModel):
        await self.event_bus.publish("Trust.Updated", {
            "version": "v1",
            "did": score.did,
            "composite_score": score.composite_trust,
            "timestamp": score.updated_at.isoformat()
        })
