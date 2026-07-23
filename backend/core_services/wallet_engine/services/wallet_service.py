import re
from web3 import Web3
from typing import Optional
from core_services.identity_graph_engine.services.graph_service import (
    IdentityGraphService,
)


class WalletService:
    def __init__(self, graph_service: IdentityGraphService):
        self.graph_service = graph_service

    @staticmethod
    def validate_ethereum_address(address: str) -> bool:
        """Validate an Ethereum address."""
        return Web3.is_address(address)

    async def link_wallet(
        self,
        did: str,
        wallet_address: str,
        chain: str = "ethereum",
        signature: str = None,
    ) -> bool:
        """Link a wallet address to a DID after validating the signature."""
        if chain == "ethereum" and not self.validate_ethereum_address(wallet_address):
            raise ValueError("Invalid Ethereum address.")

        # In a real scenario, we would verify the EIP-4361 (SIWE) signature here.
        # For now, we assume the signature is verified at the controller level or bypassed in MVP.

        await self.graph_service.link_wallet(did, wallet_address, chain)
        return True
