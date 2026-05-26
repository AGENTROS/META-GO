"""
Meta Go — On-chain Relayer
==========================
Submits real transactions to the local Hardhat node on behalf of users.
This is the "gasless" account-abstraction pattern: the user signs the intent
client-side, the backend pays gas and dispatches.

The backend uses the Hardhat default deployer (account #0) which is prefunded
with 10,000 ETH on chain 31337. In production this would be replaced with a
KMS-managed key on Polygon Amoy/Mainnet.
"""
import json
import os
import time
from typing import Dict, Any, Optional

from web3 import Web3
from eth_account import Account

HARDHAT_RPC = os.environ.get("HARDHAT_RPC", "http://127.0.0.1:8545")
# Account #0 from `npx hardhat node` — prefunded, well-known, dev only.
DEPLOYER_KEY = os.environ.get(
    "DEPLOYER_KEY",
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
)

ADDR_FILE = "/app/contracts-hardhat/deployed-addresses.json"

# Minimal ABIs
SBT_ABI = json.loads(
    """[
    {"inputs":[{"internalType":"address","name":"to","type":"address"},
               {"internalType":"string","name":"domain","type":"string"},
               {"internalType":"string","name":"uri","type":"string"}],
     "name":"mint","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],
     "stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"address","name":"","type":"address"}],
     "name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],
     "stateMutability":"view","type":"function"},
    {"anonymous":false,"inputs":[
       {"indexed":true,"internalType":"address","name":"to","type":"address"},
       {"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"},
       {"indexed":false,"internalType":"string","name":"domain","type":"string"}],
     "name":"Minted","type":"event"}
]"""
)


class RelayerClient:
    """Singleton-style on-chain relayer."""

    def __init__(self):
        self.w3: Optional[Web3] = None
        self.addresses: Dict[str, str] = {}
        self.deployer_addr: Optional[str] = None
        self._init()

    def _init(self):
        try:
            self.w3 = Web3(Web3.HTTPProvider(HARDHAT_RPC, request_kwargs={"timeout": 5}))
            if not self.w3.is_connected():
                self.w3 = None
                return
            if os.path.exists(ADDR_FILE):
                data = json.load(open(ADDR_FILE))
                self.addresses = data.get("contracts", {})
            acct = Account.from_key(DEPLOYER_KEY)
            self.deployer_addr = acct.address
        except Exception:
            self.w3 = None

    def available(self) -> bool:
        return self.w3 is not None and bool(self.addresses)

    def mint_sbt(self, recipient: str, domain: str, uri: str) -> Dict[str, Any]:
        if not self.available():
            return {"ok": False, "reason": "relayer-unavailable", "mode": "simulation"}
        try:
            sbt_addr = self.addresses["CelestialSBT"]
            contract = self.w3.eth.contract(
                address=Web3.to_checksum_address(sbt_addr), abi=SBT_ABI
            )
            recipient_cs = Web3.to_checksum_address(recipient)
            nonce = self.w3.eth.get_transaction_count(self.deployer_addr)
            tx = contract.functions.mint(recipient_cs, domain, uri).build_transaction({
                "from": self.deployer_addr,
                "nonce": nonce,
                "gas": 500_000,
                "gasPrice": self.w3.eth.gas_price,
                "chainId": self.w3.eth.chain_id,
            })
            signed = Account.sign_transaction(tx, DEPLOYER_KEY)
            tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=20)
            token_id = None
            try:
                logs = contract.events.Minted().process_receipt(receipt)
                if logs:
                    token_id = int(logs[0]["args"]["tokenId"])
            except Exception:
                pass
            return {
                "ok": receipt.status == 1,
                "mode": "real",
                "txHash": tx_hash.hex(),
                "tokenId": token_id,
                "blockNumber": receipt.blockNumber,
                "gasUsed": receipt.gasUsed,
                "contract": sbt_addr,
                "chainId": self.w3.eth.chain_id,
            }
        except Exception as e:
            return {"ok": False, "reason": str(e), "mode": "error"}

    def get_balance(self, address: str) -> Optional[int]:
        if not self.available():
            return None
        try:
            sbt_addr = self.addresses["CelestialSBT"]
            contract = self.w3.eth.contract(
                address=Web3.to_checksum_address(sbt_addr), abi=SBT_ABI
            )
            return int(contract.functions.balanceOf(Web3.to_checksum_address(address)).call())
        except Exception:
            return None


# Singleton
relayer = RelayerClient()
