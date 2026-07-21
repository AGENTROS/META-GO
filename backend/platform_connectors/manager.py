from typing import Dict, Type
from .base import PlatformConnector

class ConnectorManager:
    def __init__(self):
        self.connectors: Dict[str, Type[PlatformConnector]] = {}

    def register(self, platform_id: str, connector_class: Type[PlatformConnector]):
        self.connectors[platform_id] = connector_class

    def get_connector_class(self, platform_id: str) -> Type[PlatformConnector]:
        return self.connectors.get(platform_id)

connector_manager = ConnectorManager()
