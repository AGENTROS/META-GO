from abc import ABC, abstractmethod
from typing import Dict, Any, Tuple

class BiometricProvider(ABC):
    @abstractmethod
    async def check_liveness(self, payload: bytes, metadata: dict) -> Tuple[bool, float]:
        """Verify liveness before verification. Returns (is_live, confidence_score)."""
        pass

    @abstractmethod
    async def extract_template(self, payload: bytes) -> bytes:
        """Extract encrypted template. Raw data must be discarded after this."""
        pass

    @abstractmethod
    async def verify(self, template: bytes, stored_template: bytes) -> Tuple[bool, float]:
        """Verify a new template against a stored one."""
        pass

class FaceProvider(BiometricProvider):
    pass

class VoiceProvider(BiometricProvider):
    pass
