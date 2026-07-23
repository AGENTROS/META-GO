import logging
from typing import Dict, Any
from ..base import PlatformConnector

logger = logging.getLogger("metago.connectors.unity")


class UnityConnector(PlatformConnector):
    async def initialize(self) -> None:
        self.transport = None
        self.authenticated = False
        logger.info("Unity Connector initialized.")

    async def connect(self, transport: Any) -> None:
        self.transport = transport
        logger.info("Unity Connector bound to transport.")

    async def authenticate(self, payload: Dict[str, Any]) -> bool:
        token = payload.get("token")
        try:
            import jwt
            from config import cfg

            secret = (
                cfg.JWT_SECRET
                or "metago_secure_default_test_jwt_secret_key_32_bytes_long_2026"
            )

            decoded = jwt.decode(token, secret, algorithms=["HS256"])
            self.wallet_address = decoded.get("walletAddress")
            self.authenticated = True

            await self.transport.send(
                {
                    "event": "Auth.Success",
                    "version": "1.0",
                    "payload": {
                        "status": "authenticated",
                        "wallet": self.wallet_address,
                    },
                }
            )

            # Synchronize identity, avatar, presence, credentials, passport
            await self.transport.send(
                {
                    "event": "Sync.Identity",
                    "version": "1.0",
                    "payload": {
                        "did": f"did:metago:{self.wallet_address}",
                        "status": "synchronized",
                    },
                }
            )
            await self.transport.send(
                {
                    "event": "Sync.Avatar",
                    "version": "1.0",
                    "payload": {"model": "default_humanoid", "status": "synchronized"},
                }
            )
            await self.transport.send(
                {
                    "event": "Sync.Presence",
                    "version": "1.0",
                    "payload": {"status": "online"},
                }
            )
            await self.transport.send(
                {
                    "event": "Sync.Credentials",
                    "version": "1.0",
                    "payload": {"count": 1, "status": "synchronized"},
                }
            )
            await self.transport.send(
                {
                    "event": "Sync.Passport",
                    "version": "1.0",
                    "payload": {"trustScore": 100, "status": "synchronized"},
                }
            )

            return True
        except Exception as e:
            logger.error(f"Failed to authenticate Unity client: {e}")
            await self.transport.send(
                {
                    "event": "Auth.Failed",
                    "version": "1.0",
                    "payload": {"error": "Invalid token"},
                }
            )
            return False

    async def sync_presence(self, payload: Dict[str, Any]) -> None:
        if self.transport:
            await self.transport.send(
                {"event": "Presence.Updated", "version": "1.0", "payload": payload}
            )

    async def subscribe_events(self) -> None:
        pass

    async def disconnect(self) -> None:
        if self.transport:
            await self.transport.close()

    async def shutdown(self) -> None:
        logger.info("Unity Connector shut down cleanly.")
