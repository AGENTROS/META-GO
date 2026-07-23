from abc import ABC, abstractmethod
from typing import List, Optional
from ..models.avatar import AvatarModel


class AvatarRepository(ABC):
    @abstractmethod
    async def save(self, avatar: AvatarModel) -> None:
        pass

    @abstractmethod
    async def get_by_id(self, avatar_id: str) -> Optional[AvatarModel]:
        pass

    @abstractmethod
    async def get_by_did(self, did: str) -> List[AvatarModel]:
        pass

    @abstractmethod
    async def update(self, avatar: AvatarModel) -> None:
        pass

    @abstractmethod
    async def delete(self, avatar_id: str) -> None:
        pass
