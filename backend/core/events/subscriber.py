from typing import Protocol, Callable, Awaitable
from core.events.event import MetaGoEvent


class EventSubscriber(Protocol):
    """
    Protocol for any object that wishes to subscribe to the Global Event Bus.
    """

    async def handle_event(self, event: MetaGoEvent) -> None: ...


# Helper type for simple callback functions
EventCallback = Callable[[MetaGoEvent], Awaitable[None]]
