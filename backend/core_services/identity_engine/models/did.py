import re
from typing import Optional
from pydantic import BaseModel, Field


class DIDModel(BaseModel):
    did: str

    @classmethod
    def validate_did(cls, did: str) -> bool:
        """Validate if a string is a properly formatted MetaGo DID."""
        pattern = (
            r"^did:metago:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
        )
        return bool(re.match(pattern, did))
