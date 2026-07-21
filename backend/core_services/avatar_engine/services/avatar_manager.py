from typing import Dict, Any, Optional
from ..models.avatar import AvatarModel
from ..interfaces.avatar_repo import AvatarRepository
from ..interfaces.avatar_provider import AvatarProvider
from .validator import AvatarValidator
from core_services.event_bus.interfaces import EventBus

class AvatarManager:
    def __init__(self, repo: AvatarRepository, event_bus: EventBus):
        self.repo = repo
        self.event_bus = event_bus
        self.providers: Dict[str, AvatarProvider] = {}

    def register_provider(self, provider: AvatarProvider):
        self.providers[provider.provider_name] = provider

    async def create_avatar(self, did: str, provider_name: str, params: dict) -> AvatarModel:
        if provider_name not in self.providers:
            raise ValueError(f"Provider {provider_name} not found.")

        provider = self.providers[provider_name]
        result = await provider.create_avatar(params)
        
        avatar = AvatarModel(
            did=did,
            provider=provider_name,
            asset_url=result["asset_url"],
            thumbnail=await provider.generate_thumbnail(result["provider_avatar_id"]),
            skeleton_type=result.get("skeleton_type", "humanoid"),
            metadata=result.get("metadata", {})
        )
        
        await self.repo.save(avatar)
        
        await self.event_bus.publish("Avatar.Created", {
            "avatar_id": avatar.avatar_id,
            "did": did,
            "provider": provider_name
        })
        return avatar

    async def import_avatar(self, did: str, provider_name: str, asset_url: str, metadata: dict) -> AvatarModel:
        AvatarValidator.validate_asset(asset_url, metadata)
        
        if provider_name not in self.providers:
            raise ValueError(f"Provider {provider_name} not found.")
            
        provider = self.providers[provider_name]
        result = await provider.import_avatar(asset_url)
        
        avatar = AvatarModel(
            did=did,
            provider=provider_name,
            asset_url=result["asset_url"],
            skeleton_type=metadata.get("skeleton_type", "humanoid"),
            metadata=metadata
        )
        
        await self.repo.save(avatar)
        
        await self.event_bus.publish("Avatar.Imported", {
            "avatar_id": avatar.avatar_id,
            "did": did,
            "asset_url": asset_url
        })
        return avatar

    async def get_avatar(self, avatar_id: str) -> Optional[AvatarModel]:
        return await self.repo.get_by_id(avatar_id)

    async def delete_avatar(self, avatar_id: str) -> None:
        avatar = await self.repo.get_by_id(avatar_id)
        if avatar:
            await self.repo.delete(avatar_id)
            await self.event_bus.publish("Avatar.Deleted", {
                "avatar_id": avatar_id,
                "did": avatar.did
            })
