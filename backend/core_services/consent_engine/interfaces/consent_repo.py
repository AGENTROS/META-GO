from abc import ABC, abstractmethod
from typing import List
from ..models.consent import ConsentModel


class ConsentRepository(ABC):
    @abstractmethod
    async def save(self, consent: ConsentModel) -> None:
        pass

    @abstractmethod
    async def get_by_did(self, did: str) -> List[ConsentModel]:
        pass

    @abstractmethod
    async def get_by_id(self, consent_id: str) -> ConsentModel:
        pass

    @abstractmethod
    async def update(self, consent: ConsentModel) -> None:
        pass
