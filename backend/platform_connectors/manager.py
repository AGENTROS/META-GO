from typing import Dict, Type, Any
from .base import PlatformConnector

class ConnectorManager:
    def __init__(self):
        self.connectors: Dict[str, Type[PlatformConnector]] = {}
        self._active_sessions: Dict[str, PlatformConnector] = {}

    def register(self, platform_id: str, connector_class: Type[PlatformConnector]):
        self.connectors[platform_id] = connector_class

    def get_connector_class(self, platform_id: str) -> Type[PlatformConnector]:
        return self.connectors.get(platform_id)

    async def establish_session(self, session_id: str, platform_id: str, transport: Any) -> PlatformConnector:
        cls = self.get_connector_class(platform_id)
        if not cls:
            raise ValueError(f"Connector for {platform_id} not found")
        connector = cls()
        await connector.initialize()
        await connector.connect(transport)
        await connector.subscribe_events()
        self._active_sessions[session_id] = connector
        return connector

    async def terminate_session(self, session_id: str):
        connector = self._active_sessions.pop(session_id, None)
        if connector:
            await connector.disconnect()
            await connector.shutdown()

connector_manager = ConnectorManager()
