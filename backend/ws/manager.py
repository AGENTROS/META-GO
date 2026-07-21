import asyncio
import json
from typing import Dict, List, Any
from fastapi import WebSocket, WebSocketDisconnect
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Map wallet_address -> list of active WebSocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, wallet_address: str):
        await websocket.accept()
        address_lower = wallet_address.lower()
        if address_lower not in self.active_connections:
            self.active_connections[address_lower] = []
        self.active_connections[address_lower].append(websocket)
        logger.info(f"WebSocket connected for {address_lower}")

    def disconnect(self, websocket: WebSocket, wallet_address: str):
        address_lower = wallet_address.lower()
        if address_lower in self.active_connections:
            try:
                self.active_connections[address_lower].remove(websocket)
                if not self.active_connections[address_lower]:
                    del self.active_connections[address_lower]
                logger.info(f"WebSocket disconnected for {address_lower}")
            except ValueError:
                pass

    async def send_personal_message(self, message: str, wallet_address: str):
        address_lower = wallet_address.lower()
        if address_lower in self.active_connections:
            stale_connections = []
            for connection in self.active_connections[address_lower]:
                try:
                    await connection.send_text(message)
                except Exception as e:
                    logger.warning(f"Error sending to {address_lower}, removing stale socket: {e}")
                    stale_connections.append(connection)
            for stale in stale_connections:
                self.disconnect(stale, address_lower)

    async def broadcast_event(self, wallet_address: str, event_type: str, payload: dict):
        """
        Broadcast structured events like 'notification', 'security_alert', 'wallet_update'
        """
        message = json.dumps({
            "type": event_type,
            "payload": payload
        })
        await self.send_personal_message(message, wallet_address)

manager = ConnectionManager()
