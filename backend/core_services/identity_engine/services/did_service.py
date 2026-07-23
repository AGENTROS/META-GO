import uuid
from ..models.did import DIDModel


class DIDService:
    @staticmethod
    def generate_did() -> DIDModel:
        """Generate a new W3C-compatible MetaGo DID."""
        unique_id = str(uuid.uuid4())
        return DIDModel(did=f"did:metago:{unique_id}")
