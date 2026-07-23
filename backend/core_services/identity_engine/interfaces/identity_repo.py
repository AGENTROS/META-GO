from abc import ABC, abstractmethod
from typing import Optional
from ..models.passport import PassportModel


class IdentityRepository(ABC):
    @abstractmethod
    async def save(self, passport: PassportModel) -> None:
        pass

    @abstractmethod
    async def get_by_did(self, did: str) -> Optional[PassportModel]:
        pass

    @abstractmethod
    async def update(self, passport: PassportModel) -> None:
        pass
