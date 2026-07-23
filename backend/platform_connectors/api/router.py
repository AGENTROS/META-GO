import uuid
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ..manager import connector_manager
from ..transport.websocket import WebSocketTransport
from ..unity.connector import UnityConnector
from ..unreal.connector import UnrealConnector
from ..roblox.connector import RobloxConnector
from ..decentraland.connector import DecentralandConnector

logger = logging.getLogger("metago.connectors.api")

router = APIRouter()
connector_manager.register("unity", UnityConnector)
connector_manager.register("unreal", UnrealConnector)
connector_manager.register("roblox", RobloxConnector)
connector_manager.register("decentraland", DecentralandConnector)


@router.websocket("/{platform_id}/stream")
async def platform_stream(websocket: WebSocket, platform_id: str):
    await websocket.accept()
    transport = WebSocketTransport(websocket)

    ConnectorClass = connector_manager.get_connector_class(platform_id)
    if not ConnectorClass:
        await transport.close()
        return

    connector = ConnectorClass()
    await connector.initialize()
    await connector.connect(transport)
    await connector.subscribe_events()

    try:
        while True:
            data = await transport.receive()
            event = data.get("event")
            if event == "Auth.Request":
                await connector.authenticate(data.get("payload", {}))
    except Exception as e:
        logger.error(f"WebSocket stream error: {e}")
    finally:
        await connector.shutdown()
        await connector.disconnect()
