from abc import ABC, abstractmethod
from typing import Dict, Any


class ZKProvider(ABC):
    @abstractmethod
    async def create_commitment(self, data: bytes, secret: bytes) -> str:
        """Create a cryptographic commitment for a biometric template."""
        pass

    @abstractmethod
    async def verify_commitment(
        self, commitment: str, data: bytes, secret: bytes
    ) -> bool:
        """Verify that the raw data and secret match the commitment."""
        pass

    @abstractmethod
    async def generate_proof(
        self, commitment: str, private_inputs: dict
    ) -> Dict[str, Any]:
        """Generate a zkSNARK proof."""
        pass

    @abstractmethod
    async def verify_proof(self, proof: Dict[str, Any], public_signals: list) -> bool:
        """Verify a zkSNARK proof."""
        pass
