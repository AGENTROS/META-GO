import logging

class PlatformConnector:
    async def initialize(self) -> None:
        pass
    async def connect(self, transport) -> None:
        pass
    async def authenticate(self, payload) -> bool:
        return False
    async def subscribe_events(self) -> None:
        pass
    async def disconnect(self) -> None:
        pass
    async def shutdown(self) -> None:
        pass
