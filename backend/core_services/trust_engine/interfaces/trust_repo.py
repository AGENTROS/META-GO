from abc import ABC, abstractmethod
from typing import Optional
from ..models.trust_score import TrustScoreModel

class TrustRepository(ABC):
    @abstractmethod
    async def save(self, score: TrustScoreModel) -> None:
        pass

    @abstractmethod
    async def get_by_did(self, did: str) -> Optional[TrustScoreModel]:
        pass

    @abstractmethod
    async def update(self, score: TrustScoreModel) -> None:
        pass
