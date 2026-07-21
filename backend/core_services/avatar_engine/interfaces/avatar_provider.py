from abc import ABC, abstractmethod
from typing import Dict, Any

class AvatarProvider(ABC):
    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @abstractmethod
    async def create_avatar(self, user_params: dict) -> Dict[str, Any]:
        """Initiate the creation of a new avatar."""
        pass

    @abstractmethod
    async def import_avatar(self, asset_url: str) -> Dict[str, Any]:
        """Import an existing avatar from an external URL."""
        pass

    @abstractmethod
    async def export_avatar(self, avatar_id: str) -> str:
        """Export avatar to a standard format (e.g., GLB URL)."""
        pass

    @abstractmethod
    async def generate_thumbnail(self, avatar_id: str) -> str:
        """Generate or fetch a 2D thumbnail URL for the avatar."""
        pass
