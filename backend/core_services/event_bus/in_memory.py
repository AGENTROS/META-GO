import asyncio
from typing import Callable, Awaitable, Dict, List
from .interfaces import EventBus


class InMemoryEventBus(EventBus):
    def __init__(self):
        self._subscribers: Dict[str, List[Callable[[dict], Awaitable[None]]]] = {}

    async def publish(self, event_name: str, payload: dict) -> None:
        if event_name in self._subscribers:
            handlers = self._subscribers[event_name]
            tasks = [asyncio.create_task(handler(payload)) for handler in handlers]
            if tasks:
                await asyncio.gather(*tasks, return_exceptions=True)

    async def subscribe(
        self, event_name: str, handler: Callable[[dict], Awaitable[None]]
    ) -> None:
        if event_name not in self._subscribers:
            self._subscribers[event_name] = []
        if handler not in self._subscribers[event_name]:
            self._subscribers[event_name].append(handler)

    async def unsubscribe(
        self, event_name: str, handler: Callable[[dict], Awaitable[None]]
    ) -> None:
        if event_name in self._subscribers:
            if handler in self._subscribers[event_name]:
                self._subscribers[event_name].remove(handler)
