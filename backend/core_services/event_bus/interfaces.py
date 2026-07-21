from abc import ABC, abstractmethod
from typing import Callable, Any, Awaitable

class EventBus(ABC):
    @abstractmethod
    async def publish(self, event_name: str, payload: dict) -> None:
        """Publish an event to the bus."""
        pass

    @abstractmethod
    async def subscribe(self, event_name: str, handler: Callable[[dict], Awaitable[None]]) -> None:
        """Subscribe to an event with an async handler."""
        pass

    @abstractmethod
    async def unsubscribe(self, event_name: str, handler: Callable[[dict], Awaitable[None]]) -> None:
        """Unsubscribe a handler from an event."""
        pass
