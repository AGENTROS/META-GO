import uuid
from datetime import datetime
from ..models.passport import PassportModel
from ..services.did_service import DIDService
from ..interfaces.identity_repo import IdentityRepository
from core_services.event_bus.interfaces import EventBus
from typing import Optional

class IdentityService:
    def __init__(self, repo: IdentityRepository, event_bus: EventBus):
        self.repo = repo
        self.event_bus = event_bus

    async def create_identity(self) -> PassportModel:
        did_obj = DIDService.generate_did()
        passport = PassportModel(
            did=did_obj.did,
            user_id=str(uuid.uuid4())
        )
        await self.repo.save(passport)
        
        await self.event_bus.publish("User.Created", {
            "version": "v1",
            "did": passport.did,
            "timestamp": datetime.utcnow().isoformat()
        })
        return passport

    async def fetch_identity(self, did: str) -> Optional[PassportModel]:
        return await self.repo.get_by_did(did)

    async def update_identity(self, passport: PassportModel) -> None:
        passport.updated_at = datetime.utcnow()
        await self.repo.update(passport)
        
        await self.event_bus.publish("User.Updated", {
            "version": "v1",
            "did": passport.did,
            "timestamp": passport.updated_at.isoformat()
        })

    async def disable_identity(self, did: str) -> None:
        passport = await self.repo.get_by_did(did)
        if passport:
            passport.verification_status = "disabled"
            await self.update_identity(passport)
            
            await self.event_bus.publish("User.Disabled", {
                "version": "v1",
                "did": did,
                "timestamp": datetime.utcnow().isoformat()
            })
