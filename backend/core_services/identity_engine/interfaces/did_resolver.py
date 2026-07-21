from abc import ABC, abstractmethod
from typing import Optional
from ..models.did import DIDModel

class DIDResolver(ABC):
    @abstractmethod
    async def resolve(self, did: str) -> Optional[dict]:
        """Resolve a DID to its DID Document or associated Identity."""
        pass
