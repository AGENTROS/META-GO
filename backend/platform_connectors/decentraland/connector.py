import logging
from typing import Dict, Any
from ..base import PlatformConnector

logger = logging.getLogger("metago.connectors.decentraland")


class DecentralandConnector(PlatformConnector):
    async def initialize(self) -> None:
        self.transport = None
        self.authenticated = False
        logger.info("Decentraland Connector initialized.")

    async def connect(self, transport: Any) -> None:
        self.transport = transport
        logger.info("Decentraland Connector bound to transport.")

    async def authenticate(self, payload: Dict[str, Any]) -> bool:
        token = payload.get("token")
        try:
            import jwt
            import datetime
            import asyncio
            import requests
            from config import cfg
            from ws.manager import manager
            import server as b_server

            db = b_server.client[b_server.DB_NAME]
            secret = (
                cfg.JWT_SECRET
                or "metago_secure_default_test_jwt_secret_key_32_bytes_long_2026"
            )

            decoded = jwt.decode(token, secret, algorithms=["HS256"])
            self.wallet_address = decoded.get("walletAddress")
            self.authenticated = True

            # --- FETCH REAL DECENTRALAND PROFILE ---
            profile_url = f"https://peer.decentraland.org/lambdas/profiles?id={self.wallet_address.lower()}"

            def fetch_dcl_profile():
                try:
                    resp = requests.get(profile_url, timeout=5)
                    if resp.status_code == 200:
                        return resp.json()
                except Exception as e:
                    logger.error(f"DCL fetch error: {e}")
                return None

            dcl_data = await asyncio.to_thread(fetch_dcl_profile)

            avatar_name = "Guest"
            avatar_wearables = []
            if dcl_data and isinstance(dcl_data, list) and len(dcl_data) > 0:
                profile = dcl_data[0].get("avatars", [{}])[0]
                avatar_name = profile.get("name", "Guest")
                avatar_wearables = profile.get("avatar", {}).get("wearables", [])

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

            # Synchronize real identity & avatar
            await self.transport.send(
                {
                    "event": "Sync.Identity",
                    "version": "1.0",
                    "payload": {
                        "did": f"did:metago:{self.wallet_address}",
                        "name": avatar_name,
                        "status": "synchronized",
                    },
                }
            )
            await self.transport.send(
                {
                    "event": "Sync.Avatar",
                    "version": "1.0",
                    "payload": {
                        "model": f"dcl_avatar_{len(avatar_wearables)}_items",
                        "status": "synchronized",
                    },
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
                    "payload": {
                        "count": len(avatar_wearables),
                        "status": "synchronized",
                    },
                }
            )
            await self.transport.send(
                {
                    "event": "Sync.Passport",
                    "version": "1.0",
                    "payload": {"trustScore": 100, "status": "synchronized"},
                }
            )

            # 1. Update Database
            if db is not None:
                await db.avatar_deployments.insert_one(
                    {
                        "walletAddress": self.wallet_address.lower(),
                        "world": "Decentraland",
                        "status": "Active",
                        "avatar_id": f"DCL_{avatar_name}",
                        "interactions": len(avatar_wearables),
                        "time_spent_minutes": 1,
                        "created_at": datetime.datetime.now(
                            datetime.timezone.utc
                        ).isoformat(),
                        "updated_at": datetime.datetime.now(
                            datetime.timezone.utc
                        ).isoformat(),
                    }
                )

            # 2. Push Realtime Event
            await manager.broadcast_event(
                self.wallet_address.lower(),
                "notification",
                {
                    "message": f"⚡ Real DCL Sync: {avatar_name} connected with {len(avatar_wearables)} wearables."
                },
            )

            return True
        except Exception as e:
            logger.error(f"Failed to authenticate decentraland client: {e}")
            await self.transport.send(
                {
                    "event": "Auth.Failed",
                    "version": "1.0",
                    "payload": {"error": "Invalid token"},
                }
            )
            return False

    async def subscribe_events(self) -> None:
        pass

    async def disconnect(self) -> None:
        if self.transport:
            await self.transport.close()

    async def shutdown(self) -> None:
        logger.info("Decentraland Connector shut down cleanly.")
