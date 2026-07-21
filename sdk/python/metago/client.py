import asyncio
import json
import time
import logging
import websockets
from typing import Dict, Any, Callable

logger = logging.getLogger("metago.sdk")

class MetaGo:
    """
    Official Python SDK for the MetaGo Universal Protocol.
    Hides network I/O and provides clean domain methods to interact with the Event Bus.
    """
    def __init__(self, endpoint: str):
        self.endpoint = endpoint
        self.ws = None
        self._subscriptions: Dict[str, list[Callable]] = {}
        self._listen_task = None
        self._auth_future = None

    async def connect(self):
        """Connects to the MetaGo Transport Layer."""
        self.ws = await websockets.connect(self.endpoint)
        self._listen_task = asyncio.create_task(self._listen_loop())
        logger.info(f"Connected to MetaGo at {self.endpoint}")
        return self

    async def authenticate(self, token: str) -> bool:
        """Authenticates the session with the backend Guardian."""
        loop = asyncio.get_running_loop()
        self._auth_future = loop.create_future()
        
        await self._send("Auth.Request", {"token": token})
        
        # Wait for the backend to reply with Auth.Success or Auth.Failed
        result = await asyncio.wait_for(self._auth_future, timeout=5.0)
        return result

    async def sync_presence(self, position: list, rotation: list = None):
        """Pushes spatial presence vectors into the Global Event Bus."""
        await self._send("Presence.Update", {
            "position": position,
            "rotation": rotation or [0,0,0,1]
        })

    def subscribe(self, event_type: str, callback: Callable):
        """Registers a callback for server-pushed domain events."""
        if event_type not in self._subscriptions:
            self._subscriptions[event_type] = []
        self._subscriptions[event_type].append(callback)

    async def disconnect(self):
        """Safely tears down the connection and background loops."""
        if self._listen_task:
            self._listen_task.cancel()
        if self.ws:
            await self.ws.close()
        logger.info("Disconnected from MetaGo.")

    async def _send(self, event: str, payload: dict):
        if not self.ws:
            raise ConnectionError("Not connected to MetaGo.")
            
        envelope = {
            "version": "1.0",
            "event": event,
            "timestamp": time.time(),
            "payload": payload
        }
        await self.ws.send(json.dumps(envelope))

    async def _listen_loop(self):
        """Background coroutine that constantly pulls events off the WebSocket."""
        try:
            async for message in self.ws:
                data = json.loads(message)
                event_type = data.get("event")
                
                # Handle internal SDK callbacks first
                if event_type == "Auth.Success" and self._auth_future and not self._auth_future.done():
                    self._auth_future.set_result(True)
                elif event_type == "Auth.Failed" and self._auth_future and not self._auth_future.done():
                    self._auth_future.set_result(False)
                    
                # Dispatch to user subscriptions
                callbacks = self._subscriptions.get(event_type, [])
                for cb in callbacks:
                    if asyncio.iscoroutinefunction(cb):
                        await cb(data)
                    else:
                        cb(data)
                        
        except websockets.ConnectionClosed:
            logger.warning("MetaGo WebSocket closed by server.")
        except Exception as e:
            logger.error(f"MetaGo SDK Event Loop Error: {e}", exc_info=True)
