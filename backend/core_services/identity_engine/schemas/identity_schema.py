from pydantic import BaseModel
from typing import Optional


class WalletLinkRequest(BaseModel):
    did: str
    wallet_address: str
    chain: str = "ethereum"
    signature: Optional[str] = None
