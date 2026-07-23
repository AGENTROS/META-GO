from .base import BaseTransport
from fastapi import WebSocket, WebSocketDisconnect
import logging

logger = logging.getLogger("metago.transport.websocket")


class WebSocketTransport(BaseTransport):
    def __init__(self, websocket: WebSocket):
        self.websocket = websocket

    async def send(self, data):
        try:
            await self.websocket.send_json(data)
        except Exception as e:
            logger.error(f"Failed to send: {e}")

    async def receive(self):
        try:
            return await self.websocket.receive_json()
        except WebSocketDisconnect:
            raise ConnectionError("WebSocket disconnected")

    async def close(self):
        await self.websocket.close()
